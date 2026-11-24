#!/usr/bin/env python3
"""Generate a private, guarded SQL review packet from a PDF column report.

No network, credentials or database execution. Default is a rollback-only
preflight. --stage creates an explicit transaction for the existing private
review table only; it cannot verify or publish a tractor/specification.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import uuid
from urllib.parse import urlsplit

MAX_INPUT = 4 * 1024 * 1024
MAX_ROWS = 1000
HASH = re.compile(r"[0-9a-f]{64}")
KEY = re.compile(r"[a-z][a-z0-9_]{0,79}")

def require(condition, message):
    if not condition:
        raise ValueError(message)

def string(value, limit=160):
    require(isinstance(value, str) and value == value.strip() and
            0 < len(value) <= limit and not any(ord(ch)<32 for ch in value),
            "invalid text field")
    return value

def optional(value, limit=160):
    return None if value is None else string(value, limit)

def integer(value, low, high):
    require(type(value) is int and low <= value <= high, "invalid integer")
    return value

def identity_uuid(value):
    value = string(value, 36)
    require(str(uuid.UUID(value)) == value, "canonical UUID required")
    return value

def read_private(path):
    path = Path(path).resolve(strict=True)
    root = Path(__file__).resolve().parents[1]
    require(path.is_file() and root not in path.parents, "private input outside checkout required")
    with path.open("rb") as f:
        data = f.read(MAX_INPUT + 1)
    require(len(data) <= MAX_INPUT, "private input limit")
    return json.loads(data)

def build_packet(report, plan):
    require(isinstance(report, dict) and isinstance(plan, dict), "invalid input")
    require(report.get("schema")==1 and plan.get("schema")==1, "invalid schema")
    sha = string(report.get("sha256"), 64)
    require(HASH.fullmatch(sha) and plan.get("document_sha256")==sha, "document hash mismatch")
    review = report.get("table_review")
    require(isinstance(review, dict) and review.get("status") in
            ("column_review_needed","partial_column_review") and
            review.get("approved")==0 and review.get("published")==0 and
            report.get("published")==0 and report.get("db_writes")==0, "unapproved PDF report required")
    pages = integer(report.get("pages"), 1, 120)
    source_url = string(plan.get("source_url"), 1600)
    u = urlsplit(source_url)
    require(u.scheme=="https" and bool(u.hostname) and not u.username and not u.password
            and u.port is None and not u.fragment and "." in u.hostname
            and not re.fullmatch(r"[0-9.]+",u.hostname), "invalid source URL")
    publisher = string(plan.get("source_publisher"))
    observed = string(plan.get("observed_at"), 10)
    require(datetime.date.fromisoformat(observed).isoformat()==observed and
            datetime.date.fromisoformat(observed)<=datetime.date.today(), "invalid observation date")

    targets = {}
    require(isinstance(plan.get("targets"), list) and 1<=len(plan["targets"])<=100, "invalid targets")
    for row in plan["targets"]:
        require(isinstance(row, dict), "invalid target")
        model = string(row.get("model"), 100)
        target = {"tractor_id":identity_uuid(row.get("tractor_id")),
                  "brand":string(row.get("brand"),100),
                  "model_name":string(row.get("model_name"),100),
                  "market":string(row.get("market"),160),
                  "variant":optional(row.get("variant"),300),
                  "model_year":None if row.get("model_year") is None else integer(row["model_year"],1900,2100)}
        require(model not in targets and target["model_name"]==model and
                all(x["tractor_id"]!=target["tractor_id"] for x in targets.values()),
                "duplicate or nonexact model mapping")
        require("variant" in row and "model_year" in row, "explicit null or exact identity required")
        targets[model] = target

    fields = {}
    require(isinstance(plan.get("fields"), list) and 1<=len(plan["fields"])<=1000, "invalid fields")
    for row in plan["fields"]:
        require(isinstance(row,dict), "invalid field")
        loc=(integer(row.get("page"),1,pages),integer(row.get("layout_line"),1,100000))
        key=string(row.get("canonical_key"),80)
        require(KEY.fullmatch(key) and loc not in fields, "duplicate row or invalid key")
        require("unit" in row and "measurement_standard" in row, "explicit null or exact unit/standard required")
        fields[loc] = {"source_label":string(row.get("source_label")),
                       "canonical_key":key,"spec_name":string(row.get("spec_name")),
                       "unit":optional(row.get("unit"),40),
                       "comparison_class":string(row.get("comparison_class"),80),
                       "measurement_standard":optional(row.get("measurement_standard"),300)}
    candidates=review.get("candidate_cells")
    require(isinstance(candidates,list) and 1<=len(candidates)<=10000, "invalid candidate inventory")
    blocked=review.get("blocked_rows")
    require(isinstance(blocked,list), "missing blocked rows")
    blocked_locs={(integer(x.get("page"),1,pages),integer(x.get("layout_line"),1,100000)) for x in blocked if isinstance(x,dict)}
    require(not (set(fields)&blocked_locs), "selected row was blocked in extraction")
    out, keys, matched_fields, matched_targets, cell_ids = [], set(),set(),set(),set()
    for c in candidates:
        require(isinstance(c,dict), "invalid cell")
        model=string(c.get("model"),100)
        loc=(integer(c.get("page"),1,pages),integer(c.get("layout_line"),1,100000))
        if model not in targets or loc not in fields:
            continue
        require(c.get("allowed_to_publish") is False and c.get("review_status")=="visual_column_review_needed",
                "invalid candidate status")
        start=integer(c.get("column_start"),1,999)
        end=integer(c.get("column_end"),start+1,1000)
        header=integer(c.get("header_line"),1,loc[1]-1)
        cell=(model,loc,start,end)
        require(cell not in cell_ids, "duplicate source cell")
        cell_ids.add(cell)
        field=fields[loc]
        require(string(c.get("source_label"))==field["source_label"], "row label mismatch")
        value=string(c.get("source_value"))
        require(value.casefold() not in {"-","–","—","n/a","na","unknown","same","ditto","none",'"'}, "ambiguous value")
        target=targets[model]
        scope=(target["tractor_id"],field["canonical_key"])
        require(scope not in keys, "multiple candidate values for same model/key; review separately")
        keys.add(scope)
        matched_fields.add(loc)
        matched_targets.add(model)
        evidence=f"PDF SHA256 {sha}; page {loc[0]}, header line {header}, layout line {loc[1]}, columns {start}:{end}; {model} | {field['source_label']} | {value}"
        out.append({**target,**{k:v for k,v in field.items() if k!="source_label"},
                    "spec_value":value,"source_url":source_url,"source_publisher":publisher,
                    "evidence_text":evidence,"observed_at":observed})
        require(len(out)<=MAX_ROWS, "transaction limit")
    require(out and matched_fields==set(fields) and matched_targets==set(targets),
            "unmatched field or model")
    # All mapped rows must cover every explicitly requested target. Missing
    # cells or incomplete scope require a smaller, explicit plan.
    require(len(out)==len(fields)*len(targets),"incomplete model-by-field coverage")
    return out

SQL_TEMPLATE = r"""BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '45s';
DO $packet$
DECLARE
  payload jsonb := convert_from(decode('__PAYLOAD_HEX__','hex'),'UTF8')::jsonb;
  expected integer := jsonb_array_length(payload);
  matched integer;
  inserted integer;
