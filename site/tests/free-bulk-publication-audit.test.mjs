import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../../supabase/verification/20261120_bulk_source_family_triage.sql",import.meta.url),"utf8");
test("new large-family readiness plan is read-only and never approves unverified model identities",()=>{
  assert.match(sql,/BEGIN TRANSACTION READ ONLY;/i);
  assert.match(sql,/SET LOCAL statement_timeout/i);
  assert.match(sql,/ROLLBACK;/i);
  const noComments=sql.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
  assert.doesNotMatch(noComments,/\b(UPDATE|DELETE|INSERT|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE|EXECUTE|CALL)\s+/i);
  assert.doesNotMatch(noComments,/\bCOMMIT\s*;/i);
  for(const x of ["t.status='draft'","s.verified_at","s.evidence_text","d.source_url","t.model_name","t.variant","t.market","t.model_year","tractorvs_public_specs","non_published_rows_exposed"]){
    assert.ok(sql.includes(x),"Missing model/variant/source safety criterion "+x);
  }
});
test("site release docs distinguish static deployment, verified data, and draft privacy",()=>{
  const doc=readFileSync(new URL("../docs/TRACTORVS_BULK_COMPLETION_20261120.md",import.meta.url),"utf8");
  assert.match(doc,/Cloudflare/);
  assert.match(doc,/Gemini/);
  assert.match(doc,/TinyFish/);
  assert.match(doc,/catalogue.*source/i);
  assert.match(doc,/draft/);
  assert.match(doc,/copyright|license/i);
  assert.match(doc,/auto.sync|auto-sync/i);
});