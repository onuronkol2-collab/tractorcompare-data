#!/usr/bin/env python3
"""Produce quality-measured, non-publishing derivatives of twelve live photos.

ALL inputs must be proven public by the live image sitemap and source-license
selector first. Uses only existing, first-party 960px JPEGs on tractorvs.com;
never calls Commons API, resizes by Cloudflare, or writes to the repository.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
from importlib.util import spec_from_file_location, module_from_spec
import json
from pathlib import Path
from time import sleep

EXACT_IDS = frozenset((
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
))

def reviewed_manifest(data: dict) -> list[dict]:
    if (data.get("kind") != "tractorvs-third-wave-public-licensed-offline-photo-QA"
        or data.get("version") != 1
        or data.get("source") != "live canonical public image sitemap"
        or data.get("publishAllowed") is not False
        or data.get("expectedFiles") != 12
        or not isinstance(data.get("selected"), list)
        or len(data["selected"]) != 12):
        raise ValueError("Untrusted offline third-wave manifest")
    selected = data["selected"]
    if {item.get("fileId") for item in selected} != EXACT_IDS:
        raise ValueError("Unknown, duplicate, or missing third-wave photo identity")
    for item in selected:
        ident = item["fileId"]
        version = {"CC BY-SA 3.0": "3.0", "CC BY-SA 4.0": "4.0"}.get(
            item.get("licenseName"))
        if (not version or item.get("licenseUrl") !=
            "https://creativecommons.org/licenses/by-sa/" + version + "/"
            or item.get("configurationExact") is not False
            or item.get("expectedMime") != "image/jpeg"
            or item.get("firstParty960") !=
            "https://tractorvs.com/images/tractors/" + ident + "-960.jpg"
            or item.get("fullImage") !=
            "https://tractorvs.com/images/tractors/" + ident + "-1920.jpg"
            or not str(item.get("sourcePage", "")).startswith(
                "https://commons.wikimedia.org/wiki/File:")
            or not str(item.get("photographer", "")).strip()
            or not str(item.get("brand", "")).strip()
            or not str(item.get("model", "")).strip()
            or not isinstance(item.get("publishedModelSlugs"), list)
            or not item["publishedModelSlugs"]
            or not all(isinstance(slug, str) and slug.isascii() and
                       slug.replace("-", "").isalnum() and
                       slug == slug.lower() for slug in item["publishedModelSlugs"])):
            raise ValueError("Source rights or live publication proof incomplete: "+ident)
    return selected

def load_existing_verified_codec():
    path = Path(__file__).with_name("photo-mobile-offline-pilot.py")
    spec = spec_from_file_location("tractorvs_old_photo_codec", path)
    if not spec or not spec.loader:
        raise ValueError("Previously tested free image codec missing")
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def run(manifest: dict, folder: Path, source_loader=None, pause_seconds=0.35):
    items = reviewed_manifest(manifest)
    folder.mkdir(parents=True, exist_ok=True)
    if any(folder.iterdir()):
        raise ValueError("Destination is not empty; refuse to overwrite artifacts")
    codec = load_existing_verified_codec()
    if source_loader is None:
        source_loader = codec.fetch_jpeg
    result = []
    for index, item in enumerate(items):
        if index and pause_seconds:
            sleep(pause_seconds)  # One existing first-party image at a time.
        original = source_loader(item["firstParty960"])
        details = codec.derive(original, item, folder)
        for variant in details["derivatives"]:
            if variant["psnrDb"] < 30.0:
                raise ValueError("Below 30dB photographic quality gate: "+item["fileId"])
        details["approvedPublicModelSlugs"] = item["publishedModelSlugs"]
        details["source960Url"] = item["firstParty960"]
        result.append(details)
        print("TRACTORVS_THIRD_WAVE_PHOTO_QA " + json.dumps({
            "fileId":details["fileId"],"sourceBytes":details["source960Bytes"],
            "originalSha256":details["source960Sha256"],
            "derivatives":details["derivatives"],
            "publishApproved":False
        }, ensure_ascii=False))
    report = {
        "kind": "tractorvs-third-wave-offline-photo-QA-report",
        "published": 0, "publishAllowed": False,
        "originalsFetched": len(result),
        "origin": "public first-party 960px JPEG only",
        "source": "12 exact canonical public image-sitemap + license proofs",
        "outputs": result
    }
    (folder/"report.json").write_text(
        json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    lines = ["# TractorVS third-wave derivatives — QA only, NOT published", "",
      "All 12 exact source photos are already public, but these new derivatives",
      "have not been approved for production. Model, variant, and image",
      "ownership must not be invented. Local conversion is an adaptation.",
      ""]
    for item in result:
        lines += ["## "+item["brand"]+" "+item["model"],
          "- Original Commons File: "+item["photoSource"],
          "- Photographer: "+item["photographer"],
          "- License: "+item["licenseName"]+" — "+item["licenseUrl"],
          "- Public model slugs: "+", ".join(item["approvedPublicModelSlugs"]),
          "- 960px first-party SHA256: "+item["source960Sha256"],
          "- Modification: 720px resize and JPEG/WebP re-encoding (QA only)",
          "- Adapted filenames: "+", ".join(v["file"] for v in item["derivatives"]),
          "- Photographed equipment may differ from recorded configuration",
          ""]
    (folder/"ATTRIBUTION.md").write_text("\n".join(lines),encoding="utf8")
    size_jpeg=sum(x["source960Bytes"] for x in result)
    size_webp=sum(next(v["bytes"] for v in x["derivatives"] if
                       v["format"]=="webp") for x in result)
    overview={"checked":len(result),"derivatives":sum(len(r["derivatives"]) for r in result),
        "published":0,"sourceJpegBytes":size_jpeg,"optimizedWebpBytes":size_webp,
        "estimatedByteReductionPercent":round(100*(1-size_webp/size_jpeg),1)}
    print("TRACTORVS_THIRD_WAVE_QA_SUMMARY "+json.dumps(overview))
    return report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    run(json.loads(args.input.read_text(encoding="utf8")),args.output)
if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("TRACTORVS_THIRD_WAVE_QA_BLOCKED "+str(exc).replace("\n"," ")[:500])
        raise SystemExit(1) from None
