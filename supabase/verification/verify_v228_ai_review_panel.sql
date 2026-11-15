-- Read-only verification for TractorCompare AI v22.8 review panel migration.
SELECT
  to_regclass('public.ai_research_findings') IS NOT NULL AS findings_table_exists,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_research_findings'
      AND column_name = 'quality_meta'
      AND data_type = 'jsonb'
  ) AS quality_meta_column_exists,
  to_regclass('public.ai_review_events') IS NOT NULL AS review_events_table_exists,
  COALESCE((
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.ai_review_events'::regclass
  ), false) AS review_events_rls_enabled;

SELECT review_status, count(*) AS finding_count
FROM public.ai_research_findings
GROUP BY review_status
ORDER BY review_status;

SELECT
  action,
  actor_type,
  count(*) AS event_count
FROM public.ai_review_events
GROUP BY action, actor_type
ORDER BY actor_type, action;
