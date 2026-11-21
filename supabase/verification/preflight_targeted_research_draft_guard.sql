-- Read-only preflight, safe before migration.
SELECT 'targeted_research_claim' AS control,
       has_function_privilege('service_role','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE') AS service_role_allowed,
       NOT has_function_privilege('anon','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE') AS anon_denied,
       NOT has_function_privilege('authenticated','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE') AS authenticated_denied,
       (SELECT p.prosecdef FROM pg_proc p WHERE p.oid='public.tc_claim_tractor_research_by_id(uuid)'::regprocedure) AS security_definer_preserved;
SELECT t.status tractor_status,q.status queue_status,count(*) jobs
FROM public.tractor_research_queue q JOIN public.tractors t ON t.id=q.tractor_id
WHERE q.status IN ('queued','retry') GROUP BY t.status,q.status ORDER BY 1,2;
