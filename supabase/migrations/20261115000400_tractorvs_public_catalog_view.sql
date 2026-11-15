-- TractorVS public catalogue view
-- Only source-backed specifications belonging to published tractor models are exposed.
-- AI findings, research documents, queue data, source notes and review metadata remain private.

BEGIN;

CREATE OR REPLACE VIEW public.tractorvs_public_specs
WITH (security_barrier = true)
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
JOIN public.tractor_specs AS s ON s.tractor_id = t.id
LEFT JOIN public.data_sources AS d ON d.id = s.source_id
WHERE t.status = 'published';

COMMENT ON VIEW public.tractorvs_public_specs IS
  'Public TractorVS projection. Only published models and restricted specification/source fields; excludes draft models, AI findings, research documents, queue records, source notes and internal review metadata.';

REVOKE ALL ON TABLE public.tractorvs_public_specs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.tractorvs_public_specs TO anon, authenticated;
NOTIFY pgrst, 'reload schema';

COMMIT;
