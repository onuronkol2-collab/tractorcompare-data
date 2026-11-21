import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../supabase/",import.meta.url);
const sql=readFileSync(new URL("maintenance/20261121_oem_source_review_batch.sql",root),"utf8");
const back=readFileSync(new URL("rollback/20261121_oem_source_review_batch_rollback.sql",root),"utf8");
const check=readFileSync(new URL("verification/20261121_oem_source_review_packet_check.sql",root),"utf8");
test("source packet contains 23 exact-spec and 3 independent conflict checks",()=>{
 assert.match(sql,/v_existing<>23/);
 assert.match(sql,/v_conflicts<>3/);
 assert.match(sql,/s\.spec_value=e\.spec_value AND s\.unit IS NOT DISTINCT FROM e\.unit/);
 assert.match(sql,/t\.model_year IS NULL AND t\.status='draft'/);
 assert.match(sql,/d\.source_url=e\.source_url/);
 assert.match(sql,/d\.source_url=c\.source_url/);
 assert.match(sql,/ON CONFLICT\(tractor_id,canonical_key,spec_value,source_url\) DO NOTHING/);
});
test("no publication, overwriting specs, or authentication change",()=>{
 assert.doesNotMatch(sql,/(?:UPDATE|DELETE FROM|TRUNCATE|DROP TABLE)\s+public\.tractor_specs\b/i);
 assert.doesNotMatch(sql,/(?:UPDATE|DELETE FROM|TRUNCATE|DROP TABLE)\s+public\.tractors\b/i);
 assert.doesNotMatch(sql,/(?:UPDATE|DELETE FROM|TRUNCATE)\s+public\.ai_research_findings\b/i);
 assert.doesNotMatch(sql,/review_status\s*=\s*'approved'/i);
 assert.doesNotMatch(sql,/\bpublished\s*[,;)]/i);
 assert.match(sql,/'needs_review'/);
 assert.match(sql,/has_table_privilege\('anon','public.tractorvs_spec_review_candidates','SELECT'\)/);
 assert.match(sql,/has_table_privilege\('authenticated','public.tractorvs_spec_review_candidates','SELECT'\)/);
});
test("private backups and rollback do not remove reviewed records",()=>{
 assert.match(sql,/tc_backup\.maintenance_runs/);
 assert.match(sql,/tc_backup\.row_snapshots/);
 assert.match(sql,/public\.tractorvs_spec_review_candidates_created/);
 assert.match(back,/c\.review_status<>'needs_review'/);
 assert.match(back,/to_jsonb\(c\) IS DISTINCT FROM s\.row_data/);
 assert.match(back,/ROLLBACK MISMATCH|Rollback mismatch/);
 assert.match(back,/GET DIAGNOSTICS v_removed=ROW_COUNT/);
 assert.doesNotMatch(back,/(?:UPDATE|DELETE FROM)\s+public\.(?:tractors|tractor_specs)\b/i);
});
test("evidence separates three OEM contradictions and maintains original review status",()=>{
 assert.match(sql,/TIGRE 3800 F/);
 assert.match(sql,/1642/);
 assert.match(sql,/1331/);
 assert.match(sql,/MACH 2 R/);
 assert.match(sql,/98 hp/i);
 assert.match(sql,/74\.2 hp/);
 assert.match(sql,/GT 22 4WD/);
 assert.match(sql,/2WD/);
 assert.match(sql,/DATE '2026-11-21'/);
 assert.match(check,/current_packet_inserted/);
});
