"""Generate non-public glossary translation candidates with installed Argos models.

No provider API, model installation, workflow dispatch, database writes or approval.
Run in an isolated, network-disabled local environment after checking model licences
and installing the reviewed packages. Machine output still requires editorial QA.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path

FIELDS = ("definition", "example", "caution")
# Direct English pairs verified against argospm-index blob c64b1a1664df1a3dd1c213b693fbfe18de2efebb.
PAIRS = {"de": ("de", "1.3"), "fr": ("fr", "1.9"), "es": ("es", "1.0"),
         "pt-br": ("pb", "1.9"), "zh": ("zh", "1.9"), "hi": ("hi", "1.1"),
         "ru": ("ru", "1.9"), "ja": ("ja", "1.1")}

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False,
        separators=(",", ":")).encode("utf-8")).hexdigest()

def require(condition, message):
    if not condition:
        raise ValueError(message)

def validate_packet(packet):
    require(packet.get("schema") == 1 and packet.get("notForPublication") is True
            and packet.get("state") == "draft-needs-independent-editorial-review",
            "Only the non-public glossary review packet is accepted")
    core = {k: packet[k] for k in ("schema", "sourceBlobSha", "jobs")}
    require(digest(core) == packet.get("packetSha256"), "Packet checksum mismatch")
    jobs = core["jobs"]
    require(isinstance(jobs, list) and 1 <= len(jobs) <= 8, "Invalid job count")
    locales = set()
    for job in jobs:
        locale = job["locale"]
        require(locale in PAIRS and locale not in locales, "Invalid or duplicate locale")
        locales.add(locale)
        entries = job["entries"]
        require(isinstance(entries, list) and 1 <= len(entries) <= 82, "Invalid entry count")
        ids = set()
        for item in entries:
            entry_id = item["id"]
            require(isinstance(entry_id, str) and entry_id and entry_id not in ids, "Duplicate or invalid ID")
            ids.add(entry_id)
            require(item["requestedFields"] == list(FIELDS), "Unexpected fields")
            for field in FIELDS:
                value = item["source"][field]
                require(isinstance(value, str) and 0 < len(value) <= 800, "Invalid source field")
    return jobs

def installed_translator(locale):
    # Direct package selection prevents an automatic pivot via another language.
    # No call to update_package_index(), download(), install_from_path(), or remote APIs.
    os.environ["ARGOS_CHUNK_TYPE"] = "NONE"
    os.environ["ARGOS_DEVICE_TYPE"] = "cpu"
    try:
        from argostranslate import package, translate
    except ImportError as exc:
        raise RuntimeError("Install reviewed Argos library and models locally first") from exc
    code, version = PAIRS[locale]
    packages = [p for p in package.get_installed_packages()
                if p.type == "translate" and p.from_code == "en"
                and p.to_code == code and p.package_version == version]
    require(len(packages) == 1, f"Exactly one pinned direct en-{code} {version} model must be installed")
    model = packages[0]
    engine = translate.PackageTranslation(
        translate.Language("en", "English"), translate.Language(code, model.to_name), model)
    return engine.translate

def generate(packet, load_translator=installed_translator):
    jobs = validate_packet(packet)
    result = {"schema": 1, "packetSha256": packet["packetSha256"],
              "sourceBlobSha": packet["sourceBlobSha"],
              "state": "draft-needs-independent-editorial-review",
              "notForPublication": True, "reviewed": False,
              "jobs": []}
    for job in jobs:
        locale = job["locale"]
        engine = load_translator(locale)
        entries = []
        for item in job["entries"]:
            translated = {"id": item["id"]}
            for field in FIELDS:
                source = item["source"][field]
                value = engine(source)
                require(isinstance(value, str) and value.strip() and value.strip() != source,
                        f"Empty or untranslated {locale}/{item['id']}/{field}")
                translated[field] = value.strip()
            entries.append(translated)
        result["jobs"].append({"locale": locale, "entries": entries})
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("packet", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    require(args.packet.resolve() != args.output.resolve(), "Do not overwrite the source packet")
    require(not args.output.exists(), "Output already exists")
    require(args.packet.stat().st_size <= 4 * 1024 * 1024, "Input exceeds 4 MiB")
    packet = json.loads(args.packet.read_text(encoding="utf-8"))
    result = generate(packet)
    with args.output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print("Unreviewed machine candidates created. Run check-return and independent review; do not publish.")

if __name__ == "__main__":
    main()
