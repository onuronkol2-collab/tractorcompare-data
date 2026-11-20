import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const audit=readFileSync(
  new URL("../../supabase/verification/20261120_all_tractor_source_and_spec_gap_audit.sql",import.meta.url),"utf8"
);
const docs=readFileSync(
  new URL("../docs/ALL_MODEL_SPEC_GAP_AUDIT_20261120.md",import.meta.url),"utf8"
);

test("all-model audit remains read-only; no status changes or draft data leaks",()=>{
  assert.match(audit,/BEGIN TRANSACTION READ ONLY;/);
  assert.match(audit,/ROLLBACK;/);
  assert.match(audit,/SET LOCAL statement_timeout/);
  const clean=audit.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
  assert.doesNotMatch(clean,/\b(UPDATE|DELETE|INSERT|TRUNCATE|ALTER|DROP|CREATE|GRANT|REVOKE|CALL)\s+/i);
  assert.doesNotMatch(clean,/\bCOMMIT\s*;/i);
  assert.match(clean,/FROM public\.tractorvs_public_specs/);
  assert.match(clean,/t\.status<>'published'/);
});
test("published and draft gap criteria include sources and major technical families",()=>{
  for(const expected of ["published","draft","source_url","verified_at",
    "evidence_text","canonical_key","engine","transmission","pto","hydraulic",
    "fuel","weight","dimensions","brakes","market","model_year","kg/HP"]) {
      assert.ok(audit.includes(expected),"Missing "+expected);
    }
});
test("source-family release documentation distinguishes evidence, market and static deployment",()=>{
  for(const expected of ["151 published","309 draft","Independent","Yanmar","Swaraj",
    "McCormick","TractorData","Cloudflare","RLS","verified"]) {
      assert.ok(docs.toLowerCase().includes(expected.toLowerCase()),"Missing "+expected);
    }
  assert.match(docs,/does not mean all/i);
});
