-- Private, read-only research triage. Does NOT auto-publish or alter tractors.
-- Data stays under tc_backup; anon/authenticated have NO schema access.
CREATE OR REPLACE VIEW tc_backup.tc_publication_readiness_v1
WITH (security_invoker=true) AS
WITH row_quality AS (
 SELECT t.id AS tractor_id,t.brand_id,t.model_name,t.status,t.variant,t.market,t.model_year,
  COUNT(s.id)::integer AS spec_rows,
  COUNT(s.id) FILTER (WHERE s.verified_at IS NOT NULL
    AND NULLIF(BTRIM(s.evidence_text),'') IS NOT NULL
    AND ds.source_url ~ '^https://')::integer AS evidenced_rows,
  COUNT(DISTINCT s.canonical_key) FILTER (WHERE s.verified_at IS NOT NULL
    AND NULLIF(BTRIM(s.evidence_text),'') IS NOT NULL
    AND ds.source_url ~ '^https://')::integer AS evidenced_concepts,
  COUNT(DISTINCT ds.source_url) FILTER (WHERE ds.source_url ~ '^https://'
    AND (ds.source_type ILIKE '%manufacturer%' OR ds.source_type ILIKE '%official%'))::integer
    AS manufacturer_documents,
  COUNT(s.id) FILTER (WHERE s.id IS NOT NULL
    AND (s.verified_at IS NULL OR NULLIF(BTRIM(s.evidence_text),'') IS NULL OR ds.source_url IS NULL))::integer
    AS unchecked_rows
 FROM public.tractors t
 LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
 LEFT JOIN public.data_sources ds ON ds.id=s.source_id
 WHERE t.status='draft'
 GROUP BY t.id,t.brand_id,t.model_name,t.status,t.variant,t.market,t.model_year
),
conflicts AS (
 SELECT tractor_id,COUNT(*)::integer AS conflicting_keys
 FROM (
  SELECT s.tractor_id,COALESCE(NULLIF(s.canonical_key,''),s.spec_name) as key,
   LOWER(COALESCE(NULLIF(BTRIM(s.unit),''),'')) as unit
  FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id
  WHERE t.status='draft' AND s.spec_value IS NOT NULL
  GROUP BY s.tractor_id,COALESCE(NULLIF(s.canonical_key,''),s.spec_name),
   LOWER(COALESCE(NULLIF(BTRIM(s.unit),''),''))
  HAVING COUNT(DISTINCT lower(BTRIM(s.spec_value)))>1
 ) bad GROUP BY tractor_id
)
SELECT q.tractor_id,b.name AS brand,q.model_name,q.status,q.model_year,q.variant,q.market,
 q.spec_rows,q.evidenced_rows,q.evidenced_concepts,q.manufacturer_documents,
 q.unchecked_rows,COALESCE(c.conflicting_keys,0) AS potentially_conflicting_fields,
 (q.model_year IS NULL) AS year_unknown,
 (q.variant IS NULL OR q.variant ILIKE '%review%' OR q.variant ILIKE '%catalog listing%') AS variant_unresolved,
 (q.market IS NULL OR q.market='global') AS market_unresolved,
 CASE
  WHEN q.evidenced_rows=0 THEN 'NO_VERIFIED_EVIDENCE'
  WHEN COALESCE(c.conflicting_keys,0)>0 THEN 'CONFLICT_REVIEW'
  WHEN q.manufacturer_documents=0 THEN 'OFFICIAL_DOCUMENT_NEEDED'
  WHEN q.evidenced_rows<8 THEN 'INSUFFICIENT_EVIDENCE'
  WHEN q.market IS NULL OR q.market='global' OR q.variant IS NULL
    OR q.variant ILIKE '%review%' OR q.variant ILIKE '%catalog listing%'
   THEN 'EXACT_VARIANT_MARKET_NEEDED'
  ELSE 'HUMAN_RELEASE_REVIEW'
 END AS readiness,
 -- Sorting indicator only; cannot authorize publication.
 (q.evidenced_rows*3+q.manufacturer_documents*2-q.unchecked_rows-
  COALESCE(c.conflicting_keys,0)*10)::integer AS priority_score
FROM row_quality q JOIN public.brands b ON b.id=q.brand_id
LEFT JOIN conflicts c ON c.tractor_id=q.tractor_id;

REVOKE ALL ON tc_backup.tc_publication_readiness_v1 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON tc_backup.tc_publication_readiness_v1 TO service_role;

DO $verify$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM tc_backup.tc_publication_readiness_v1;
 IF n<250 OR n>500 THEN RAISE EXCEPTION 'Draft readiness inventory unexpected row count: %',n; END IF;
 IF has_table_privilege('anon','tc_backup.tc_publication_readiness_v1','SELECT')
    OR has_table_privilege('authenticated','tc_backup.tc_publication_readiness_v1','SELECT')
 THEN RAISE EXCEPTION 'Draft readiness was exposed to public API'; END IF;
 IF (SELECT reloptions @> ARRAY['security_invoker=true'] FROM pg_class
    WHERE oid='tc_backup.tc_publication_readiness_v1'::regclass) IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'Readiness view RLS invoker not active'; END IF;
END $verify$;
