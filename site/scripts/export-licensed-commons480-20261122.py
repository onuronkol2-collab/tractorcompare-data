#!/usr/bin/env python3
"""Export exact self-licensed Commons 480px public thumbnails for review.

Print public JPEG bytes as bounded base64 log segments, without write tokens.
GitHub app stores SHA-pinned blobs only after separate review.
"""
import base64, hashlib, io, math, time, urllib.request
from PIL import Image

SOURCES = (
 ("steyr-6240-absolut-blonder1984-2022", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Steyr_Absolut_6240.jpg/500px-Steyr_Absolut_6240.jpg"),
 ("zetor-proxima-jj7777-2021", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/ZETOR_PROXIMA.jpg/500px-ZETOR_PROXIMA.jpg"),
 ("zetor-proxima-raf24-warsaw-2019", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Zetor_Proxima%2C_WAW.jpg/500px-Zetor_Proxima%2C_WAW.jpg"),
)

for file_id, source in SOURCES:
    request = urllib.request.Request(source, headers={
        "User-Agent": "TractorVS-ApprovedCommonsMediaQA/1.0 (copyright-review)",
        "Accept": "image/jpeg"
    })
    with urllib.request.urlopen(request, timeout=25) as response:
        media_type = response.headers.get("Content-Type", "").lower()
        raw = response.read(2_000_001)
        if response.status != 200 or "image/jpeg" not in media_type or len(raw) > 2_000_000 or raw[:3] != b"\xff\xd8\xff":
            raise RuntimeError(f"Unsupported source media for {file_id}")
    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        if image.format != "JPEG" or image.width < 480:
            raise RuntimeError(f"Invalid original dimensions or format for {file_id}")
        out = image.convert("RGB")
        width = 480
        height = round(image.height * width / image.width)
        out = out.resize((width, height), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        out.save(buffer, "JPEG", quality=84, optimize=True, progressive=True)
        data = buffer.getvalue()
    if not (3000 < len(data) < 1_000_000 and data[:3] == b"\xff\xd8\xff"):
        raise RuntimeError(f"Corrupt output {file_id}")
    sha = hashlib.sha256(data).hexdigest()
    encoded = base64.b64encode(data).decode("ascii")
    stride = 15000
    parts = math.ceil(len(encoded) / stride)
    print(f"TRACTORVS_JPEG_READY::{file_id}::{len(data)}::{width}::{height}::{sha}", flush=True)
    for i in range(parts):
        print(f"TRACTORVS_JPEG_B64::{file_id}::{i}::{parts}::{encoded[i*stride:(i+1)*stride]}", flush=True)
    time.sleep(.9)
print("TRACTORVS_THREE_LICENSED_JPEGS_PREPARED", flush=True)
