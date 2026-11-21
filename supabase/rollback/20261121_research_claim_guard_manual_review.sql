-- EMERGENCY REVIEW ONLY. NO DDL/DML in this file.
-- Do not revert merely to restore old queue priority behaviour: the archived
-- function can claim published/archived models and waste paid research budget.
BEGIN;
SET LOCAL statement_timeout='10s';
DO $review$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n
 FROM tc_backup.object_snapshots o
 JOIN tc_backup.maintenance_runs m ON m.run_id=o.run_id
 WHERE m.migration_key='tractorvs_research_claim_draft_only_20261121'
 AND m.status='completed'
 AND o.object_type='pg_function'
 AND o.object_name='public.tc_claim_next_tractor_research()'
 AND o.definition ? 'definition';
 IF n<>1 THEN RAISE EXCEPTION 'Expected one exact original function snapshot, found %',n; END IF;
 IF has_function_privilege('anon','public.tc_claim_next_tractor_research()','EXECUTE')
 OR has_function_privilege('authenticated','public.tc_claim_next_tractor_research()','EXECUTE')
 OR NOT has_function_privilege('service_role','public.tc_claim_next_tractor_research()','EXECUTE')
 THEN RAISE EXCEPTION 'Unexpected ACL state; manual security review required'; END IF;
END $review$;
ROLLBACK;
-- If an actual regression requires restoration, use the captured definition
-- JSON in private tc_backup.object_snapshots, inspect it alongside production
-- queue state, re-check owner/grants/search_path, and perform an authorized
-- single exact-function transaction with new backups and verification.
