#!/usr/bin/env python3
"""Non-publishing, quality-gated derivative audit of 18 existing licensed photos.

Only GETs explicitly reviewed first-party 960px images. No Wikimedia API calls
or arbitrary Commons thumbnail widths. Each failure remains visible; it never
becomes a fake zero-candidate success. Outputs are CI artifacts only.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import importlib.util
import json
import os
import time


def load_converter():
    script = Path(__file__).with_name("photo-mobile-offline-pilot.py")
    spec = importlib.util.spec_from_file_location("tractorvs_photo_converter", script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate(manifest: dict) -> list[dict]:
    if (
        not isinstance(manifest, dict)
        or manifest.get("kind") != "tractorvs-licensed-photo-second-batch"
        or manifest.get("version") != 1
        or manifest.get("publishAllowed") is not False
        or manifest.get("expectedFiles") != 18
    ):
        raise ValueError("Untrusted photo manifest or unexpected publication flag")
    entries = manifest.get("selected")
    if not isinstance(entries, list) or len(entries) != 18:
        raise ValueError("Expected exactly eighteen reviewed images")
    ids = set()
    for entry in entries:
        if not isinstance(entry, dict):
            raise ValueError("Unexpected non-object photo")
        ident = entry.get("fileId", "")
        if (
            not isinstance(ident, str)
            or not ident.replace("-", "").isalnum()
            or not ident.isascii()
            or ident in ids
            or entry.get("firstParty960")
            != "https://tractorvs.com/images/tractors/" + ident + "-960.jpg"
            or entry.get("configurationExact") is not False
            or entry.get("expectedMime") != "image/jpeg"
            or entry.get("licenseName") not in {"CC BY-SA 3.0", "CC BY-SA 4.0"}
            or entry.get("licenseUrl") !=
                "https://creativecommons.org/licenses/by-sa/" +
                entry["licenseName"][-3:] + "/"
            or not str(entry.get("sourcePage","")).startswith(
                "https://commons.wikimedia.org/wiki/File:")
            or not str(entry.get("originDisplayUrl","")).startswith(
                "https://upload.wikimedia.org/wikipedia/commons/thumb/")
            or "/960px-" not in entry["originDisplayUrl"]
            or not str(entry.get("photographer","")).strip()
            or not str(entry.get("brand","")).strip()
            or not str(entry.get("model","")).strip()
        ):
            raise ValueError("Untrusted identity/rights/source in second batch: " + ident)
        ids.add(ident)
    return entries


def audit(manifest: dict, directory: Path, fetcher=None, pause=time.sleep):
    selected = validate(manifest)
    if directory.exists() and list(directory.iterdir()):
        raise ValueError("Audit output must be empty; refusing overwrite")
    directory.mkdir(parents=True,exist_ok=True)
    converter = load_converter()
    getter = fetcher or converter.fetch_jpeg
    successes, problems = [], []
    for item in selected:
        ident = item["fileId"]
        try:
            data = getter(item["firstParty960"])
            proof = converter.derive(data,item,directory)
            # Fail if either binary is not smaller or if measured PSNR is poor.
            if not all(d["psnrDb"]>=30 for d in proof["derivatives"]):
                raise ValueError("Image quality below conservative 30dB batch gate")
            successes.append(proof)
            print("TRACTORVS_BATCH18_VERIFIED " +
                  json.dumps({"fileId":ident,"sourceBytes":proof["source960Bytes"],
                    "newBytes":[d["bytes"] for d in proof["derivatives"]],
                    "psnrDb":[d["psnrDb"] for d in proof["derivatives"]]},
                    ensure_ascii=False),flush=True)
        except Exception as exc:
            for extension in (".jpg",".webp"):
                (directory/(ident+"-720"+extension)).unlink(missing_ok=True)
            record={"fileId":ident,"errorType":type(exc).__name__,
                    "error":str(exc).replace("\n"," ")[:250]}
            problems.append(record)
            print("TRACTORVS_BATCH18_SOURCE_BLOCKED "+json.dumps(record,
                  ensure_ascii=False),flush=True)
        pause(0.75)
    report={
      "kind":"tractorvs-licensed-second-batch-offline-QA",
      "publishAllowed":False,"expected":18,"verified":len(successes),
      "failed":len(problems),"complete":len(problems)==0,
      "successes":successes,"failures":problems,
      "note":"No images were published or committed; every failure is explicit"
    }
    (directory/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
    credits=["# TractorVS second-batch licensed photo adaptations — NOT published",
             "","These copies are offline JPEG/WebP 720px re-encodings of already",
             "approved Commons photographs, not original TractorVS photographs.",
             "The original CC BY-SA attribution and variant caveat still apply.",""]
    for photo in selected:
        credits.extend(["## "+photo["brand"]+" "+photo["model"],
          "- File ID: "+photo["fileId"],
          "- Photographer: "+photo["photographer"],
          "- Source: "+photo["sourcePage"],
          "- License: "+photo["licenseName"]+" — "+photo["licenseUrl"],
          "- Modification: 720px resampling and JPEG/WebP re-encoding",
          "- Status: "+("source verified / offline derivatives present"
                      if any(s["fileId"]==photo["fileId"] for s in successes)
                      else "BLOCKED — not publishable"),""])
    (directory/"ATTRIBUTION.md").write_text("\n".join(credits),encoding="utf8")
    print("TRACTORVS_BATCH18_SUMMARY "+
          json.dumps({"expected":18,"verified":len(successes),
           "failed":len(problems),"published":0,"complete":not problems}),flush=True)
    return report


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--input",required=True,type=Path)
    parser.add_argument("--out",required=True,type=Path)
    args=parser.parse_args()
    result=audit(json.loads(args.input.read_text(encoding="utf8")),args.out)
    if not result["complete"]:
        raise SystemExit(1)


if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("TRACTORVS_BATCH18_FATAL "+str(exc).replace("\n"," ")[:350],flush=True)
        raise SystemExit(1) from None
