-- Read-only post-migration verification. No queue entry is claimed.
DO $verify$
DECLARE src text;
BEGIN
 src:=pg_get_functiondef('public.tc_claim_tractor_research_by_id(uuid)'::regprocedure);
 IF position('JOIN public.tractors AS t ON t.id=q.tractor_id' in src)=0
    OR position('t.status=''draft''' in src)=0
    OR position('AND EXISTS (' in src)=0
 THEN RAISE EXCEPTION 'Draft gating missing in targeted claim RPC'; END IF;
 IF NOT has_function_privilege('service_role','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'Targeted claim RPC has unsafe grants'; END IF;
 IF NOT (SELECT p.prosecdef FROM pg_proc p WHERE p.oid='public.tc_claim_tractor_research_by_id(uuid)'::regprocedure)
 THEN RAISE EXCEPTION 'Security-definer contract lost'; END IF;
END $verify$;
SELECT 'PASS' AS targeted_claim_guard_status,
 count(*) FILTER(WHERE t.status='draft' AND q.status IN ('queued','retry')) AS draft_jobs_remaining,
 count(*) FILTER(WHERE t.status IN ('published','archived') AND q.status IN ('queued','retry')) AS non_draft_jobs_not_deleted
FROM public.tractor_research_queue q JOIN public.tractors t ON t.id=q.tractor_id;
