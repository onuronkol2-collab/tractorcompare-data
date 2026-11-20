-- TractorVS: bulk, read-only source family release triage (20 Nov 2026).
-- This report NEVER marks any evidence verified and NEVER publishes any model.
-- Run using a privileged trusted maintenance session; do NOT expose draft outputs
-- to anonymous site visitors, a public GitHub issue or a public Actions artifact.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

WITH per_model AS (
 SELECT t.id,t.status,t.model_name,t.variant,t.market,t.model_year,b.name AS brand,
 count(s.id)::int AS specs,
 count(s.id) FILTER(WHERE s.source_id IS NOT NULL)::int AS sourced,
 count(s.id) FILTER(WHERE NULLIF(BTRIM(COALESCE(s.evidence_text,'')),'') IS NOT NULL)::int AS excerpts,
 count(s.id) FILTER(WHERE s.verified_at IS NOT NULL)::int AS dated,
 count(s.id) FILTER(WHERE s.verified_at IS NOT NULL
   AND s.source_id IS NOT NULL
   AND NULLIF(BTRIM(COALESCE(s.evidence_text,'')),'') IS NOT NULL)::int AS full_evidence,
 count(DISTINCT s.canonical_key)::int AS keys,
 count(DISTINCT d.source_url) FILTER (WHERE d.source_url LIKE 'https://%')::int AS url_count,
 count(s.id) FILTER(WHERE d.source_type IN(
  'manufacturer_specification','manufacturer','official_technical_specification',
  'official_technical_pdf','official_product_page','official_product_specification'
 ))::int AS manufacturer_claimed,
 count(s.id) FILTER(WHERE d.source_url LIKE 'https://%'
  AND s.evidence_text ILIKE '%'||t.model_name||'%')::int AS explicit_model_mentions
 FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
 LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
 LEFT JOIN public.data_sources d ON d.id=s.source_id
 WHERE t.status='draft'
 GROUP BY t.id,b.name
)
SELECT
 CASE
  WHEN specs=0 THEN 'EMPTY_OR_SERIES_REVIEW'
  WHEN specs<10 THEN 'RESEARCH_MISSING_CORE_DATA'
  WHEN full_evidence=specs AND specs>=10 THEN 'SOURCED_ALL_FIELDS_REVIEW_VARIANT'
  WHEN manufacturer_claimed>=10 AND excerpts>=10 THEN 'OFFICIAL_DOCUMENT_FAMILY_RECHECK'
  WHEN dated>=5 AND url_count>=1 THEN 'PARTIALLY_VERIFIED_MODEL_REVIEW'
  ELSE 'SOURCE_AND_IDENTITY_REVIEW'
 END AS review_lane,
 COUNT(*) AS draft_models,
 SUM(specs) AS spec_rows,
 SUM(full_evidence) AS full_evidence_rows
FROM per_model GROUP BY 1 ORDER BY draft_models DESC;

-- Identify the documents that can verify many tractor models in a SINGLE
-- official PDF review. A document URL is not proof of correct model identity.
SELECT d.publisher,d.source_type,d.source_url,
 COUNT(DISTINCT t.id) AS draft_models,
 COUNT(s.id) AS draft_spec_rows,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL) AS dated_rows,
 COUNT(s.id) FILTER(WHERE s.evidence_text IS NOT NULL
  AND BTRIM(s.evidence_text)<>'') AS excerpt_rows,
 COUNT(s.id) FILTER(WHERE s.evidence_text ILIKE '%'||t.model_name||'%') AS model_named_rows
FROM public.tractors t JOIN public.tractor_specs s ON s.tractor_id=t.id
JOIN public.data_sources d ON d.id=s.source_id
WHERE t.status='draft'
AND d.source_type IN (
 'manufacturer_specification','manufacturer',
 'official_technical_specification','official_technical_pdf',
 'official_product_page','official_product_specification'
)
GROUP BY d.publisher,d.source_type,d.source_url
HAVING count(DISTINCT t.id)>=3
ORDER BY COUNT(s.id) DESC,COUNT(DISTINCT t.id) DESC
LIMIT 45;

-- Detect duplicate model identity and ambiguous family names; a slash-combined
-- row or generic "Series" row must not become a synthetic tractor specification.
SELECT b.name AS brand,t.model_name,t.variant,t.market,t.model_year,
 COUNT(*) AS overlapping_rows
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
WHERE t.status<>'archived'
GROUP BY b.name,t.model_name,t.variant,t.market,t.model_year
HAVING COUNT(*)>1
ORDER BY overlapping_rows DESC LIMIT 50;

SELECT b.name AS brand,t.model_name,t.variant,t.market,
 COUNT(s.id) AS spec_rows,
 CASE
  WHEN t.model_name ~* '(^|[[:space:]])series($|[[:space:]])'
    OR t.model_name ~ '[[:digit:]]/[[:digit:]]'
    OR t.model_name ~* '^(series|serie|x[1-9]|frutteto)$'
    THEN 'IDENTITY_OR_FAMILY_CHECK'
  ELSE 'MODEL_CHECK'
 END AS classification
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
WHERE t.status='draft' AND
(t.model_name ~* 'series|serie|[[:digit:]]/[[:digit:]]|^x[1-9]$' OR s.id IS NULL)
GROUP BY t.id,b.name ORDER BY brand,model_name LIMIT 95;

-- Safety: draft models may not be visible in the public catalogue.
SELECT COUNT(*) AS non_published_rows_exposed
FROM public.tractorvs_public_specs v JOIN public.tractors t ON t.id=v.tractor_id
WHERE t.status<>'published';
ROLLBACK;