BEGIN
  IF expected NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'invalid review packet size'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.tractorvs_spec_review_candidates'::regclass AND relrowsecurity)
    OR has_table_privilege('anon','public.tractorvs_spec_review_candidates','SELECT,INSERT,UPDATE,DELETE')
    OR has_table_privilege('authenticated','public.tractorvs_spec_review_candidates','SELECT,INSERT,UPDATE,DELETE')
  THEN RAISE EXCEPTION 'private review table access guard failed'; END IF;
  -- Lock only intended tractors, in deterministic order; never alter them.
  PERFORM t.id FROM public.tractors t
    JOIN (SELECT DISTINCT (j->>'tractor_id')::uuid AS id FROM jsonb_array_elements(payload) j) ids
      ON ids.id=t.id ORDER BY t.id FOR UPDATE OF t;
  SELECT count(*) INTO matched FROM jsonb_array_elements(payload) j
    JOIN public.tractors t ON t.id=(j->>'tractor_id')::uuid
    JOIN public.brands b ON b.id=t.brand_id
    WHERE t.status='draft' AND b.name=j->>'brand' AND t.model_name=j->>'model_name'
      AND t.market=j->>'market' AND t.variant IS NOT DISTINCT FROM (j->>'variant')
      AND t.model_year IS NOT DISTINCT FROM (j->>'model_year')::integer
      AND EXISTS (SELECT 1 FROM public.tractor_specs s JOIN public.data_sources d ON d.id=s.source_id
        WHERE s.tractor_id=t.id AND d.source_url=j->>'source_url'
          AND d.publisher=j->>'source_publisher');
  IF matched<>expected THEN RAISE EXCEPTION 'draft identity or existing linked source changed'; END IF;
  -- Only private review candidates, never verified/public specs or statuses.
  INSERT INTO public.tractorvs_spec_review_candidates(
    tractor_id,canonical_key,spec_name,spec_value,unit,comparison_class,measurement_standard,
    source_url,source_publisher,source_tier,evidence_text,observed_at,review_status,review_note)
  SELECT (j->>'tractor_id')::uuid,j->>'canonical_key',j->>'spec_name',j->>'spec_value',
    j->>'unit',j->>'comparison_class',j->>'measurement_standard',j->>'source_url',
    j->>'source_publisher','manufacturer',j->>'evidence_text',(j->>'observed_at')::date,
    'needs_review','PDF cell extraction only; verify actual visual column, variant, market, year, units, standards, footnotes and conflicts before any approval.'
  FROM jsonb_array_elements(payload) j
  ON CONFLICT (tractor_id,canonical_key,spec_value,source_url) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  -- The unique key does not include unit/standard/evidence. Do not silently
  -- count a differently scoped pre-existing candidate as a matching record.
  SELECT count(*) INTO matched FROM jsonb_array_elements(payload) j
    JOIN public.tractorvs_spec_review_candidates c
      ON c.tractor_id=(j->>'tractor_id')::uuid AND c.canonical_key=j->>'canonical_key'
      AND c.spec_value=j->>'spec_value' AND c.source_url=j->>'source_url'
    WHERE c.unit IS NOT DISTINCT FROM (j->>'unit')
      AND c.measurement_standard IS NOT DISTINCT FROM (j->>'measurement_standard')
      AND c.comparison_class=j->>'comparison_class' AND c.spec_name=j->>'spec_name'
      AND c.source_publisher=j->>'source_publisher' AND c.source_tier='manufacturer'
      AND c.evidence_text=j->>'evidence_text';
  IF matched<>expected THEN RAISE EXCEPTION 'existing candidate scope/evidence conflict'; END IF;
  RAISE NOTICE 'Review packet rows %, newly staged %, exact already present %; zero published',expected,inserted,expected-inserted;
