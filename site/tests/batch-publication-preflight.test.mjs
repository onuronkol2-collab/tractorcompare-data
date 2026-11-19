import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sql=source("../supabase/verification/20261119_tractorvs_batch_publication_preflight.sql");

test("publication preflight starts a read-only transaction and never mutates any DB row",()=>{
  assert.match(sql,/BEGIN TRANSACTION READ ONLY;/i);
  assert.match(sql,/SET LOCAL statement_timeout/i);
  assert.match(sql,/ROLLBACK;/i);
  const commands=sql.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
  assert.doesNotMatch(commands,/\b(UPDATE|DELETE|INSERT|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE|EXECUTE|CALL)\s+/i);
  assert.doesNotMatch(commands,/\bCOMMIT\s*;/i);
  assert.doesNotMatch(commands,/pg_advisory_xact_lock/i);
});

test("preflight reports actual private draft inventory and source/identity safeguards",()=>{
  for(const token of [
    "WHERE t.status='draft'","GROUP BY status",
    "HAVING count(*)>1", "coalesce(t.variant",
    "coalesce(t.market", "t.model_year",
    "s.evidence_text","s.verified_at","d.source_url",
    "manufacturer_specification","source_excerpt_rows",
    "conflicting_measurement_groups",
    "HOLD_DUPLICATE_IDENTITY",
    "HOLD_CONFLICTING_MEASUREMENTS",
    "HOLD_NO_DOCUMENTED_MANUFACTURER_TYPE",
    "REVIEW_EXACT_VARIANT_AND_SOURCE_BEFORE_PUBLISH",
    "NO_AUTOMATIC_PUBLICATION",
    "non_published_records_exposed",
    "c.relrowsecurity"
  ])assert.ok(sql.includes(token),"Missing release gate "+token);
  const doc=source("../supabase/docs/TRACTORVS_BATCH_PUBLICATION_GATE.md");
  assert.match(doc,/actual Supabase|current Supabase|Supabase is not connected/);
  assert.match(doc,/from `draft` to `published`/);
  assert.match(doc,/Cloudflare/i);
  assert.match(doc,/zero|0/);
  assert.match(doc,/Do not.*UPDATE/i);
});

test("release docs reflect stable canonical root and static site rebuild requirement",()=>{
  const readme=source("README.md");
  assert.match(readme,/same canonical English HTML/);
  assert.match(readme,/build time/i);
  assert.match(readme,/20261119_tractorvs_batch_publication_preflight\.sql/);
  assert.doesNotMatch(readme,/Human navigations to `\/` may receive a \*\*302\*\*/);
});
