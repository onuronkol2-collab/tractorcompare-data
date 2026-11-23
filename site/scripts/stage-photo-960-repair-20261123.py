#!/usr/bin/env python3
"""One-time, fail-closed staging of missing first-party JPEG sizes for TWO existing photos.

Fetches only the existing, approved first-party 1920px image route. Proves
pixel similarity against the already committed 480px photo. No metadata
publication, database change, GitHub release or license inference.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image, ImageChops, ImageStat

SITE = "https://tractorvs.com"
ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "public" / "images" / "tractors"
LEDGER = ROOT / "docs" / "photo-960-1920-repair-evidence-20261123.json"
PHOTOS = (
    {
        "fileId": "valtra-t255-622d182c",
        "brand": "Valtra",
        "model": "T255",
        "author": "Bene Riobó",
        "license": "CC BY-SA 4.0",
        "sourcePage": "https://commons.wikimedia.org/wiki/File:Valtra_T255_01.jpg",
    },
    {
        "fileId": "versatile-nemesis-255-be32337e",
        "brand": "Versatile",
        "model": "Nemesis 255",
        "author": "MarcelX42",
        "license": "CC BY-SA 4.0",
        "sourcePage": "https://commons.wikimedia.org/wiki/File:Versatile_Nemesis_255_CVT_Agritechnica_2025_(DSC08750).jpg",
    },
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_jpeg(raw: bytes, label: str) -> Image.Image:
    if len(raw) < 1000 or raw[:3] != bytes.fromhex("ffd8ff") or raw[-2:] != bytes.fromhex("ffd9"):
        raise ValueError(f"{label}: invalid JPEG magic, length, or ending")
    with Image.open(io.BytesIO(raw)) as decoded:
        decoded.load()
        if decoded.format != "JPEG":
            raise ValueError(f"{label}: wrong decoded image format")
        return decoded.convert("RGB")


def main() -> None:
    if LEDGER.exists():
        raise FileExistsError("The photo proof ledger already exists; never silently replace it")
    results = []
    generated: dict[Path, bytes] = {}
    for p in PHOTOS:
        ident = p["fileId"]
        existing = DIR / f"{ident}-480.jpg"
        high_path = DIR / f"{ident}-1920.jpg"
        display_path = DIR / f"{ident}-960.jpg"
        if not existing.is_file() or existing.stat().st_size < 1000:
            raise FileNotFoundError(f"Missing reviewed source-size identity: {existing}")
        if high_path.exists() or display_path.exists():
            raise FileExistsError(f"Never overwrite existing derivative of {ident}")
        original_480 = existing.read_bytes()
        source_480 = load_jpeg(original_480, existing.name)
        url = SITE + f"/images/tractors/{ident}-1920.jpg"
        req = Request(url, headers={
            "User-Agent": "TractorVS-Licensed-Photo-Repair/1.0 (two reviewed photos)",
            "Accept": "image/jpeg"
        })
        # One finite upstream request per approved photo; errors abort and do
        # not turn into 'missing' or permission to use a different model.
        with urlopen(req, timeout=30) as response:
            status = response.status
            content_type = response.headers.get("Content-Type", "").lower()
            raw = response.read(6_000_001)
        if status != 200 or "image/jpeg" not in content_type or len(raw) > 6_000_000:
            raise ValueError(f"{ident}: invalid source response {status}/{content_type}/{len(raw)}")
        source = load_jpeg(raw, ident)
        if source.width != 1920 or source.height < 350:
            raise ValueError(f"{ident}: wrong high-resolution image dimensions {source.size}")
        compared = source.resize(source_480.size, Image.Resampling.LANCZOS)
        delta = ImageStat.Stat(ImageChops.difference(compared, source_480)).mean
        if max(delta) >= 20:
            raise ValueError(f"{ident}: 1920px source does not match existing licensed 480px photo: {delta}")
        new_960 = source.resize((960, round(source.height / 2)), Image.Resampling.LANCZOS)
        blob = io.BytesIO()
        new_960.save(blob, format="JPEG", quality=90, optimize=True, progressive=True)
        display_raw = blob.getvalue()
        load_jpeg(display_raw, f"{ident}-960.jpg")
        generated[high_path] = raw
        generated[display_path] = display_raw
        results.append({
            **p,
            "sourceRoute": url,
            "originWidth": source.width,
            "originHeight": source.height,
            "existing480": {
                "file": existing.name,
                "sha256": sha(original_480),
                "width": source_480.width,
                "height": source_480.height,
                "bytes": len(original_480),
            },
            "source1920Sha256": sha(raw),
            "meanRgbDifferenceAgainstExisting480": [round(x, 3) for x in delta],
            "newFiles": [
                {"file": display_path.name, "width": new_960.width,
                 "height": new_960.height, "bytes": len(display_raw), "sha256": sha(display_raw)},
                {"file": high_path.name, "width": source.width,
                 "height": source.height, "bytes": len(raw), "sha256": sha(raw)},
            ],
        })
    # Atomic insofar as every remote/image/identity check must succeed before
    # *any* new file is written. The Git branch is non-production and gated.
    for path, raw in generated.items():
        path.write_bytes(raw)
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    LEDGER.write_text(json.dumps({
        "reviewRequired": True,
        "approvedToPublish": False,
        "publicationCount": 0,
        "purpose": "repair persistent production HTTP 502 from missing checked-in 960px JPEGs",
        "reviewedOn": "2026-11-23",
        "images": results,
    }, ensure_ascii=False, indent=2) + "\n")
    print("TRACTORVS_TWO_LICENSED_EXACT_PHOTO_SIZE_REPAIRS_STAGED", len(generated))


if __name__ == "__main__":
    main()
