-- TractorVS public catalogue view verification. READ ONLY.
-- Run after the migration. Results should show an invoker-security view,
-- a restricted source policy, and zero non-published models exposed.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

SELECT
  to_regclass('public.tractorvs_public_specs') IS NOT NULL AS public_view_exists,
  CASE WHEN to_regclass('public.tractorvs_public_specs') IS NOT NULL
    THEN has_table_privilege('anon', 'public.tractorvs_public_specs', 'SELECT')
    ELSE false END AS anon_can_select_view,
  CASE WHEN to_regclass('public.tractorvs_public_specs') IS NOT NULL
    THEN has_table_privilege('authenticated', 'public.tractorvs_public_specs', 'SELECT')
    ELSE false END AS authenticated_can_select_view,
  CASE WHEN to_regclass('public.tractorvs_public_specs') IS NOT NULL
    THEN (
      SELECT COALESCE(reloptions @> ARRAY['security_invoker=true'], false)
      FROM pg_catalog.pg_class
      WHERE oid = 'public.tractorvs_public_specs'::regclass
    )
    ELSE false END AS view_uses_invoker_security,
  CASE WHEN to_regclass('public.tractorvs_public_specs') IS NOT NULL
    THEN (
      SELECT COALESCE(reloptions @> ARRAY['security_barrier=true'], false)
      FROM pg_catalog.pg_class
      WHERE oid = 'public.tractorvs_public_specs'::regclass
    )
    ELSE false END AS view_uses_security_barrier;

SELECT
  has_column_privilege('anon', 'public.data_sources', 'id', 'SELECT') AS anon_can_read_source_id,
  has_column_privilege('anon', 'public.data_sources', 'publisher', 'SELECT') AS anon_can_read_publisher,
  has_column_privilege('anon', 'public.data_sources', 'source_url', 'SELECT') AS anon_can_read_source_url,
  has_column_privilege('anon', 'public.data_sources', 'source_type', 'SELECT') AS anon_can_read_source_type,
  has_column_privilege('anon', 'public.data_sources', 'accessed_at', 'SELECT') AS anon_can_read_accessed_at,
  has_table_privilege('anon', 'public.data_sources', 'SELECT') AS anon_has_full_table_select;

SELECT
  policyname,
  roles,
  cmd,
  qual
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename = 'data_sources'
ORDER BY policyname;

SELECT
  count(*) AS public_spec_rows,
  count(DISTINCT tractor_id) AS published_models,
  count(*) FILTER (WHERE spec_id IS NOT NULL) AS rows_with_specification,
  count(*) FILTER (WHERE source_url IS NOT NULL) AS rows_with_source_url,
  count(*) FILTER (WHERE source_url IS NULL AND spec_id IS NOT NULL) AS rows_without_source_url
FROM public.tractorvs_public_specs;

SELECT count(*) AS non_published_rows_exposed
FROM public.tractorvs_public_specs AS public_rows
JOIN public.tractors AS t ON t.id = public_rows.tractor_id
WHERE t.status <> 'published';

SELECT pg_catalog.pg_get_viewdef('public.tractorvs_public_specs'::regclass, true) AS view_definition;

ROLLBACK;
