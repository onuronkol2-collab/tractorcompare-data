#!/usr/bin/env python3
"""Single, explicitly licensed McCormick X7.621 image: review-only JPEG derivation.

Do not touch site/public or any catalog. Stop hard on Wikimedia HTTP 429/5xx.
"""
import argparse
import hashlib
import io
import json
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from PIL import Image, ImageOps

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()
    root = Path(__file__).parents[1]
    manifest = json.loads((root / "docs/photo-research-mccormick-x7621-20261123.json").read_text())
    if (manifest["photoStatus"] != "research_only" or
        manifest["approvedToPublish"] is not False or
        manifest["publicationCount"] != 0 or
        manifest["visualGearboxConfirmation"] is not False or
        manifest["licenseName"] != "CC BY-SA 4.0" or
        len(manifest["publishedModelCandidates"]) != 2):
        raise RuntimeError("Unsafe candidate publication state")
    script_path = Path(__file__).with_name("stage-reviewed-commons-20261122.py")
    spec = spec_from_file_location("tractorvs_staging_base", script_path)
    mod = module_from_spec(spec)
    spec.loader.exec_module(mod)
    target = Path(args.output_dir).resolve()
    if "site/public" in str(target) or target == root.resolve():
        raise RuntimeError("Refuse to write in production paths")
    target.mkdir(parents=True, exist_ok=True)
    file_id = manifest["fileId"]
    raw, clean = mod.fetch_verified_jpeg(file_id, manifest["source1920"])
    integrity = []
    for width in (480,960,1920):
        resized = clean.resize((width,round(clean.height*width/clean.width)),Image.Resampling.LANCZOS)
        buffer=io.BytesIO()
        resized.save(buffer,"JPEG",quality=86,optimize=True,progressive=True)
        b=buffer.getvalue()
        if b[:3] != b"\xff\xd8\xff" or b[-2:] != b"\xff\xd9" or len(b)<3000:
            raise RuntimeError("Corrupt JPEG "+str(width))
        filename = file_id+"-"+str(width)+".jpg"
        (target/filename).write_bytes(b)
        integrity.append({"file":filename,"width":width,"height":resized.height,
                          "bytes":len(b),"sha256":hashlib.sha256(b).hexdigest()})
    report={"reviewRequired":True,"publicationCount":0,"approvedToPublish":False,
            "visualGearboxConfirmation":False,"fileId":file_id,"sourcePage":manifest["sourcePage"],
            "photographer":manifest["photographer"],"licenseName":manifest["licenseName"],
            "licenseUrl":manifest["licenseUrl"],"source":manifest["source1920"],
            "sourceBytes":len(raw),"sourceSha256":hashlib.sha256(raw).hexdigest(),
            "sourceDimensions":[clean.width,clean.height],"derivatives":integrity}
    (target/"sha256-ledger.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print("TRACTORVS_X7621_THREE_SOURCE_VERIFIED_JPEGS_PENDING_VISUAL_TRANSMISSION_REVIEW "+json.dumps(report))

if __name__=="__main__":
    main()
