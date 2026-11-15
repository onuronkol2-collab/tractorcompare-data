-- TractorCompare AI v22.0 candidate
-- Enforce one active research run per tractor.
--
-- IMPORTANT: this migration intentionally fails closed if duplicate active runs
-- remain. Do not delete research history. First inspect each matching Gemini
-- interaction and safely move only the confirmed non-canonical run to a terminal
-- status with an audit reason. Then rerun this migration.
--
-- Active statuses are queued/running. Completed/failed history is unaffected.

DO $$
DECLARE
  duplicate_report text;
BEGIN
  SELECT string_agg(
           format('tractor_id=%s active_runs=%s run_ids=%s',
             d.tractor_id, d.active_count, d.run_ids),
           E'\n'
         )
    INTO duplicate_report
  FROM (
    SELECT
      tractor_id,
      count(*) AS active_count,
      string_agg(id::text, ', ' ORDER BY created_at, id) AS run_ids
    FROM public.ai_research_runs
    WHERE tractor_id IS NOT NULL
      AND status IN ('queued', 'running')
    GROUP BY tractor_id
    HAVING count(*) > 1
  ) AS d;

  IF duplicate_report IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'Cannot create one-active-run-per-tractor index: duplicate active runs remain.',
      DETAIL = duplicate_report,
      HINT = 'Inspect the associated Gemini interactions. Preserve all rows and evidence; safely resolve duplicates before rerunning this migration.';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ai_research_runs_one_active_per_tractor_uidx
  ON public.ai_research_runs (tractor_id)
  WHERE tractor_id IS NOT NULL
    AND status IN ('queued', 'running');
