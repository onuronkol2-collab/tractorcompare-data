-- TractorVS | repeatable, public-record-only 100-model QA pilot, 23 Nov 2026.
-- Controlled owner maintenance session only. Do not commit raw database exports.
-- Non-mutating by design; does not publish records or change RLS.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

-- A. Deterministic sample from exactly 100 published models.
-- The UUID salt is fixed to make re-runs comparable. It is not a statistically
-- representative sample of all markets/brands and is not independent field QA.
WITH chosen AS (
 SELECT id, model_name, variant, brand_id, horsepower, market, model_year
 FROM public.tractors WHERE status='published'
 ORDER BY md5(id::text || 'tractorvs-quality-pilot-20261123')
 LIMIT 100
), per AS (
 SELECT c.id, c.horsepower, c.market,
  count(s.id)::int spec_count,
  count(s.id) FILTER (WHERE s.source_id IS NULL AND s.source_document_id IS NULL)::int missing_source_link,
  count(s.id) FILTER (WHERE s.canonical_key IS NULL OR btrim(s.canonical_key)='')::int missing_canonical,
  count(s.id) FILTER (WHERE s.evidence_text IS NULL OR btrim(s.evidence_text)='')::int missing_evidence,
  count(s.id) FILTER (WHERE s.verified_at IS NULL)::int missing_date,
  count(s.id) FILTER (WHERE s.spec_value IS NULL OR btrim(s.spec_value)='')::int blank_value
 FROM chosen c LEFT JOIN public.tractor_specs s ON s.tractor_id=c.id
 GROUP BY c.id,c.horsepower,c.market
)
SELECT count(*)::int models, sum(spec_count)::int specs,
 count(*) FILTER (WHERE spec_count=0)::int without_specs,
 count(*) FILTER (WHERE horsepower IS NULL)::int missing_top_level_power,
 count(*) FILTER (WHERE market IS NULL OR btrim(market)='')::int missing_market,
 sum(missing_source_link)::int without_source_pointer,
 sum(missing_canonical)::int without_canonical_key,
 sum(missing_evidence)::int without_evidence_text,
 sum(missing_date)::int without_verified_at,
 sum(blank_value)::int blank_values,
 min(spec_count)::int min_specs, max(spec_count)::int max_specs
FROM per;

-- B. Upper-level power is not equivalent to source-backed power being absent.
WITH chosen AS (
 SELECT id,horsepower FROM public.tractors WHERE status='published'
 ORDER BY md5(id::text || 'tractorvs-quality-pilot-20261123') LIMIT 100
)
SELECT count(*) FILTER (WHERE horsepower IS NULL)::int top_power_null,
 count(*) FILTER (WHERE horsepower IS NULL AND EXISTS (
  SELECT 1 FROM public.tractor_specs s WHERE s.tractor_id=chosen.id
   AND (s.canonical_key ~* '(engine.*power|rated.*power|horsepower|power.*engine)'
        OR s.spec_name ~* '(engine power|motor gücü)')
 ))::int top_power_null_but_candidate_spec_present
FROM chosen;

-- C. Unit-case duplicates versus genuinely different values/units.
-- Different records may be legitimate variants/test conditions: never auto-delete.
WITH chosen AS (
 SELECT id FROM public.tractors WHERE status='published'
 ORDER BY md5(id::text || 'tractorvs-quality-pilot-20261123') LIMIT 100
), groups AS (
 SELECT s.tractor_id,s.canonical_key,
 count(*) AS records,
 count(DISTINCT (btrim(s.spec_value)||'|'||coalesce(btrim(s.unit),''))) raw_forms,
 count(DISTINCT (btrim(s.spec_value)||'|'||lower(coalesce(btrim(s.unit),'')))) normalized_forms
 FROM chosen c JOIN public.tractor_specs s ON s.tractor_id=c.id
 WHERE nullif(btrim(coalesce(s.canonical_key,'')),'') IS NOT NULL
 GROUP BY s.tractor_id,s.canonical_key HAVING count(*)>1
)
SELECT count(*)::int repeated_key_groups,
 count(*) FILTER (WHERE raw_forms>1)::int apparent_difference_groups,
 count(*) FILTER (WHERE raw_forms>1 AND normalized_forms=1)::int only_unit_case_differences,
 count(*) FILTER (WHERE normalized_forms>1)::int differences_remaining_after_casefold
FROM groups;

-- D. Aggregate provenance of AI finding statuses, without exposing drafts or
-- sensitive document content in a public report. Historical nulls are NOT
-- proof of unsafe publication, especially if the proof fields were added later.
SELECT f.review_status,count(*)::int findings,
 count(*) FILTER (WHERE f.inserted_spec_id IS NOT NULL)::int linked_specs,
 count(*) FILTER (WHERE f.reviewed_at IS NULL)::int without_reviewed_at
FROM public.ai_research_findings f
GROUP BY f.review_status ORDER BY f.review_status;

-- E. Historical approved findings versus later identity-proof schema.
SELECT count(*) FILTER (WHERE f.review_status='approved')::int approved_total,
 count(*) FILTER (WHERE f.review_status='approved' AND d.identity_evidence_verified IS NOT TRUE)::int approved_without_document_identity_flag,
 count(*) FILTER (WHERE f.review_status='approved' AND f.reviewed_at IS NULL)::int approved_without_reviewed_at,
 count(*) FILTER (WHERE f.review_status='pending' AND f.inserted_spec_id IS NOT NULL)::int pending_with_inserted_spec
FROM public.ai_research_findings f
LEFT JOIN public.ai_research_documents d ON d.id=f.document_id;

ROLLBACK;
