#!/usr/bin/env python3
"""Prepare SHA-verifiable first-party JPEGs for three reviewed Commons files.

Manual staging only: never changes live files, commits, approvals or Supabase.
Use only one documented Commons File-page thumbnail host (thumb.wikimedia.org)
and one 1920px request per exact source. This is Wikimedia's public image
URL, not a proxy or a fallback for 429. HTTP 429/503 stops the entire batch;
never rotate hosts, retry rapidly or ignore Retry-After.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import time
import urllib.error
import urllib.request

from PIL import Image, ImageOps

SOURCES = (
    ("steyr-6240-absolut-blonder1984-2022",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Steyr_Absolut_6240.jpg/1920px-Steyr_Absolut_6240.jpg",
     "Blonder1984", "CC BY 4.0",
     "https://commons.wikimedia.org/wiki/File:Steyr_Absolut_6240.jpg"),
    ("zetor-proxima-jj7777-2021",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/ZETOR_PROXIMA.jpg/1920px-ZETOR_PROXIMA.jpg",
     "JJ7777", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:ZETOR_PROXIMA.jpg"),
    ("zetor-proxima-raf24-warsaw-2019",
     "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Zetor_Proxima%2C_WAW.jpg/1920px-Zetor_Proxima%2C_WAW.jpg",
     "Raf24~commonswiki", "CC BY-SA 4.0",
     "https://commons.wikimedia.org/wiki/File:Zetor_Proxima%2C_WAW.jpg"),
)
# Default source set is exactly three; wrappers may explicitly opt into four.
# This is an integrity limit, not a best-effort count.
EXPECTED_BATCH_COUNT = 3
MAX_SOURCE_BYTES = 7_000_000
Image.MAX_IMAGE_PIXELS = 40_000_000


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def fetch_verified_jpeg(file_id, url):
    request = urllib.request.Request(url, headers={
        "User-Agent": "TractorVS-LicensedPhotoStaging/1.0 (https://tractorvs.com/contact)",
        "Accept": "image/jpeg",
    })
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            # This is an allowlisted exact URL, but do not follow CDN redirects
            # to unrelated hosts or accept a different image content type.
            if response.geturl() != url or response.status != 200:
                raise RuntimeError(f"{file_id}: redirected or unsuccessful source")
            if "image/jpeg" not in response.headers.get("Content-Type", "").lower():
                raise RuntimeError(f"{file_id}: non-JPEG source")
            raw = response.read(MAX_SOURCE_BYTES + 1)
    except urllib.error.HTTPError as error:
        retry_after = error.headers.get("Retry-After", "") if error.headers else ""
        raise RuntimeError(
            f"{file_id}: upstream HTTP {error.code}; retry-after={retry_after[:32]}; "
            "no automatic retry or fallback"
        ) from error
    if not (10_000 < len(raw) <= MAX_SOURCE_BYTES and
            raw[:3] == b"\xff\xd8\xff" and raw[-2:] == b"\xff\xd9"):
        raise RuntimeError(f"{file_id}: invalid JPEG bytes, size or termination")
    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        if image.format != "JPEG":
            raise RuntimeError(f"{file_id}: decoder rejected JPEG")
        clean = ImageOps.exif_transpose(image).convert("RGB")
    if clean.width < 1920 or clean.height < 100:
        raise RuntimeError(f"{file_id}: unexpected source dimensions")
    return raw, clean


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True,
                        help="Temporary staging folder; never a production path")
    args = parser.parse_args()
    target = Path(args.output_dir).resolve()
    # Refuse to overwrite source-controlled website assets. Humans must
    # inspect the artifact and commit approved binaries in a separate step.
    if "site/public" in target.as_posix() or target == Path.cwd():
        raise RuntimeError("Refusing to write into production or repository root")
    target.mkdir(parents=True, exist_ok=True)
    if EXPECTED_BATCH_COUNT not in (3, 4):
        raise RuntimeError("Unsupported reviewed photograph batch size")
    if len(SOURCES) != EXPECTED_BATCH_COUNT:
        raise RuntimeError("Reviewed photograph source count does not match declared batch")
    if len({source[0] for source in SOURCES}) != EXPECTED_BATCH_COUNT:
        raise RuntimeError("Duplicate reviewed photograph identity")
    results = []
    for file_id, url, creator, license_name, source_page in SOURCES:
        raw, original = fetch_verified_jpeg(file_id, url)
        derivatives = []
        for width in (480, 960, 1920):
            image = original if width == original.width else original.resize(
                (width, round(original.height * width / original.width)),
                Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            image.save(buffer, "JPEG", quality=86, optimize=True, progressive=True)
            data = buffer.getvalue()
            if len(data) < 3000 or data[:3] != b"\xff\xd8\xff" or data[-2:] != b"\xff\xd9":
                raise RuntimeError(f"{file_id}: invalid {width}px derivative")
            filename = f"{file_id}-{width}.jpg"
            (target / filename).write_bytes(data)
            derivatives.append({
                "file": filename, "width": image.width, "height": image.height,
                "bytes": len(data), "sha256": sha256(data),
            })
        results.append({
            "fileId": file_id, "photographer": creator,
            "license": license_name, "sourcePage": source_page,
            "origin": url, "originSha256": sha256(raw),
            "originBytes": len(raw), "derivatives": derivatives,
            "approvedToPublish": False,
        })
        print("TRACTORVS_REVIEWED_JPEG_STAGED " + json.dumps(
            {"fileId": file_id, "originBytes": len(raw),
             "derivatives": len(derivatives)}, separators=(",", ":")), flush=True)
        time.sleep(0.9)
    if len(results) != EXPECTED_BATCH_COUNT or any(len(x["derivatives"]) != 3 for x in results):
        raise RuntimeError("Incomplete reviewed photograph set")
    ledger = target / "sha256-ledger.json"
    ledger.write_text(json.dumps({
        "reviewRequired": True, "publicationCount": 0, "images": results
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        "TRACTORVS_NINE_JPEGS_STAGED_FOR_REVIEW_ONLY" if EXPECTED_BATCH_COUNT == 3
        else "TRACTORVS_TWELVE_JPEGS_STAGED_FOR_REVIEW_ONLY",
        flush=True,
    )


if __name__ == "__main__":
    main()
