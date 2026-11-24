#!/usr/bin/env python3
"""Offline manufacturer PDF review index. No network, AI, DB or publication.

Use only a lawfully obtained local manufacturer document in an isolated review
environment without credentials. A hit is a page-review lead, not a verified
model/variant/specification. Never commit private output or source PDFs.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import subprocess
import tempfile
import unicodedata

MAX_BYTES = 32 * 1024 * 1024
MAX_TEXT_BYTES = 4 * 1024 * 1024
MAX_PAGES = 120
MAX_MODELS = 100
MAX_HITS_PER_MODEL = 20

def fold(text):
    text = unicodedata.normalize("NFKC", str(text)).casefold()
    return re.sub(r"\s+", " ", text).strip()

def model_pattern(model):
    # Literal model tokens, including punctuation. A contiguous suffix is
    # not the same model. A spaced equipment suffix still needs visual review.
    model = fold(model)
    if not model or len(model) > 100:
        raise ValueError("invalid model identity")
    return re.compile(r"(?<![\w])" + re.escape(model) + r"(?![\w])")

def index_pages(pages, models):
    if not 1 <= len(models) <= MAX_MODELS or len(set(map(fold, models))) != len(models):
        raise ValueError("model list empty, duplicated or over limit")
    if not 1 <= len(pages) <= MAX_PAGES:
        raise ValueError("page limit")
    output = []
    for model in models:
        pattern = model_pattern(model)
        hits = []
        for number, page in enumerate(pages, 1):
            # Restrict persisted evidence to page locations, not full text.
            # Lines are useful for locating a header, never for assigning cells.
            for line_number, line in enumerate(page.splitlines(), 1):
                if pattern.search(fold(line)):
                    hits.append({"page": number, "layout_line": line_number})
                    if len(hits) >= MAX_HITS_PER_MODEL:
                        break
            if len(hits) >= MAX_HITS_PER_MODEL:
                break
        output.append({"model": model, "locations": hits,
                       "locations_capped": len(hits) == MAX_HITS_PER_MODEL,
                       "review_status": "page_review_needed" if hits else "not_located",
                       "allowed_to_publish": False})
    return output

def limits():
    # Linux/POSIX offline reviewer. Bound parser CPU, memory and output size.
    resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024,) * 2)
    resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_TEXT_BYTES, MAX_TEXT_BYTES))

def run_tool(args, cwd, output):
    with output.open("xb") as stream:
        result = subprocess.run(args, cwd=cwd, stdin=subprocess.DEVNULL,
                                stdout=stream, stderr=subprocess.DEVNULL,
                                timeout=40, check=False, preexec_fn=limits,
                                env={"PATH": os.defpath, "LC_ALL": "C.UTF-8"})
    if result.returncode or output.stat().st_size >= MAX_TEXT_BYTES:
        raise ValueError("PDF parser failed or exceeded limits")

def review_pdf(path, models):
    path = Path(path).resolve(strict=True)
    if not path.is_file() or not 5 <= path.stat().st_size <= MAX_BYTES:
        raise ValueError("PDF size or file type rejected")
    # Work from a single immutable byte snapshot, so the hash refers to the
    # exact bytes processed. Nothing from the original is copied to the repo.
    with path.open("rb") as f:
        data = f.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES or not data.startswith(b"%PDF-"):
        raise ValueError("not a bounded PDF")
    digest = hashlib.sha256(data).hexdigest()
    with tempfile.TemporaryDirectory(prefix="tractor-pdf-review-") as root:
        root = Path(root)
        pdf = root / "document.pdf"
        pdf.write_bytes(data)
        info = root / "info.txt"
        run_tool(["pdfinfo", str(pdf)], root, info)
        match = re.search(r"^Pages:\s+(\d+)\s*$", info.read_text(), re.M)
        if not match or not 1 <= int(match.group(1)) <= MAX_PAGES:
            raise ValueError("unknown or excessive PDF page count")
        count = int(match.group(1))
        extracted = root / "layout.txt"
        run_tool(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf), "-"], root, extracted)
        raw = extracted.read_text(encoding="utf-8")
        pages = raw.split("\f")
        if len(pages) == count + 1 and not pages[-1].strip():
            pages.pop()
        if len(pages) != count:
            raise ValueError("PDF page/layout mismatch")
        located = index_pages(pages, models)
        blank = [i for i, page in enumerate(pages, 1) if not page.strip()]
        return {"schema": 1, "sha256": digest, "bytes": len(data),
                "pages": count, "textless_pages": blank,
                "status": "partial_text_review" if blank else "page_indexed",
                "models": located, "paid_calls": 0, "db_writes": 0,
                "published": 0,
                "note": "Review actual PDF page, exact column, variant, market, units and footnotes independently. No OCR or spec assignment."}

def write_private(report, output):
    output = Path(output).absolute()
    root = Path(__file__).resolve().parents[1]
    # Resolve the parent to reject symlink paths back into the checkout.
    parent = output.parent.resolve(strict=True)
    if parent == root or root in parent.parents:
        raise ValueError("review output must be outside the repository")
    fd = os.open(parent / output.name,
                 os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
        f.write("\n")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--model", action="append", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    try:
        report = review_pdf(args.pdf, args.model)
        write_private(report, args.output)
    except (OSError, ValueError, subprocess.SubprocessError):
        # Private source paths, model names and parser messages must not leak.
        parser.exit(1, "PDF review failed; inspect the local input and limits privately.\n")
    print(json.dumps({"status": report["status"], "pages": report["pages"],
                      "textless_pages": len(report["textless_pages"]),
                      "models": len(report["models"]),
                      "models_located": sum(bool(m["locations"]) for m in report["models"]),
                      "published": 0, "paid_calls": 0, "db_writes": 0}))

if __name__ == "__main__":
    main()
