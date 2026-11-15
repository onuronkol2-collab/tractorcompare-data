-- TractorVS public catalogue view verification. READ ONLY.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

SELECT
  to_regclass('public.tractorvs_public_specs') IS NOT NULL AS public_view_exists,
  CASE WHEN to_regclass('public.tractorvs_public_specs') IS NOT NULL
    THEN has_table_privilege('anon', 'public.tractorvs_public_specs', 'SELECT') ELSE false END AS anon_can_select_view,
  CASE WHEN to_regclass('public.tractorvs_public_specs') IS NOT NULL
    THEN has_table_privilege('authenticated', 'public.tractorvs_public_specs', 'SELECT') ELSE false END AS authenticated_can_select_view;

SELECT
  count(*) AS public_spec_rows,
  count(DISTINCT tractor_id) AS published_models,
  count(*) FILTER (WHERE source_url IS NOT NULL) AS rows_with_source_url,
  count(*) FILTER (WHERE source_url IS NULL) AS rows_without_source_url
FROM public.tractorvs_public_specs;

SELECT count(*) AS non_published_rows_exposed
FROM public.tractorvs_public_specs AS public_rows
JOIN public.tractors AS t ON t.id = public_rows.tractor_id
WHERE t.status <> 'published';

SELECT pg_get_viewdef('public.tractorvs_public_specs'::regclass, true) AS view_definition;
ROLLBACK;
