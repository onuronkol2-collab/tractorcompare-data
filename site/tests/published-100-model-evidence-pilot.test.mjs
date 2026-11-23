import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const sql = readFileSync(
  new URL("../../supabase/verification/20261123_published_100_model_evidence_pilot.sql",import.meta.url),"utf8"
);
const report = readFileSync(
  new URL("../docs/PUBLISHED_100_MODEL_EVIDENCE_PILOT_20261123.md",import.meta.url),"utf8"
);

test("100-model production metadata pilot is repeatable and strictly read-only",()=>{
  assert.match(sql,/BEGIN TRANSACTION READ ONLY;/i);
  assert.match(sql,/SET LOCAL statement_timeout = '30s';/i);
  assert.match(sql,/ROLLBACK;/i);
  const statements = sql.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
  assert.doesNotMatch(statements,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP|CREATE|GRANT|REVOKE|CALL|COMMIT|COPY|DO|EXECUTE)\b/i);
  assert.ok((sql.match(/tractorvs-quality-pilot-20261123/g)||[]).length>=3);
  assert.match(sql,/WHERE status='published'/);
  assert.match(sql,/LIMIT 100/);
  assert.match(sql,/count\(s\.id\)/i);
});

test("the report distinguishes metadata gaps from proven data errors or security findings",()=>{
  for(const term of ["2,334","8","18","28","54","47","7","390 published",
    "All 305 pending","379","408","unit case differences","not proof",
    "no new participant observation","no deployment"]){
    assert.ok(report.toLowerCase().includes(term.toLowerCase()),"Missing caution or result: "+term);
  }
  assert.match(sql,/lower\(coalesce\(btrim\(s\.unit\)/);
  assert.match(sql,/f\.review_status='pending' AND f\.inserted_spec_id IS NOT NULL/);
  assert.match(report,/source pointer is not the same as evidence authenticity/i);
});