END
$packet$;
__FINISH__;
"""

def sql_packet(rows, stage=False):
    require(type(stage) is bool and isinstance(rows,list) and 1<=len(rows)<=MAX_ROWS, "invalid packet")
    # Hex-encoded UTF-8 JSON cannot terminate the SQL or dollar-quoted block.
    payload=json.dumps(rows,ensure_ascii=False,separators=(",",":")).encode("utf-8").hex()
    return SQL_TEMPLATE.replace("__PAYLOAD_HEX__",payload).replace("__FINISH__","COMMIT" if stage else "ROLLBACK")

def write_private_sql(path, sql):
    path=Path(path).absolute()
    parent=path.parent.resolve(strict=True)
    root=Path(__file__).resolve().parents[1]
    require(parent!=root and root not in parent.parents,"output must be outside checkout")
    fd=os.open(parent/path.name,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    with os.fdopen(fd,"w",encoding="utf-8") as f:
        f.write(sql)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report",required=True)
    parser.add_argument("--plan",required=True)
    parser.add_argument("--output",required=True)
    parser.add_argument("--stage",action="store_true",help="Generate commit packet; never execute it")
    args=parser.parse_args()
    try:
        rows=build_packet(read_private(args.report),read_private(args.plan))
        write_private_sql(args.output,sql_packet(rows,args.stage))
    except (ValueError,TypeError,AttributeError,OSError,RecursionError):
        parser.exit(1,"Private PDF review packet refused; inspect inputs locally.\n")
    print(json.dumps({"rows":len(rows),"models":len({r["tractor_id"] for r in rows}),
                      "mode":"stage_sql_only" if args.stage else "rollback_preflight_sql_only",
                      "db_writes":0,"published":0}))

if __name__=="__main__":
    main()
