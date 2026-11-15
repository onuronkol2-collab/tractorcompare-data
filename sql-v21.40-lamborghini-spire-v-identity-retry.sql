-- TractorCompare AI v21.40 — prepare verified Spire S/V research states
-- Run only after deploying index-v21.40.ts.
-- This migration does NOT insert, approve, or publish technical findings.
-- It reconciles the successful S queue and requeues only the previously blocked V job.

BEGIN;

DO $$
DECLARE
    v_count integer;
    v_s_pending integer;
    v_v_findings integer;
BEGIN
    -- Exact S and V catalog identities must still match the reviewed records.
    SELECT COUNT(*) INTO v_count
    FROM public.tractors t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE b.name = 'Lamborghini Trattori'
      AND (
        (t.id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
         AND t.model_name = 'Spire S 80 Target'
         AND t.market = 'global'
         AND t.status = 'draft')
        OR
        (t.id = '5139abf5-726b-4cc0-961a-e9f0277e0ead'
         AND t.model_name = 'Spire V 80 Target'
         AND t.market = 'global'
         AND t.status = 'draft')
      );

    IF v_count <> 2 THEN
        RAISE EXCEPTION
          'S/V catalog preflight failed: expected exactly two unchanged draft records, found %. No changes committed.',
          v_count;
    END IF;

    -- S run must be completed and fully persisted against the exact S tractor.
    SELECT COUNT(*) INTO v_count
    FROM public.ai_research_runs r
    WHERE r.id = '37450e92-79bd-4bca-8daf-c720676ab4ff'
      AND r.status = 'completed'
      AND r.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
      AND r.result_meta->>'model_found' = 'true'
      AND r.result_meta->>'matched_tractor_id' = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
      AND (r.result_meta->>'findings_saved')::integer = 56;

    IF v_count <> 1 THEN
        RAISE EXCEPTION
          'S run verification failed; expected its exact completed 56-finding result. No changes committed.';
    END IF;

    SELECT COUNT(*) INTO v_s_pending
    FROM public.ai_research_findings f
    WHERE f.run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'
      AND f.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
      AND f.review_status = 'pending';

    IF v_s_pending <> 56 THEN
        RAISE EXCEPTION
          'S pending findings mismatch: expected 56, found %. No changes committed.',
          v_s_pending;
    END IF;

    -- Previous V run must be the precise identity-failed / zero-persisted run.
    SELECT COUNT(*) INTO v_count
    FROM public.ai_research_runs r
    WHERE r.id = '0e8fcf04-bb06-46da-8e68-d4604a8db819'
      AND r.status = 'completed'
      AND r.tractor_id = '5139abf5-726b-4cc0-961a-e9f0277e0ead'
      AND r.result_meta->>'model_found' = 'false'
      AND r.result_meta->>'pinned_target_tractor_id' = '5139abf5-726b-4cc0-961a-e9f0277e0ead'
      AND (r.result_meta->>'findings_saved')::integer = 0;

    IF v_count <> 1 THEN
        RAISE EXCEPTION
          'V previous run is not the expected zero-persisted identity-failed run. No changes committed.';
    END IF;

    SELECT COUNT(*) INTO v_v_findings
    FROM public.ai_research_findings f
    WHERE f.run_id = '0e8fcf04-bb06-46da-8e68-d4604a8db819'
       OR f.tractor_id = '5139abf5-726b-4cc0-961a-e9f0277e0ead';

    IF v_v_findings <> 0 THEN
        RAISE EXCEPTION
          'Unexpected existing V findings found (%); manual review is required. No changes committed.',
          v_v_findings;
    END IF;

    -- Exact queue state must still point to the two reviewed run IDs.
    SELECT COUNT(*) INTO v_count
    FROM public.tractor_research_queue q
    WHERE (
      q.id = '8f407f35-5534-40b7-891f-ba0249fe25db'
      AND q.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
      AND q.last_run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'
      AND q.status IN ('retry', 'queued', 'running', 'completed')
    )
    OR (
      q.id = 'b914d47a-258c-45e3-85d3-2d8cb5b41e49'
      AND q.tractor_id = '5139abf5-726b-4cc0-961a-e9f0277e0ead'
      AND q.last_run_id = '0e8fcf04-bb06-46da-8e68-d4604a8db819'
      AND q.status IN ('retry', 'needs_source', 'queued')
    );

    IF v_count <> 2 THEN
        RAISE EXCEPTION
          'S/V queue state changed since review. No changes committed.';
    END IF;

    -- The shared technical PDF must exist exactly once in the official source registry.
    SELECT COUNT(*) INTO v_count
    FROM public.data_sources
    WHERE publisher = 'Lamborghini Trattori'
      AND source_url =
        'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8'
      AND source_type = 'official_technical_pdf';

    IF v_count <> 1 THEN
        RAISE EXCEPTION
          'Expected exactly one registered official Spire S/V technical PDF. No changes committed.';
    END IF;
END;
$$;

-- Reconcile S as complete only after verifying its 56 pending findings above.
UPDATE public.tractor_research_queue
SET
    status = 'completed',
    last_error = NULL,
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
WHERE id = '8f407f35-5534-40b7-891f-ba0249fe25db'
  AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
  AND last_run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'
  AND status IN ('retry', 'queued', 'running', 'completed');

-- Requeue only V. Keep its old failed run in ai_research_runs as an audit record.
-- v21.40 adds the exact official PDF printed-page-7 identity cross-reference.
UPDATE public.tractor_research_queue
SET
    status = 'queued',
    last_run_id = NULL,
    next_attempt_at = now(),
    last_error = 'v21.40 retry: exact official Lamborghini PDF printed page 7 identifies SPIRE V 80 TARGET. Use only the V table on page 7; do not use F or S values.',
    completed_at = NULL,
    updated_at = now()
WHERE id = 'b914d47a-258c-45e3-85d3-2d8cb5b41e49'
  AND tractor_id = '5139abf5-726b-4cc0-961a-e9f0277e0ead'
  AND last_run_id = '0e8fcf04-bb06-46da-8e68-d4604a8db819'
  AND status IN ('retry', 'needs_source', 'queued');

COMMIT;

-- Final verification: no research findings are changed by this migration.
SELECT
    b.name AS brand,
    t.id AS tractor_id,
    t.model_name,
    q.id AS queue_id,
    q.status AS queue_status,
    q.last_run_id,
    q.attempt_count,
    q.next_attempt_at,
    q.last_error
FROM public.tractor_research_queue q
JOIN public.tractors t ON t.id = q.tractor_id
JOIN public.brands b ON b.id = t.brand_id
WHERE q.id IN (
    '8f407f35-5534-40b7-891f-ba0249fe25db',
    'b914d47a-258c-45e3-85d3-2d8cb5b41e49'
)
ORDER BY t.model_name;
