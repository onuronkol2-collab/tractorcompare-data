-- TractorVS: read-only catalogue-wide coverage and integrity checkpoint.
-- Run in an authorized private SQL session; keep result private.
-- This is structural triage, NOT evidence verification or a release decision.
-- Does not modify rows, permissions, policies, schema, photos or forum.
-- Exact source identity, measurement scope, automated evidence review and
-- existing release gates are still mandatory. Do not publish draft identities.
WITH coverage AS (
 SELECT t.id, t.status, t.brand_id, count(s.id) AS specs,
 count(DISTINCT NULLIF(btrim(coalesce(s.canonical_key,s.spec_name)),'')) AS concepts,
 count(s.id) FILTER (WHERE nullif(btrim(s.evidence_text),'') IS NULL) AS missing_evidence,
 count(s.id) FILTER (WHERE ds.id IS NULL) AS missing_source,
 count(s.id) FILTER (WHERE ds.id IS NOT NULL AND (ds.source_url IS NULL OR ds.source_url !~* '^https?://')) AS non_http_source,
 count(s.id) FILTER (WHERE nullif(btrim(s.spec_value),'') IS NULL) AS empty_value
 FROM public.tractors t LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
 LEFT JOIN public.data_sources ds ON ds.id=s.source_id GROUP BY t.id,t.status,t.brand_id
), status_counts AS (
 SELECT status,count(*) AS models,sum(specs) AS specs,count(*) FILTER (WHERE specs=0) AS no_specs,
 count(*) FILTER (WHERE concepts>=8) AS at_least_eight_concepts,
 sum(missing_evidence) AS missing_evidence,sum(missing_source) AS missing_source,
 sum(non_http_source) AS non_http_source,sum(empty_value) AS empty_value FROM coverage GROUP BY status
), draft_brands AS (
 SELECT b.name AS brand,count(*) AS drafts,count(*) FILTER (WHERE c.concepts>=8) AS structural_candidates,
 count(*) FILTER (WHERE c.specs=0) AS no_specs,sum(c.missing_evidence) AS missing_evidence
 FROM coverage c JOIN public.brands b ON b.id=c.brand_id WHERE c.status='draft' GROUP BY b.name
), duplicate_identity_groups AS (
 SELECT count(*) AS groups FROM (
 SELECT brand_id,lower(btrim(model_name)),model_year,lower(btrim(coalesce(market,''))),lower(btrim(coalesce(variant,'')))
 FROM public.tractors WHERE status IN ('draft','published') GROUP BY 1,2,3,4,5 HAVING count(*)>1
 ) d
), catalog_rls AS (
 SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN ('brands','tractors','tractor_specs','data_sources')
)
SELECT jsonb_build_object('status', (SELECT jsonb_agg(to_jsonb(s) ORDER BY status) FROM status_counts s),
 'draft_brands',(SELECT jsonb_agg(to_jsonb(b) ORDER BY drafts DESC,brand) FROM draft_brands b),
 'active_duplicate_identity_groups',(SELECT groups FROM duplicate_identity_groups),
 'catalog_rls',(SELECT jsonb_agg(to_jsonb(r) ORDER BY table_name) FROM catalog_rls r)) AS audit;
