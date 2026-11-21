-- Rollback exact previous function semantics (as inspected before migration).
-- Not recommended without first examining publication risk. No row changes.
BEGIN;
CREATE OR REPLACE FUNCTION public.tc_claim_tractor_research_by_id(p_tractor_id uuid)
RETURNS SETOF public.tractor_research_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $body$
DECLARE
  selected_id uuid;
BEGIN
  IF p_tractor_id IS NULL THEN RAISE EXCEPTION 'p_tractor_id is required'; END IF;
  SELECT q.id INTO selected_id
  FROM public.tractor_research_queue q
  WHERE q.tractor_id=p_tractor_id
    AND (
      (q.status IN ('queued','retry') AND q.next_attempt_at<=now())
      OR (q.status='running' AND q.updated_at<now()-interval '20 minutes')
    )
    AND q.attempt_count<q.max_attempts
  ORDER BY q.priority ASC,q.created_at ASC
  LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF selected_id IS NULL THEN RETURN; END IF;
  RETURN QUERY
  UPDATE public.tractor_research_queue q
  SET status='running',attempt_count=q.attempt_count+1,updated_at=now()
  WHERE q.id=selected_id AND q.tractor_id=p_tractor_id
  RETURNING q.*;
END;
$body$;
REVOKE ALL ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) TO service_role;
COMMENT ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) IS
 'Atomically claims the next eligible research queue row for one exact tractor ID. Does not consume jobs belonging to other tractor IDs. Intended for the authenticated Edge Function service role.';
COMMIT;
