#!/usr/bin/env python3
"""Extract model IDs only from repo snapshot, never publish stale statuses."""
import csv, io, json, os, sys, zipfile
csv.field_size_limit(sys.maxsize)
with zipfile.ZipFile("tractordata.zip") as z:
    data=z.read("sql.txt").decode("utf-8-sig")
rows=list(csv.DictReader(io.StringIO(data)))
brands={}
for row in rows:
    if row["dataset"]=="01_brands":
        for rec in json.loads(row["records_json"]):
            d=rec["data"];brands[d["id"]]=d["name"]
tractors=[]
for row in rows:
    if row["dataset"]=="02_tractors":
        for rec in json.loads(row["records_json"]):
            d=rec["data"]
            if d.get("status") not in ("published","draft"):continue
            brand=brands.get(d.get("brand_id"))
            if brand and d.get("model_name"):
                tractors.append({"brand":brand,"model":d["model_name"],
                  "variant":d.get("variant"),"market":d.get("market"),
                  "snapshot_status":d.get("status"),"status":"historical_unverified"})
os.makedirs("photo-discovery-report",exist_ok=True)
with open("photo-discovery-report/archived-tractor-models.json","w",encoding="utf8") as f:
    json.dump(tractors,f,ensure_ascii=False,indent=2)
print("ARCHIVE_TRACTOR_INVENTORY "+json.dumps({"records":len(tractors),
  "models":len({(x["brand"],x["model"]) for x in tractors}),
  "brands":len({x["brand"] for x in tractors}),"snapshot":"2026-11-14"}))
