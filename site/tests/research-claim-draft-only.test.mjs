import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("protected queue claimer keeps one locked row and refuses non-draft target on both selection and update",()=>{
 const sql=read("../../supabase/patches/20261121_tc_claim_next_draft_only_ALREADY_APPLIED.sql");
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.tc_claim_next_tractor_research\(\)/);
 assert.match(sql,/JOIN public\.tractors AS t ON t\.id = q\.tractor_id/);
 assert.match(sql,/WHERE t\.status = 'draft'/);
 assert.match(sql,/AND EXISTS\s*\(\s*SELECT 1 FROM public\.tractors AS t\s*WHERE t\.id=q\.tractor_id AND t\.status='draft'/);
 assert.match(sql,/FOR UPDATE OF q SKIP LOCKED/);
 assert.match(sql,/q\.attempt_count < q\.max_attempts/);
 assert.match(sql,/q\.status='running'/);
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/SET search_path TO ''/);
 assert.match(sql,/UPDATE public\.tractor_research_queue AS q/);
 assert.doesNotMatch(sql,/GRANT|CREATE POLICY|DROP TABLE/);
});

test("draft only queue safety record includes read-only audit and non-mutating rollback",()=>{
 const audit=read("../../supabase/verification/20261121_research_claim_draft_only_readonly.sql");
 const rollback=read("../../supabase/rollback/20261121_research_claim_guard_manual_review.sql");
 assert.match(audit,/has_function_privilege\('anon'/);
 assert.match(audit,/has_function_privilege\('authenticated'/);
 assert.match(audit,/has_function_privilege\('service_role'/);
 assert.match(audit,/tc_backup\.maintenance_runs/);
 assert.doesNotMatch(audit,/SELECT\s+\*\s+FROM\s+public\.tc_claim_next_tractor_research\s*\(/);
 assert.doesNotMatch(audit,/UPDATE\s+public\.|DELETE\s+FROM\s+public\./i);
 assert.match(rollback,/BEGIN;/);
 assert.match(rollback,/ROLLBACK;/);
 assert.doesNotMatch(rollback,/\b(?:DELETE|UPDATE|TRUNCATE|DROP|GRANT|REVOKE)\s+(?:public|tc_backup)\./i);
});
