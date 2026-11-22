#!/usr/bin/env python3
"""Stage EXACT 15 public, CC-reviewed photo derivatives from verified CI artifact.

Scope: six preexisting pilot files stay untouched; three unpublished model
photos are expressly excluded. This writes 30 immutable first-party image
binaries plus a full per-file rights/SHA ledger ONLY to a PR branch.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from PIL import Image

EXPECTED_SOURCE_RUN = 45029082604
EXPECTED_SOURCE_ARTIFACT = 14757380657
EXPECTED_HELD = {
    "new-holland-t6-180-marcelx42-2025",
    "landini-5-110-roboshift-marcelx42-2023",
    "kubota-m5-112-c3be6b9d",
}

def stage(*, manifest_path:Path,artifact_dir:Path,public_dir:Path,ledger_path:Path)->dict:
    manifest=json.loads(manifest_path.read_text(encoding="utf8"))
    report_bytes=(artifact_dir/"report.json").read_bytes()
    report=json.loads(report_bytes)
    if (manifest.get("kind")!="tractorvs-license-verified-public-batch15"
        or manifest.get("version")!=1
        or manifest.get("publishAllowed") is not False
        or manifest.get("selectedCount")!=15
        or manifest.get("sourcePhotoCount")!=18
        or set(manifest.get("heldPhotoIds",[]))!=EXPECTED_HELD
        or len(manifest.get("selected",[]))!=15
        or report.get("kind")!="tractorvs-licensed-second-batch-offline-QA"
        or report.get("expected")!=18 or report.get("verified")!=18
        or report.get("failed")!=0 or report.get("complete") is not True
        or report.get("publishAllowed") is not False
        or len(report.get("successes",[]))!=18
        or report.get("failures")!=[]):
        raise ValueError("Untrusted/non-complete source artifact, or incorrect public release cohort")
    selected={p["fileId"]:p for p in manifest["selected"]}
    reviewed={p["fileId"]:p for p in report["successes"]}
    if (len(selected)!=15 or len(reviewed)!=18 or
        not set(selected).issubset(set(reviewed)) or
        EXPECTED_HELD & set(selected)):
        raise ValueError("Cannot stage unpublished, duplicated, or unreviewed photo IDs")
    if set(reviewed)-set(selected)!=EXPECTED_HELD:
        raise ValueError("Exactly three unpublished photo identities must remain excluded")
    credit=(artifact_dir/"ATTRIBUTION.md").read_text(encoding="utf8")
    approved_files=[]
    evidence=[]
    for ident in sorted(selected):
        item,generated=selected[ident],reviewed[ident]
        for source_key,converted_key in [
            ("brand","brand"),("model","model"),
            ("photographer","photographer"),
            ("licenseName","licenseName"),
            ("licenseUrl","licenseUrl"),
            ("sourcePage","photoSource")
        ]:
            if item[source_key]!=generated[converted_key]:
                raise ValueError("Published photo/author/licence provenance mismatch: "+ident)
        if (item.get("configurationExact") is not False
            or generated.get("configurationExact") is not False
            or item.get("licenseName") not in {"CC BY-SA 3.0","CC BY-SA 4.0"}
            or item.get("expectedMime")!="image/jpeg"
            or item.get("firstParty960")!="https://tractorvs.com/images/tractors/"+ident+"-960.jpg"
            or not item["sourcePage"].startswith("https://commons.wikimedia.org/wiki/File:")
            or item["photographer"] not in credit or item["sourcePage"] not in credit):
            raise ValueError("Missing exact source and CC photographer credit: "+ident)
        candidates=generated.get("derivatives",[])
        if len(candidates)!=2 or {d.get("format") for d in candidates}!={"jpeg","webp"}:
            raise ValueError("Expected one safe JPEG and one safe WebP: "+ident)
        deriv=[]
        for entry in candidates:
            fmt=entry["format"]
            ext="jpg" if fmt=="jpeg" else "webp"
            path=ident+"-720."+ext
            if entry.get("file")!=path or entry.get("width")!=720 or (
                entry.get("psnrDb",0)<30 or entry.get("bytes",0)<2000
                or entry.get("bytes",0)>=generated["source960Bytes"]
            ):
                raise ValueError("Bad format/quality/compression: "+path)
            asset=(artifact_dir/path).read_bytes()
            actual_hash=sha256(asset).hexdigest()
            if (len(asset)!=entry["bytes"] or actual_hash!=entry["sha256"]):
                raise ValueError("Exact bytes or hash did not match source proof: "+path)
            if fmt=="jpeg" and not(asset[:2]==b"\xff\xd8" and asset[-2:]==b"\xff\xd9"):
                raise ValueError("Corrupt JPEG signature: "+path)
            if fmt=="webp" and not(asset[:4]==b"RIFF" and asset[8:12]==b"WEBP"):
                raise ValueError("Corrupt WebP signature: "+path)
            with Image.open(BytesIO(asset)) as image:
                image.verify()
            with Image.open(BytesIO(asset)) as image:
                image.load()
                if image.size!=(720,entry["height"]) or image.format!=(
                    "JPEG" if fmt=="jpeg" else "WEBP"
                ):
                    raise ValueError("Wrong binary dimensions or format: "+path)
            destination=public_dir/path
            if destination.exists():
                raise ValueError("Refusing overwrite of prior public photo: "+path)
            approved_files.append((destination,asset))
            deriv.append({"format":fmt,"ext":ext,"bytes":len(asset),
                "sha256":actual_hash,"psnrDb":entry["psnrDb"],
                "width":720,"height":entry["height"]})
        evidence.append({
            "fileId":ident,"brand":item["brand"],"model":item["model"],
            "sourcePage":item["sourcePage"],"photographer":item["photographer"],
            "licenseName":item["licenseName"],"licenseUrl":item["licenseUrl"],
            "configurationExact":False,
            "source960Bytes":generated["source960Bytes"],
            "source960Sha256":generated["source960Sha256"],
            "derivatives":deriv
        })
    if len(approved_files)!=30 or len(evidence)!=15:
        raise ValueError("Expected exactly 30 verified binaries and 15 evidence entries")
    filenames={x.name for x in artifact_dir.iterdir() if x.is_file()}
    expected={p.name for p,_ in approved_files}
    expected.update({id+"-720."+ext for id in EXPECTED_HELD for ext in ("jpg","webp")})
    if filenames!=expected|{"ATTRIBUTION.md","report.json"}:
        raise ValueError("QA archive has missing or unexpected files")
    if ledger_path.exists():
        raise ValueError("Refusing to overwrite pinned release evidence")
    ledger={
        "schema":"tractorvs-second-batch15-sha-pinned-release-v1",
        "sourceActionsRun":EXPECTED_SOURCE_RUN,
        "sourceArtifactId":EXPECTED_SOURCE_ARTIFACT,
        "sourceReportSha256":sha256(report_bytes).hexdigest(),
        "publishApproved":False,
        "publicPhotos":15,"assetCount":30,
        "heldUnpublishedPhotoIds":sorted(EXPECTED_HELD),
        "adaptation":"720px LANCZOS resample; JPEG q82 progressive; WebP q80 method6",
        "records":evidence
    }
    # ALL data validated before the first write.
    public_dir.mkdir(parents=True,exist_ok=True)
    for path,data in approved_files:
        path.write_bytes(data)
    ledger_path.parent.mkdir(parents=True,exist_ok=True)
    ledger_path.write_text(json.dumps(ledger,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    result={"stagedPhotos":15,"stagedAssets":30,"excludedUnpublishedPhotos":3,
        "sourceActionsRun":EXPECTED_SOURCE_RUN,"ledger":str(ledger_path)}
    print("TRACTORVS_BATCH15_STAGED "+json.dumps(result))
    return result

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--manifest",required=True,type=Path)
    ap.add_argument("--artifact",required=True,type=Path)
    ap.add_argument("--output",required=True,type=Path)
    ap.add_argument("--ledger",required=True,type=Path)
    args=ap.parse_args()
    stage(manifest_path=args.manifest,artifact_dir=args.artifact,
        public_dir=args.output,ledger_path=args.ledger)

if __name__=="__main__":
    try:main()
    except Exception as e:
        print("TRACTORVS_BATCH15_STAGE_BLOCKED "+str(e).replace("\n"," ")[:400])
        raise SystemExit(1) from None
