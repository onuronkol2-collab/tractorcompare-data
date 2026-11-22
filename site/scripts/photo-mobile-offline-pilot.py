#!/usr/bin/env python3
"""Bounded, non-publishing offline image-quality pilot using Pillow.

Reads only 3 hard-pinned, already public/rights-reviewed TractorVS JPEG URLs.
Creates *artifact-only* 720px JPEG/WebP derivatives with original attribution.
Never changes the site, Worker image endpoints, database or live srcset.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
from io import BytesIO
import json
import math
from pathlib import Path
import tempfile
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from PIL import Image, ImageOps, ImageChops, ImageStat

PILOT_IDS = (
    "belarus-80-1-nikolai-bulykin-kosmos-2026",
    "antonio-carraro-tigre-3800-439af04e",
    "new-holland-t5-110-pere-igor-2016",
)
MAX_SOURCE_BYTES = 3_000_000
MAX_DECODED_PIXELS = 15_000_000
TARGET_WIDTH = 720


class RestrictedRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urlsplit(newurl)
        if parsed.scheme != "https" or parsed.netloc != "tractorvs.com":
            raise ValueError("Photo request redirected off TractorVS")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def validate_manifest(data: dict) -> list[dict]:
    if not isinstance(data, dict) or data.get("publishAllowed") is not False or (
        data.get("kind") != "tractorvs-public-licensed-mobile-photo-pilot"
        or data.get("version") != 1 or data.get("expectedFiles") != 3
    ):
        raise ValueError("Input manifest was not produced by reviewed pilot selector")
    selected = data.get("selected")
    if not isinstance(selected, list) or len(selected) != 3 or {
        item.get("fileId") for item in selected if isinstance(item, dict)
    } != set(PILOT_IDS):
        raise ValueError("Expected exactly three distinct reviewed images")
    for item in selected:
        ident = item["fileId"]
        if (item.get("firstParty960") !=
                "https://tractorvs.com/images/tractors/" + ident + "-960.jpg"
            or item.get("expectedMime") != "image/jpeg"
            or item.get("configurationExact") is not False
            or item.get("licenseName") not in {"CC BY-SA 3.0", "CC BY-SA 4.0"}
            or item.get("licenseUrl") != "https://creativecommons.org/licenses/by-sa/" +
               item["licenseName"][-3:] + "/"
            or not str(item.get("sourcePage", "")).startswith(
                "https://commons.wikimedia.org/wiki/File:")
            or not str(item.get("photographer", "")).strip()
            or not str(item.get("brand", "")).strip()
            or not str(item.get("model", "")).strip()):
            raise ValueError("Pilot source/rights/identity mismatch: " + ident)
    return selected


def fetch_jpeg(url: str) -> bytes:
    request = Request(url, headers={
        "Accept": "image/jpeg",
        "User-Agent": "TractorVS-offline-pilot/1.0 (https://tractorvs.com/)",
    })
    with build_opener(RestrictedRedirect()).open(request, timeout=20) as response:
        if response.status != 200:
            raise ValueError("JPEG source HTTP " + str(response.status))
        if "image/jpeg" not in response.headers.get("Content-Type", "").lower():
            raise ValueError("JPEG source served non-image content")
        payload = response.read(MAX_SOURCE_BYTES + 1)
    if (len(payload) < 10_000 or len(payload) > MAX_SOURCE_BYTES
        or not payload.startswith(bytes.fromhex("ffd8"))
        or not payload.endswith(bytes.fromhex("ffd9"))):
        raise ValueError("JPEG source missing/oversized/corrupt")
    return payload


def psnr(reference: Image.Image, image: Image.Image) -> float:
    diff = ImageChops.difference(reference.convert("RGB"), image.convert("RGB"))
    squares = ImageStat.Stat(diff)
    mse = sum(v*v for v in squares.rms) / 3
    return float("inf") if mse == 0 else 10*math.log10(255*255/mse)


def derive(image_bytes: bytes, item: dict, destination: Path) -> dict:
    ident = item["fileId"]
    with Image.open(BytesIO(image_bytes)) as opened:
        if opened.format != "JPEG":
            raise ValueError("Unexpected source format: " + ident)
        opened.load()
        source = ImageOps.exif_transpose(opened).convert("RGB")
    if (source.width != 960 or source.height < 100 or
        source.width*source.height > MAX_DECODED_PIXELS):
        raise ValueError("Unexpected published 960px image dimensions: " + ident)
    scaled = source.resize(
        (TARGET_WIDTH, round(source.height*TARGET_WIDTH/source.width)),
        Image.Resampling.LANCZOS,
    )
    results = []
    for fmt, ext, settings in [
        ("JPEG", ".jpg", {"quality": 82, "optimize": True, "progressive": True,
                          "subsampling": 0}),
        ("WEBP", ".webp", {"quality": 80, "method": 6}),
    ]:
        out_path = destination / (ident + "-720" + ext)
        if out_path.exists():
            raise ValueError("Refusing to overwrite an existing output: " + str(out_path))
        scaled.save(out_path, format=fmt, **settings)
        rendered = out_path.read_bytes()
        if (len(rendered) >= len(image_bytes)
            or len(rendered) < 500 or
            (fmt == "JPEG" and not rendered.startswith(bytes.fromhex("ffd8")))
            or (fmt == "WEBP" and rendered[:4] != b"RIFF")):
            raise ValueError("Pilot derivative is not a smaller valid image: " + ident)
        with Image.open(BytesIO(rendered)) as converted:
            converted.load()
            if converted.size != scaled.size or converted.format != fmt:
                raise ValueError("Derivative dimensions or MIME changed: " + ident)
            score = psnr(scaled, converted)
        if score < 28.0:
            raise ValueError("Pilot derivative visual quality below 28dB: " + ident)
        results.append({
            "format": fmt.lower(), "file": out_path.name,
            "width": scaled.width, "height": scaled.height,
            "bytes": len(rendered), "sha256": sha256(rendered).hexdigest(),
            "psnrDb": round(score, 2),
            "estimatedReductionPercent": round(100*(1-len(rendered)/len(image_bytes)), 1),
        })
    return {
        "fileId": ident, "brand": item["brand"], "model": item["model"],
        "photoSource": item["sourcePage"], "photographer": item["photographer"],
        "licenseName": item["licenseName"], "licenseUrl": item["licenseUrl"],
        "configurationExact": False,
        "source960Sha256": sha256(image_bytes).hexdigest(),
        "source960Bytes": len(image_bytes),
        "derivatives": results,
        "adaptationNote": "Image resized and re-encoded for offline QA; NOT published",
        "publishApproved": False,
    }


def run(manifest: dict, folder: Path, source_loader=fetch_jpeg) -> list[dict]:
    reviewed = validate_manifest(manifest)
    folder.mkdir(parents=True, exist_ok=True)
    if list(folder.iterdir()):
        raise ValueError("Output folder must be empty; refusing partial replacement")
    records = []
    for item in reviewed:
        payload = source_loader(item["firstParty960"])
        records.append(derive(payload, item, folder))
    report = {
        "kind": "tractorvs-offline-photo-QA",
        "publishAllowed": False, "upstreamRequestCount": len(reviewed),
        "source": "existing first-party, public, licensed 960px JPEG",
        "output": records,
    }
    (folder/"report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False)+"\n")
    lines = [
        "# TractorVS — offline resized photograph QA, NOT published",
        "",
        "The exact image file identities are pinned to previously approved Commons files.",
        "Derived images are resizing and format adaptations. Existing photographer",
        "credit and original Creative Commons BY-SA license apply; no copyright",
        "ownership is asserted for TractorVS. These files have not been deployed.",
        "",
    ]
    for record in records:
        lines += [
            "## " + record["brand"] + " " + record["model"],
            "- Original: " + record["photoSource"],
            "- Photographer: " + record["photographer"],
            "- License: " + record["licenseName"] + " — " + record["licenseUrl"],
            "- Modification: resized to 720px and JPEG/WebP compressed for QA only",
            "- Source 960px SHA-256: " + record["source960Sha256"],
            "- Adapted JPEG/WebP: " + ", ".join(r["file"] for r in record["derivatives"]),
            "- Representative configuration; not asserted as the exact model variant",
            "",
        ]
    (folder/"ATTRIBUTION.md").write_text("\n".join(lines), encoding="utf8")
    return records


def self_test() -> None:
    photo = Image.new("RGB", (960, 600))
    # Smooth, photographic-like gradient validates the pixel pipeline without\n    # abusing high-frequency modulo noise unlike real tractor photographs.
    pixels = photo.load()
    for y in range(600):
        for x in range(960):
            pixels[x, y] = (int(30+150*x/960), int(35+160*y/600), int(50+100*(x+y)/1560))
    buffer = BytesIO()
    photo.save(buffer, "JPEG", quality=93)
    item = {
        "fileId": PILOT_IDS[0], "brand": "Test", "model": "Source",
        "sourcePage": "https://commons.wikimedia.org/wiki/File:Test.jpg",
        "photographer": "Test author", "licenseName": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    }
    with tempfile.TemporaryDirectory() as folder:
        result = derive(buffer.getvalue(), item, Path(folder))
        assert len(result["derivatives"]) == 2
        assert all(v["width"] == 720 and v["psnrDb"] >= 28
                   for v in result["derivatives"])
    print("TRACTORVS_OFFLINE_PHOTO_SELF_TEST_PASS")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.input or not args.output:
        parser.error("--input and --output are required")
    records = run(json.loads(args.input.read_text()), args.output)
    for record in records:
        print("TRACTORVS_OFFLINE_PHOTO_QA " + json.dumps(record, ensure_ascii=False))
    print("TRACTORVS_OFFLINE_PHOTO_QA_SUMMARY " + json.dumps({
        "checked": len(records), "derivatives": sum(
            len(r["derivatives"]) for r in records
        ), "published": 0, "provenanceRecorded": True,
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("TRACTORVS_OFFLINE_PHOTO_PILOT_BLOCKED " +
              str(error).replace("\n", " ")[:350])
        raise SystemExit(1) from None
