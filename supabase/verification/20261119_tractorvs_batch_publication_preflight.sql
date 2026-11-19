-- TractorVS staged launch: one-pass READ-ONLY report of current drafts.
-- Intentionally makes NO change to tractors, specs, sources, status, grants or RLS.
-- Counts identify research priorities, NOT production-ready or manufacturer approval.
-- Execute only against the owner's private Supabase SQL Editor / connected database.
-- Do NOT upload results containing unpublished model identities to public GitHub.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout='45s';

-- A: exact current inventory per status, not a historical archive estimate.
SELECT status, count(*) AS tractors
FROM public.tractors
GROUP BY status ORDER BY status;

-- B: check active brand/model/year/market/variant identity collisions.
SELECT b.name AS brand, t.brand_id,
       lower(btrim(t.model_name)) AS model_identity,
       lower(btrim(coalesce(t.variant,''))) AS variant_identity,
       lower(btrim(coalesce(t.market,''))) AS market_identity,
       t.model_year,
       count(*) AS active_copies,
       array_agg(t.id::text ORDER BY t.id::text) AS conflicting_ids
FROM public.tractors t
JOIN public.brands b ON b.id=t.brand_id
WHERE t.status IS DISTINCT FROM 'archived'
GROUP BY b.name,t.brand_id,lower(btrim(t.model_name)),
         lower(btrim(coalesce(t.variant,''))),
         lower(btrim(coalesce(t.market,''))),t.model_year
HAVING count(*)>1
ORDER BY active_copies DESC,b.name,model_identity;

