#!/usr/bin/env python3
"""Fail-closed staging for six previously measured licensed photo derivatives.

Inputs are pinned to the exact GitHub Actions #45023575546 artefact by
SHA256/size/format/identity. Writes ONLY six first-party image assets to a
FEATURE BRANCH. No website publication, unreviewed Commons downloads or
inferred rights.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from PIL import Image

EXPECTED_FILE_IDS = {
    "belarus-80-1-nikolai-bulykin-kosmos-2026",
    "antonio-carraro-tigre-3800-439af04e",
    "new-holland-t5-110-pere-igor-2016",
}


def verify_and_stage(evidence_path: Path, artifact_dir: Path, output_dir: Path) -> dict:
    proof = json.loads(evidence_path.read_text(encoding="utf8"))
    report = json.loads((artifact_dir/"report.json").read_text(encoding="utf8"))
    if (proof.get("schema") != "tractorvs-offline-licensed-photo-derivative-proof-v1"
        or proof.get("generatedFromActionsRun") != 45023575546
        or proof.get("sourceArtifactId") != 14755135156
        or proof.get("publishApproved") is not False
        or report.get("kind") != "tractorvs-offline-photo-QA"
        or report.get("publishAllowed") is not False
        or report.get("upstreamRequestCount") != 3
        or len(proof.get("records", [])) != 3
        or len(report.get("output", [])) != 3):
        raise ValueError("Untrusted/off-scope candidate package")

    records = {r["fileId"]:r for r in proof["records"]}
    generated = {r["fileId"]:r for r in report["output"]}
    if set(records) != EXPECTED_FILE_IDS or set(generated) != EXPECTED_FILE_IDS:
        raise ValueError("Unknown or missing photo identity")
    approved = set()
    files = []
    for ident in sorted(EXPECTED_FILE_IDS):
        record, run = records[ident], generated[ident]
        for key, run_key in [
            ("brand","brand"),("model","model"),
            ("photographer","photographer"),
            ("sourcePage","photoSource"),("licenseName","licenseName"),
            ("source960Bytes","source960Bytes"),
            ("source960Sha256","source960Sha256")
        ]:
            if record[key] != run[run_key]:
                raise ValueError("Original identity/licensing digest changed: "+ident)
        if (record["licenseName"] != "CC BY-SA 4.0"
            or run.get("publishApproved") is not False
            or run.get("configurationExact") is not False
            or not record["sourcePage"].startswith("https://commons.wikimedia.org/wiki/File:")
            or len(record["derivatives"]) != 2
            or len(run.get("derivatives", [])) != 2):
            raise ValueError("Rights/variant/derivative count mismatch: "+ident)
        formats = set()
        live = {d["format"]:d for d in run["derivatives"]}
        for candidate in record["derivatives"]:
            fmt,ext = candidate["format"],candidate["ext"]
            if (fmt,ext) not in {("jpeg","jpg"),("webp","webp")}:
                raise ValueError("Unapproved binary format: "+ident)
            if fmt in formats:
                raise ValueError("Duplicate derivative format")
            formats.add(fmt)
            filename = ident + "-720." + ext
            if filename != live.get(fmt,{}).get("file"):
                raise ValueError("Unexpected derivative filename")
            record_sha = candidate["sha256"]
            if (not isinstance(record_sha,str) or len(record_sha)!=64
                or live[fmt].get("sha256")!=record_sha
                or live[fmt].get("bytes")!=candidate["bytes"]
                or live[fmt].get("width")!=720
                or live[fmt].get("height")!=candidate["height"]
                or live[fmt].get("psnrDb",0)<30):
                raise ValueError("Unverified quality/hash metadata: "+filename)
            file_path = artifact_dir/filename
            binary = file_path.read_bytes()
            if len(binary)!=candidate["bytes"] or sha256(binary).hexdigest()!=record_sha:
                raise ValueError("File bytes changed since reviewed CI artifact: "+filename)
            if (fmt=="jpeg" and not (
                binary.startswith(bytes.fromhex("ffd8"))
                and binary.endswith(bytes.fromhex("ffd9")))):
                raise ValueError("Invalid JPEG signature: "+filename)
            if fmt=="webp" and not (
                binary[:4]==b"RIFF" and binary[8:12]==b"WEBP"):
                raise ValueError("Invalid WebP signature: "+filename)
            with Image.open(BytesIO(binary)) as image:
                image.verify()
            with Image.open(BytesIO(binary)) as image:
                image.load()
                if image.size != (720,candidate["height"]):
                    raise ValueError("Wrong image dimensions: "+filename)
                if image.format != ("JPEG" if fmt=="jpeg" else "WEBP"):
                    raise ValueError("Image content type does not match extension: "+filename)
            approved.add(filename)
            files.append((filename,binary))
    if len(files)!=6:
        raise ValueError("Expected six unique reviewed derivatives")
    file_names = {p.name for p in artifact_dir.iterdir() if p.is_file()}
    if file_names != approved | {"ATTRIBUTION.md","report.json"}:
        raise ValueError("Artifact contains unexpected or missing files")
    credit = (artifact_dir/"ATTRIBUTION.md").read_text(encoding="utf8")
    if not all(record["photographer"] in credit and record["sourcePage"] in credit
               and "CC BY-SA 4.0" in credit for record in records.values()):
        raise ValueError("Rights attribution is missing from artifact")
    output_dir.mkdir(parents=True,exist_ok=True)
    for filename,binary in files:
        path = output_dir/filename
        if path.exists():
            if path.read_bytes()!=binary:
                raise ValueError("Never overwrite different published image bytes: "+filename)
        else:
            path.write_bytes(binary)
    return {"reviewedModels":len(records),"stagedDerivatives":len(files),
            "newPaths":[str((output_dir/name).as_posix()) for name,_ in files],
            "preflight":"all sha256/rights/format/dimensions validated before writing"}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--evidence",type=Path,required=True)
    parser.add_argument("--artifact-dir",type=Path,required=True)
    parser.add_argument("--output-dir",type=Path,required=True)
    args=parser.parse_args()
    result=verify_and_stage(args.evidence,args.artifact_dir,args.output_dir)
    print("TRACTORVS_LOCAL_720_ASSETS_STAGED "+json.dumps(result))


if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("TRACTORVS_LOCAL_720_ASSET_BLOCKED "+str(exc).replace("\n"," ")[:350])
        raise SystemExit(1) from None
