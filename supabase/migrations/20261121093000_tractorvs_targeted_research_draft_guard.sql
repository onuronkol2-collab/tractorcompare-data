-- TractorVS: prevent paid targeted research claims of published/archived tractors.
-- Reversible function-only change; NO queue, model, finding or specification rows change.
-- Assumes the pre-existing generic tc_claim_next_tractor_research() already guards draft.
BEGIN;
DO $preflight$
BEGIN
 IF to_regclass('public.tractors') IS NULL OR to_regclass('public.tractor_research_queue') IS NULL
    OR to_regprocedure('public.tc_claim_tractor_research_by_id(uuid)') IS NULL THEN
   RAISE EXCEPTION 'Required TractorVS research objects missing; stopping.';
 END IF;
 IF NOT has_function_privilege('service_role','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE')
    OR has_function_privilege('authenticated','public.tc_claim_tractor_research_by_id(uuid)','EXECUTE') THEN
   RAISE EXCEPTION 'Unexpected research RPC grants; review before changing.';
 END IF;
 IF NOT (SELECT p.prosecdef FROM pg_proc p WHERE p.oid='public.tc_claim_tractor_research_by_id(uuid)'::regprocedure) THEN
   RAISE EXCEPTION 'RPC security-definer contract changed; stop.';
 END IF;
 IF position('AND EXISTS (' in pg_get_functiondef('public.tc_claim_tractor_research_by_id(uuid)'::regprocedure))>0 THEN
   RAISE EXCEPTION 'Targeted claim function has already changed; review rather than overwrite.';
 END IF;
END
$preflight$;

CREATE OR REPLACE FUNCTION public.tc_claim_tractor_research_by_id(p_tractor_id uuid)
RETURNS SETOF public.tractor_research_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $body$
DECLARE
  selected_id uuid;
BEGIN
  IF p_tractor_id IS NULL THEN
    RAISE EXCEPTION 'p_tractor_id is required';
  END IF;

  -- Match the generic queue-claim invariant: research queue dispatch is
  -- for private draft targets, not previously published or archived rows.
  SELECT q.id INTO selected_id
  FROM public.tractor_research_queue AS q
  JOIN public.tractors AS t ON t.id=q.tractor_id
  WHERE q.tractor_id=p_tractor_id AND t.status='draft'
    AND (
      (q.status IN ('queued','retry') AND q.next_attempt_at<=now())
      OR (q.status='running' AND q.updated_at<now()-interval '20 minutes')
    )
    AND q.attempt_count<q.max_attempts
  ORDER BY q.priority ASC,q.created_at ASC
  LIMIT 1 FOR UPDATE OF q SKIP LOCKED;

  IF selected_id IS NULL THEN RETURN; END IF;

  -- Recheck state at the atomic UPDATE; prevents a racing publication
  -- or archive action from consuming a queued targeted research claim.
  RETURN QUERY
  UPDATE public.tractor_research_queue AS q
     SET status='running',
         attempt_count=q.attempt_count+1,
         updated_at=now()
   WHERE q.id=selected_id
     AND q.tractor_id=p_tractor_id
     AND EXISTS (
       SELECT 1 FROM public.tractors AS t
       WHERE t.id=q.tractor_id AND t.status='draft'
     )
  RETURNING q.*;
END;
$body$;

REVOKE ALL ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) TO service_role;
COMMENT ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) IS
 'Atomically claims eligible research queue entry for one exact DRAFT tractor only; no public/archived targets. Service role only.';
COMMIT;
