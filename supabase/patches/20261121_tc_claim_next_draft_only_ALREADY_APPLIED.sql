-- ALREADY APPLIED to live Supabase 21 Nov 2026.
-- Reference/recovery source, NOT an unapplied migration; DO NOT blindly re-run.
-- Original function archived privately in tc_backup.object_snapshots with
-- run_id a26f0b0a-e2eb-4b89-b8f7-315ea2505132.
--
-- Replaced body (live pg_get_functiondef checks verified after atomic apply).
-- Preserve existing owner postgres, SECURITY DEFINER, blank search_path,
-- and execute privileges postgres/service_role ONLY.
CREATE OR REPLACE FUNCTION public.tc_claim_next_tractor_research()
 RETURNS SETOF public.tractor_research_queue
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $claim$
DECLARE
    selected_id uuid;
BEGIN
    SELECT q.id INTO selected_id
    FROM public.tractor_research_queue AS q
    JOIN public.tractors AS t ON t.id = q.tractor_id
    WHERE t.status = 'draft'
      AND (
            (q.status IN ('queued','retry') AND q.next_attempt_at <= now())
            OR (q.status='running' AND q.updated_at < now() - interval '20 minutes')
          )
      AND q.attempt_count < q.max_attempts
    ORDER BY q.priority ASC, q.created_at ASC
    LIMIT 1 FOR UPDATE OF q SKIP LOCKED;

    IF selected_id IS NULL THEN
      RETURN;
    END IF;

    RETURN QUERY
    UPDATE public.tractor_research_queue AS q
       SET status='running',
           attempt_count=q.attempt_count+1,
           updated_at=now()
    WHERE q.id=selected_id
      AND EXISTS (
        SELECT 1 FROM public.tractors AS t
        WHERE t.id=q.tractor_id AND t.status='draft'
      )
    RETURNING q.*;
END;
$claim$;
