import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../../supabase/verification/20261123_belarus_900_private_power_review_audit.sql",import.meta.url),"utf8");
const doc=readFileSync(new URL("../docs/BELARUS_900_PRIVATE_POWER_REVIEW_20261123.md",import.meta.url),"utf8");

test("Belarus manual-source power audit remains strictly read-only",()=>{
  assert.match(sql,/BEGIN TRANSACTION READ ONLY;/);
  assert.match(sql,/ROLLBACK;/);
  const stripped=sql.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
  assert.doesNotMatch(stripped,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP|CREATE|GRANT|REVOKE|CALL|COMMIT|COPY|DO|EXECUTE)\b/i);
  assert.match(sql,/has_table_privilege\('anon'/);
  assert.match(sql,/has_table_privilege\('authenticated'/);
  assert.match(sql,/review_status='needs_review'/);
  assert.match(sql,/AND NOT exists_as_live_spec/);
});

test("five private proposals preserve exact model and power-kind distinctions",()=>{
  for(const model of ["922.4","923.3","952.4"])assert.ok(doc.includes(model));
  for(const term of ["D-245.5S3A","D-245.5S2","70,0 ± 2,0 kW","66,7 ± 2,0 kW",
    "needs_review","0","kW","Cloudflare","AGENTS.md"])assert.ok(doc.includes(term),term);
  assert.equal((sql.match(/'manufacturer_nominal_engine_power'/g)||[]).length,3);
  assert.equal((sql.match(/'manufacturer_operating_engine_power'/g)||[]).length,2);
  assert.equal((sql.match(/'https:\/\/(?:www\.istokrtps\.ru|mtzavr\.ru|beltrakt\.ru)/g)||[]).length,5);
  assert.match(doc,/engine|motor/i);
  assert.match(doc,/yayınlama için ek kapı/i);
});
