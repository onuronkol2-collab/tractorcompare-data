-- READ-ONLY live verification for the 21 Nov 2026 guarded claim rewrite.
-- DO NOT invoke tc_claim_next_tractor_research() as a test: that changes queue state.
SELECT p.oid::regprocedure AS function_id,pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS is_security_definer,p.proconfig AS config,p.proacl AS grants,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_can_execute,
       has_function_privilege('service_role',p.oid,'EXECUTE') AS service_role_can_execute,
       position('JOIN public.tractors AS t' IN pg_get_functiondef(p.oid))>0 AS draft_join_present,
       position('t.status = ''draft''' IN pg_get_functiondef(p.oid))>0 AS draft_filter_present,
       position('EXISTS (' IN pg_get_functiondef(p.oid))>0 AS claim_update_rechecks_draft
FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
WHERE ns.nspname='public' AND p.proname='tc_claim_next_tractor_research';
-- Expected: postgres owner; security_definer=true, search_path="";
-- proacl={postgres=X/postgres,service_role=X/postgres};
-- anon=false, authenticated=false, service=true; three predicates true.

SELECT t.status AS tractor_status,count(*) eligible_queue_rows
FROM public.tractor_research_queue q JOIN public.tractors t ON t.id=q.tractor_id
WHERE (
  (q.status IN('queued','retry') AND q.next_attempt_at<=now())
  OR (q.status='running' AND q.updated_at<now()-interval '20 minutes')
) AND q.attempt_count<q.max_attempts
GROUP BY t.status ORDER BY t.status;
-- Before fix: 248 draft + 155 published + 3 archived technically eligible;
-- AFTER fix the SELECT inside function requires t.status='draft'.
-- This SQL deliberately shows retained audit rows and does not claim them.

SELECT m.run_id,m.status,m.finished_at,
 COUNT(o.object_name) AS privately_backed_up_function_definitions
FROM tc_backup.maintenance_runs m LEFT JOIN tc_backup.object_snapshots o USING(run_id)
WHERE m.migration_key='tractorvs_research_claim_draft_only_20261121'
GROUP BY m.run_id,m.status,m.finished_at;
-- Expected completed and 1 snapshot. No queue rows, tractor specs, photo rights or RLS policies changed.
