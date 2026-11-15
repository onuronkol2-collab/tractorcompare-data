-- TractorVS public catalogue view
-- Uses an invoker-security view and narrows public data_sources reads to
-- source rows referenced by specifications of published tractor models.
-- No model, specification, research, queue or review data is modified.

BEGIN;

DO $preflight$
BEGIN
  IF current_setting('server_version_num')::integer < 150000 THEN
    RAISE EXCEPTION 'PostgreSQL 15 or newer is required for security_invoker public catalogue views.';
  END IF;

  IF to_regclass('public.data_sources') IS NULL
     OR to_regclass('public.tractor_specs') IS NULL
     OR to_regclass('public.tractors') IS NULL
     OR to_regclass('public.brands') IS NULL THEN
    RAISE EXCEPTION 'TractorVS catalogue prerequisite table is missing; migration stopped.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_sources'
      AND policyname = 'Public read sources'
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Expected policy "Public read sources" was not found; inspect data_sources policies before continuing.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_sources'
      AND cmd IN ('SELECT', 'ALL')
      AND policyname <> 'Public read sources'
  ) THEN
    RAISE EXCEPTION 'Additional data_sources SELECT policy found. Review it before changing public source visibility.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('data_sources', 'tractor_specs', 'tractors', 'brands')
      AND c.relrowsecurity IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'Row level security must be enabled on data_sources, tractor_specs, tractors and brands before creating the public catalogue view.';
  END IF;

  IF has_table_privilege('anon', 'public.data_sources', 'SELECT')
     OR has_table_privilege('authenticated', 'public.data_sources', 'SELECT')
     OR EXISTS (
       SELECT 1
       FROM information_schema.table_privileges
       WHERE table_schema = 'public'
         AND table_name = 'data_sources'
         AND grantee = 'PUBLIC'
         AND privilege_type = 'SELECT'
     ) THEN
    RAISE EXCEPTION 'A public full-table SELECT grant exists on data_sources. Inspect and remove it before applying the restricted catalogue grant.';
  END IF;

  IF has_any_column_privilege('anon', 'public.data_sources', 'SELECT')
     OR has_any_column_privilege('authenticated', 'public.data_sources', 'SELECT')
     OR EXISTS (
       SELECT 1
       FROM information_schema.column_privileges
       WHERE table_schema = 'public'
         AND table_name = 'data_sources'
         AND grantee = 'PUBLIC'
         AND privilege_type = 'SELECT'
     ) THEN
    RAISE EXCEPTION 'Existing public column-level SELECT grants exist on data_sources. Inspect them before applying this reversible grant.';
  END IF;
END
$preflight$;

DROP POLICY "Public read sources" ON public.data_sources;

CREATE POLICY "Public read sources for published tractor specs"
ON public.data_sources
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tractor_specs AS s
    JOIN public.tractors AS t ON t.id = s.tractor_id
    WHERE s.source_id = data_sources.id
      AND t.status = 'published'
  )
);

GRANT SELECT (id, publisher, source_url, source_type, accessed_at)
ON TABLE public.data_sources
TO anon, authenticated;

CREATE OR REPLACE VIEW public.tractorvs_public_specs
WITH (security_barrier = true, security_invoker = true)
AS
SELECT
  t.id AS tractor_id,
  b.name AS brand_name,
  b.country AS brand_country,
  b.website_url AS brand_website_url,
  t.model_name,
  t.model_year,
  t.variant,
  t.market,
  t.horsepower,
  t.engine,
  t.transmission,
  t.drivetrain,
  t.weight_kg,
  s.id AS spec_id,
  s.spec_name,
  s.spec_value,
  s.unit,
  s.canonical_key,
  s.comparison_class,
  s.measurement_standard,
  s.rated_rpm,
  s.evidence_text,
  s.verified_at,
  d.publisher AS source_publisher,
  d.source_url,
  d.source_type,
  d.accessed_at AS source_accessed_at,
  s.source_priority AS spec_source_priority
FROM public.tractors AS t
JOIN public.brands AS b ON b.id = t.brand_id
LEFT JOIN public.tractor_specs AS s ON s.tractor_id = t.id
LEFT JOIN public.data_sources AS d ON d.id = s.source_id
WHERE t.status = 'published';

COMMENT ON VIEW public.tractorvs_public_specs IS
  'TractorVS public projection. Invoker security and base-table RLS apply; only published models and selected specification/source fields are visible. AI findings, research documents, queues, source notes and review metadata are excluded.';

REVOKE ALL ON TABLE public.tractorvs_public_specs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.tractorvs_public_specs TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