-- C: summarize documentary evidence, without inventing verified facts.
WITH evidence AS (
  SELECT s.tractor_id,
    count(*) AS spec_rows,
    count(*) FILTER (WHERE
      nullif(btrim(s.spec_value),'') IS NOT NULL
      AND s.verified_at IS NOT NULL
      AND nullif(btrim(s.evidence_text),'') IS NOT NULL
      AND d.source_url ~* '^https://[^[:space:]]+$'
    ) AS source_excerpt_rows,
    count(*) FILTER (WHERE
      nullif(btrim(s.spec_value),'') IS NOT NULL
      AND s.verified_at IS NOT NULL
      AND nullif(btrim(s.evidence_text),'') IS NOT NULL
      AND d.source_url ~* '^https://[^[:space:]]+$'
      AND d.source_type IN (
        'manufacturer','manufacturer_specification',
        'official_product_page','official_technical_specification')
    ) AS manufacturer_typed_rows,
    count(DISTINCT d.source_url) FILTER (WHERE
      s.verified_at IS NOT NULL AND nullif(btrim(s.evidence_text),'') IS NOT NULL
      AND d.source_url ~* '^https://[^[:space:]]+$'
    ) AS linked_source_urls,
    count(DISTINCT nullif(btrim(s.canonical_key),'')) AS distinct_canonical_keys,
    count(*) FILTER (WHERE
      s.source_id IS NULL OR d.id IS NULL OR
      nullif(btrim(coalesce(s.evidence_text,'')),'') IS NULL OR
      s.verified_at IS NULL
    ) AS incomplete_evidence_rows
  FROM public.tractor_specs s
  LEFT JOIN public.data_sources d ON d.id=s.source_id
  GROUP BY s.tractor_id
),
conflicts AS (
  SELECT tractor_id,count(*) AS conflicting_measurement_groups
  FROM (
    SELECT s.tractor_id,
      lower(btrim(coalesce(nullif(s.canonical_key,''),s.spec_name))) AS key,
      lower(btrim(coalesce(s.unit,''))) AS unit,
      lower(btrim(coalesce(s.measurement_standard,''))) AS standard,
      s.rated_rpm,
      count(DISTINCT btrim(s.spec_value)) AS distinct_values
    FROM public.tractor_specs s
    WHERE nullif(btrim(coalesce(s.spec_value,'')),'') IS NOT NULL
    GROUP BY s.tractor_id,
      lower(btrim(coalesce(nullif(s.canonical_key,''),s.spec_name))),
      lower(btrim(coalesce(s.unit,''))),
      lower(btrim(coalesce(s.measurement_standard,''))),
      s.rated_rpm
    HAVING count(DISTINCT btrim(s.spec_value))>1
  ) different_readings
  GROUP BY tractor_id
),
duplicates AS (
  SELECT t.brand_id,
    lower(btrim(t.model_name)) AS model_identity,
    lower(btrim(coalesce(t.variant,''))) AS variant_identity,
    lower(btrim(coalesce(t.market,''))) AS market_identity,
    t.model_year, count(*) AS copies
  FROM public.tractors t
  WHERE t.status IS DISTINCT FROM 'archived'
  GROUP BY t.brand_id,lower(btrim(t.model_name)),
    lower(btrim(coalesce(t.variant,''))),
    lower(btrim(coalesce(t.market,''))),t.model_year
)
SELECT t.id AS tractor_id,b.name AS brand,t.model_name,t.variant,t.market,
       t.model_year,t.status,
       coalesce(e.spec_rows,0) AS technical_rows,
       coalesce(e.source_excerpt_rows,0) AS evidence_with_link_excerpt_date,
       coalesce(e.manufacturer_typed_rows,0) AS manufacturer_type_evidence_rows,
       coalesce(e.linked_source_urls,0) AS distinct_document_urls,
       coalesce(e.distinct_canonical_keys,0) AS canonical_measurement_keys,
       coalesce(e.incomplete_evidence_rows,0) AS incomplete_evidence_rows,
       coalesce(c.conflicting_measurement_groups,0) AS conflicting_measurement_groups,
       d.copies AS active_identity_copies,
       CASE
         WHEN d.copies>1 THEN 'HOLD_DUPLICATE_IDENTITY'
         WHEN t.model_name IS NULL OR nullif(btrim(t.model_name),'') IS NULL
           OR t.market IS NULL OR nullif(btrim(t.market),'') IS NULL
           THEN 'HOLD_IDENTITY_CONTEXT'
         WHEN coalesce(c.conflicting_measurement_groups,0)>0
           THEN 'HOLD_CONFLICTING_MEASUREMENTS'
         WHEN coalesce(e.manufacturer_typed_rows,0)=0
           THEN 'HOLD_NO_DOCUMENTED_MANUFACTURER_TYPE'
         WHEN coalesce(e.source_excerpt_rows,0)<5
           THEN 'HOLD_INSUFFICIENT_EVIDENCE_ROWS'
         ELSE 'REVIEW_EXACT_VARIANT_AND_SOURCE_BEFORE_PUBLISH'
       END AS review_priority,
       'NO_AUTOMATIC_PUBLICATION' AS release_gate
FROM public.tractors t
JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN evidence e ON e.tractor_id=t.id
LEFT JOIN conflicts c ON c.tractor_id=t.id
LEFT JOIN duplicates d ON d.brand_id=t.brand_id
 AND d.model_identity=lower(btrim(t.model_name))
 AND d.variant_identity=lower(btrim(coalesce(t.variant,'')))
 AND d.market_identity=lower(btrim(coalesce(t.market,'')))
 AND d.model_year IS NOT DISTINCT FROM t.model_year
WHERE t.status='draft'
ORDER BY CASE WHEN d.copies>1 THEN 0 ELSE 1 END,
         coalesce(c.conflicting_measurement_groups,0) DESC,
         coalesce(e.manufacturer_typed_rows,0) DESC,
         b.name,t.model_name,t.variant,t.market,t.id;

-- D: the public catalogue must not reveal draft/archived rows.
-- In an authorized SQL editor this confirms the public view's source data:
SELECT count(*) AS non_published_records_exposed
FROM public.tractorvs_public_specs p
JOIN public.tractors t ON t.id=p.tractor_id
WHERE t.status IS DISTINCT FROM 'published';

-- E: base-table RLS settings. The full independent catalog/RLS audit is in
-- supabase/verification/verify_tractorvs_public_catalog_view.sql.
SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('brands','tractors','tractor_specs','data_sources')
ORDER BY c.relname;

ROLLBACK;
