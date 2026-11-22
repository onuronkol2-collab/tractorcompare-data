#!/usr/bin/env python3
"""Stage only 24 exact third-wave reviewed photo derivatives on an isolated PR.

Uses the finished GitHub Actions #45034166209 artifact, pinned by 24 SHA-256
hashes and 12 original SHA-256 hashes. No Wikimedia search, no Supabase write,
no paid converter, no production deploy. Fails before writing on any mismatch.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from PIL import Image

EXPECTED_IDS = {
    "belarus-152-homoatrox-2021",
    "belarus-922-3-bulykin-almaty-2026",
    "mahindra-jivo-245-di-d2fc00a0",
    "mccormick-x4-080-mbone-agritechnica-2023",
    "mccormick-x8-631-vt-drive-marcel-2023",
    "steyr-6200-impuls-2025",
    "steyr-6340-terrus-marcel-2023",
    "tafe-6028-m-826b548b",
    "valtra-n135-beef7a3c",
    "valtra-t215-88d0ab88",
    "versatile-nemesis-175-e95b1863",
    "zetor-6170-marcel-agritechnica-2025",
}

def stage(evidence: Path, original: Path, target: Path):
    ledger=json.loads(evidence.read_text(encoding="utf8"))
    report=json.loads((original/"report.json").read_text(encoding="utf8"))
    if (ledger.get("schema")!="tractorvs-third-wave-12-live-approved-photo-assets-sha-v1"
        or ledger.get("sourceActionsRun")!=45034166209
        or ledger.get("sourceArtifactId")!=14758679323
        or ledger.get("recordCount")!=12 or ledger.get("derivativeCount")!=24
        or ledger.get("publishApproved") is not False
        or report.get("kind")!="tractorvs-third-wave-offline-photo-QA-report"
        or report.get("publishAllowed") is not False
        or report.get("published")!=0
        or report.get("originalsFetched")!=12
        or len(report.get("outputs",[]))!=12
        or len(ledger.get("records",[]))!=12):
        raise ValueError("Not the previously certified nonpublishing artifact")
    pinned={x["fileId"]:x for x in ledger["records"]}
    images={x["fileId"]:x for x in report["outputs"]}
    if set(pinned)!=EXPECTED_IDS or set(images)!=EXPECTED_IDS:
        raise ValueError("Unrecognized/duplicate/missing reviewed photo identity")

    files=[]
    for ident in sorted(EXPECTED_IDS):
        expected=pinned[ident]
        actual=images[ident]
        if (expected["originalSha256"]!=actual["source960Sha256"] or
            expected["sourceBytes"]!=actual["source960Bytes"] or
            expected["publishApproved"] is not False or
            actual.get("publishApproved") is not False or
            actual.get("configurationExact") is not False or
            expected["fileId"]!=actual["fileId"] or
            not actual.get("photographer") or
            not actual.get("photoSource","").startswith(
              "https://commons.wikimedia.org/wiki/File:") or
            actual.get("licenseName") not in {"CC BY-SA 3.0","CC BY-SA 4.0"} or
            actual.get("licenseUrl") != "https://creativecommons.org/licenses/by-sa/" +
              actual["licenseName"][-3:]+"/" or
            not actual.get("approvedPublicModelSlugs")):
            raise ValueError("Original photo rights/SHA/publication mismatch: "+ident)
        if len(expected.get("derivatives",[]))!=2 or len(actual.get("derivatives",[]))!=2:
            raise ValueError("Each photo must have JPEG and WebP")
        produced={x["format"]:x for x in actual["derivatives"]}
        if set(produced)!={"jpeg","webp"}:
            raise ValueError("Photo format set changed: "+ident)
        for record in expected["derivatives"]:
            kind=record["format"]
            ext="jpg" if kind=="jpeg" else "webp" if kind=="webp" else None
            if not ext:
                raise ValueError("Unsupported binary format")
            filename=ident+"-720."+ext
            item=produced[kind]
            if (record["file"]!=filename or item["file"]!=filename or
                record["sha256"]!=item["sha256"] or
                record["bytes"]!=item["bytes"] or
                record["width"]!=item["width"] or
                record["height"]!=item["height"] or
                record["psnrDb"]!=item["psnrDb"] or
                record["width"]!=720 or record["height"]<120 or
                record["psnrDb"]<30 or
                record["bytes"]>=expected["sourceBytes"]):
                raise ValueError("SHA/quality/dimensions metadata changed: "+filename)
            data=(original/filename).read_bytes()
            if (len(data)!=record["bytes"] or
                sha256(data).hexdigest()!=record["sha256"]):
                raise ValueError("Artifact binary bytes or SHA changed: "+filename)
            if kind=="jpeg":
                if not data.startswith(bytes.fromhex("ffd8")) or not data.endswith(bytes.fromhex("ffd9")):
                    raise ValueError("JPEG signature invalid: "+filename)
            elif data[:4]!=b"RIFF" or data[8:12]!=b"WEBP":
                raise ValueError("WebP signature invalid: "+filename)
            with Image.open(BytesIO(data)) as frame:
                frame.verify()
            with Image.open(BytesIO(data)) as frame:
                frame.load()
                if frame.size!=(720,record["height"]) or frame.format != (
                    "JPEG" if kind=="jpeg" else "WEBP"):
                    raise ValueError("Image decoded MIME/dimensions incorrect: "+filename)
            files.append((filename,data))
    names={p.name for p in original.iterdir() if p.is_file()}
    wanted={name for name,_ in files}|{"report.json","ATTRIBUTION.md"}
    if len(files)!=24 or len(wanted)!=26 or names!=wanted:
        raise ValueError("Unexpected/missing artifact file(s)")
    attribution=(original/"ATTRIBUTION.md").read_text(encoding="utf8")
    if not all(photo["photographer"] in attribution and
        photo["photoSource"] in attribution and
        photo["licenseName"] in attribution for photo in images.values()):
        raise ValueError("Missing original CC photographer / license attribution")

    target.mkdir(parents=True,exist_ok=True)
    for filename,data in files:
        destination=target/filename
        if destination.exists():
            if destination.read_bytes()!=data:
                raise ValueError("Never overwrite a differing preexisting image: "+filename)
    for filename,data in files:
        destination=target/filename
        if not destination.exists():
            destination.write_bytes(data)
    result={"originals":12,"verifiedNewDerivatives":24,
        "sha256Evidence":"all 24 exact bytes match reviewed offline artifact",
        "productionPublished":False}
    print("TRACTORVS_THIRD_WAVE_STAGE_VERIFIED "+json.dumps(result))
    return result

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--evidence",type=Path,required=True)
    parser.add_argument("--artifact",type=Path,required=True)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    stage(args.evidence,args.artifact,args.output)

if __name__=="__main__":
    try:main()
    except Exception as e:
        print("TRACTORVS_THIRD_WAVE_STAGE_BLOCKED "+str(e).replace("\n"," ")[:350])
        raise SystemExit(1) from None
