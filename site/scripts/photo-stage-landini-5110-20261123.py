#!/usr/bin/env python3
"""Landini 5-110 RoboShift: high-resolution JPEG review, not a deployment.
One Commons HTTP request, fail-closed; do not touch the live photo until QA.
"""
import hashlib,io,json,sys
from pathlib import Path
from PIL import Image,ImageChops,ImageOps,ImageStat
from importlib.util import spec_from_file_location,module_from_spec

ROOT=Path(__file__).parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
  if len(sys.argv)!=2:raise RuntimeError("Usage: script.py <review output folder>")
  target=Path(sys.argv[1]).resolve()
  if str(target).startswith(str((ROOT/"public").resolve())) or target==ROOT.resolve():
    raise RuntimeError("Cannot stage within public dist")
  target.mkdir(parents=True,exist_ok=True)
  manifest=json.loads((ROOT/"docs/photo-research-landini-5110-20261123.json").read_text())
  assert manifest["approvedToPublish"] is False
  assert manifest["releaseState"]=="staging_and_visual_review_only"
  assert manifest["fileId"]=="landini-5-110-roboshift-marcelx42-2023"
  assert manifest["publishedRecord"]["tractor_id"]=="264687c1-8dd2-5801-9e2e-11901f4acf6b"
  assert manifest["visibleConfigurationExact"] is False
  spec=spec_from_file_location("safe_commons_source",ROOT/"scripts/stage-reviewed-commons-20261122.py")
  safe=module_from_spec(spec);spec.loader.exec_module(safe)
  raw,photo=safe.fetch_verified_jpeg(manifest["fileId"],manifest["source1920"])
  if photo.width!=1920 or not (1079<=photo.height<=1082):
    raise RuntimeError("Unexpected photo ratio or width")
  existingPath=ROOT.parent/manifest["originalAlreadyCommitted480"]
  originalBytes=existingPath.read_bytes()
  with Image.open(io.BytesIO(originalBytes)) as o:
    o.load()
    existing=ImageOps.exif_transpose(o).convert("RGB")
  if existing.width!=480 or not (269<=existing.height<=272):
    raise RuntimeError("Existing 480px source not compatible")
  source480=photo.resize(existing.size,Image.Resampling.LANCZOS)
  brightness=ImageStat.Stat(ImageChops.difference(existing,source480)).mean
  if any(v>20 for v in brightness):
    raise RuntimeError("Previously published 480 thumbnail differs from 1920 source: "+str(brightness))
  out=[]
  for width in (960,1920):
    img=photo.resize((width,round(width*photo.height/photo.width)),Image.Resampling.LANCZOS) if width!=1920 else photo
    file=manifest["fileId"]+"-"+str(width)+".jpg"
    payload=io.BytesIO()
    img.save(payload,"JPEG",quality=86,optimize=True,progressive=True)
    b=payload.getvalue()
    if len(b)<10000 or b[:3]!=bytes.fromhex("ffd8ff") or b[-2:]!=bytes.fromhex("ffd9"):
      raise RuntimeError("Invalid encoded JPEG")
    (target/file).write_bytes(b)
    out.append({"file":file,"width":img.width,"height":img.height,"bytes":len(b),"sha256":sha(b)})
  proof={"reviewRequired":True,"approvedToPublish":False,"publicationCount":0,
    "fileId":manifest["fileId"],"sourcePage":manifest["sourceFilePage"],
    "photographer":manifest["photographer"],"licenseName":manifest["licenseName"],
    "licenseUrl":manifest["licenseUrl"],"model":manifest["publishedRecord"],
    "original1920":manifest["source1920"],"originalSourceBytes":len(raw),
    "originalSourceSha256":sha(raw),
    "existing480":{"width":existing.width,"height":existing.height,"bytes":len(originalBytes),
      "sha256":sha(originalBytes),"meanPixelDifferenceFromSource1920":[round(v,4) for v in brightness]},
    "newDerivatives":out,"configurationExact":False}
  (target/"sha256-ledger.json").write_text(json.dumps(proof,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
  print("TRACTORVS_LANDINI_5110_REVIEW_ONLY_2_JPEGS "+json.dumps(proof,ensure_ascii=False))
if __name__=="__main__":main()
