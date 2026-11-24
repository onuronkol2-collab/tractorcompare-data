"""Strict layout-based PDF table candidate extraction. No approval or DB writes.

A reviewer supplies the document hash, exact page/header and explicit column
boundaries. PDF text positions are hints only; visually verify the rendered
table, scope and footnotes before passing evidence to the existing triage.
"""
import re
import unicodedata

MAX_TABLES = 20
MAX_COLUMNS = 100
MAX_ROWS = 100
MAX_WIDTH = 1000
MAX_CANDIDATES = 10000

def normalized(value):
    if not isinstance(value, str):
        raise ValueError("invalid text")
    return " ".join(unicodedata.normalize("NFKC", value).split())

def int_in(value, minimum, maximum):
    if type(value) is not int or not minimum <= value <= maximum:
        raise ValueError("invalid table coordinate")
    return value

def text_field(value, limit=160):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError("invalid table text field")
    return value

def split_cells(line, columns):
    # Coordinates refer to code-point positions in pdftotext -layout output.
    # Reject tabs/control characters and nonblank gaps; never shift tokens to
    # fill missing cells or infer a shared value from a merged column.
    if len(line) > MAX_WIDTH or any(ord(ch) < 32 for ch in line):
        raise ValueError("unsupported layout line")
    cells = []
    first = columns[0]["start"]
    previous = first
    for col in columns:
        start, end = col["start"], col["end"]
        if line[previous:start].strip():
            raise ValueError("nonblank intercolumn gap")
        if start and start < len(line) and not line[start-1:start].isspace() and not line[start:start+1].isspace():
            raise ValueError("token crosses column boundary")
        if end < len(line) and not line[end-1:end].isspace() and not line[end:end+1].isspace():
            raise ValueError("token crosses column boundary")
        cells.append(line[start:end].strip())
        previous = end
    if line[previous:].strip():
        raise ValueError("unmapped trailing content")
    return line[:first].strip(), cells

def extract_candidates(pages, models, document_sha, manifest):
    if not isinstance(manifest, dict) or manifest.get("sha256") != document_sha:
        raise ValueError("manifest must match exact document hash")
    if manifest.get("schema") != 1:
        raise ValueError("unsupported manifest schema")
    tables = manifest.get("tables")
    if not isinstance(tables, list) or not 1 <= len(tables) <= MAX_TABLES:
        raise ValueError("invalid table list")
    known = {normalized(model) for model in models}
    if len(known) != len(models):
        raise ValueError("ambiguous requested model list")
    candidates, blocked, used_rows = [], [], set()
    for table in tables:
        if not isinstance(table, dict):
            raise ValueError("invalid table")
        page = int_in(table.get("page"), 1, len(pages))
        lines = pages[page-1].splitlines()
        header = int_in(table.get("header_line"), 1, len(lines))
        columns = table.get("columns")
        if not isinstance(columns, list) or not 2 <= len(columns) <= MAX_COLUMNS:
            raise ValueError("invalid column count")
        seen, previous = set(), 0
        for col in columns:
            if not isinstance(col, dict):
                raise ValueError("invalid column")
            model = text_field(col.get("model"), 100)
            name = normalized(model)
            if name not in known or name in seen:
                raise ValueError("unrequested or duplicate model column")
            seen.add(name)
            start = int_in(col.get("start"), 1, MAX_WIDTH-1)
            end = int_in(col.get("end"), start+1, MAX_WIDTH)
            if start <= previous:
                raise ValueError("overlapping or unseparated columns")
            previous = end
        header_label, headers = split_cells(lines[header-1], columns)
        if normalized(header_label) != normalized(text_field(table.get("header_label"))):
            raise ValueError("header label mismatch")
        if [normalized(x) for x in headers] != [normalized(c["model"]) for c in columns]:
            raise ValueError("exact model column header mismatch")
        rows = table.get("rows")
        if not isinstance(rows, list) or not 1 <= len(rows) <= MAX_ROWS:
            raise ValueError("invalid row count")
        for row in rows:
            if not isinstance(row, dict):
                raise ValueError("invalid row")
            number = int_in(row.get("line"), header+1, len(lines))
            identity = (page, number)
            if identity in used_rows:
                raise ValueError("duplicate source row")
            used_rows.add(identity)
            label = text_field(row.get("label"))
            try:
                actual, values = split_cells(lines[number-1], columns)
                if normalized(actual) != normalized(label):
                    raise ValueError("row label mismatch")
                if any(not v or len(v) > 160 or normalized(v).casefold() in
                       {"-", "–", "—", "n/a", "na", "none", "unknown", "same", "ditto", '"'} for v in values):
                    raise ValueError("missing or ambiguous cell")
            except ValueError:
                blocked.append({"page": page, "layout_line": number,
                                "reason": "layout_or_missing_cell_review"})
                continue
            for col, value in zip(columns, values):
                candidates.append({"model": col["model"], "page": page,
                                   "header_line": header, "layout_line": number,
                                   "column_start": col["start"], "column_end": col["end"],
                                   "source_label": actual, "source_value": value,
                                   "review_status": "visual_column_review_needed",
                                   "allowed_to_publish": False})
                if len(candidates) > MAX_CANDIDATES:
                    raise ValueError("candidate output limit")
    return {"candidate_cells": candidates, "blocked_rows": blocked,
            "status": "partial_column_review" if blocked else "column_review_needed",
            "approved": 0, "published": 0}
