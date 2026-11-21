import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const base=new URL("../supabase/",import.meta.url);
const migration=readFileSync(new URL("migrations/20261121093000_tractorvs_targeted_research_draft_guard.sql",base),"utf8");
const rollback=readFileSync(new URL("rollback/20261121093000_tractorvs_targeted_research_draft_guard_rollback.sql",base),"utf8");
const verify=readFileSync(new URL("verification/verify_targeted_research_draft_guard.sql",base),"utf8");

test("targeted queue claim requires live draft identity both at SELECT and UPDATE",()=>{
 assert.match(migration,/JOIN public\.tractors AS t ON t\.id=q\.tractor_id/);
 assert.match(migration,/WHERE q\.tractor_id=p_tractor_id AND t\.status='draft'/);
 assert.match(migration,/AND EXISTS \(\s*SELECT 1 FROM public\.tractors AS t\s*WHERE t\.id=q\.tractor_id AND t\.status='draft'/);
 assert.match(migration,/FOR UPDATE OF q SKIP LOCKED/);
 assert.match(migration,/q\.next_attempt_at<=now\(\)/);
 assert.match(migration,/q\.attempt_count<q\.max_attempts/);
 assert.match(migration,/q\.updated_at<now\(\)-interval '20 minutes'/);
});

test("queue protections preserve privileged access and do not modify data outside claims",()=>{
 for(const text of [migration,rollback]){
  assert.match(text,/SECURITY DEFINER/);
  assert.match(text,/SET search_path TO ''/);
  assert.match(text,/REVOKE ALL ON FUNCTION public\.tc_claim_tractor_research_by_id\(uuid\) FROM PUBLIC,anon,authenticated/);
  assert.match(text,/GRANT EXECUTE ON FUNCTION public\.tc_claim_tractor_research_by_id\(uuid\) TO service_role/);
  assert.doesNotMatch(text,/\b(?:TRUNCATE|DELETE FROM|DROP TABLE|ALTER TABLE|UPDATE public\.tractors)\b/i);
 }
 assert.match(migration,/BEGIN;/);
 assert.match(migration,/COMMIT;/);
 assert.match(rollback,/BEGIN;/);
 assert.match(rollback,/COMMIT;/);
});

test("read-only verification refuses missing guard and public RPC grants",()=>{
 assert.match(verify,/pg_get_functiondef/);
 assert.match(verify,/Draft gating missing/);
 assert.match(verify,/has_function_privilege\('anon'/);
 assert.match(verify,/has_function_privilege\('authenticated'/);
 assert.match(verify,/has_function_privilege\('service_role'/);
 assert.doesNotMatch(verify,/UPDATE public\./i);
});

test("rollback preserves old targeted semantics for emergency recovery",()=>{
 assert.match(rollback,/WHERE q\.tractor_id=p_tractor_id/);
 assert.doesNotMatch(rollback,/JOIN public\.tractors AS t/);
 assert.match(rollback,/RETURNING q\.\*/);
});
