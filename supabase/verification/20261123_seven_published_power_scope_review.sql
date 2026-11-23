-- TractorVS: seven published tractors flagged by the deterministic 100-model
-- evidence pilot. Run in a privileged maintenance session only.
-- Read-only; no changes to facts, status, RLS or the public catalogue.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout='30s';

WITH chosen AS (
 SELECT id,brand_id,model_name,variant,market,model_year,horsepower
 FROM public.tractors WHERE status='published'
 ORDER BY md5(id::text || 'tractorvs-quality-pilot-20261123') LIMIT 100
), no_explicit_power AS (
 SELECT c.* FROM chosen c
 WHERE c.horsepower IS NULL
 AND NOT EXISTS (
   SELECT 1 FROM public.tractor_specs s WHERE s.tractor_id=c.id
   AND (s.canonical_key ~* '(engine.*power|rated.*power|horsepower|power.*engine)'
    OR s.spec_name ~* '(engine power|motor gücü)')
 )
)
SELECT b.name AS brand,n.model_name,n.variant,n.market,n.model_year,
 count(s.id)::int AS specs,
 count(s.id) FILTER (WHERE s.canonical_key IS NOT NULL)::int canonical_specs,
 count(s.id) FILTER (WHERE s.evidence_text IS NOT NULL)::int specs_with_excerpt,
 string_agg(DISTINCT d.source_url,' | ' ORDER BY d.source_url)
 FILTER (WHERE d.source_url IS NOT NULL) AS existing_source_links
FROM no_explicit_power n JOIN public.brands b ON b.id=n.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=n.id
LEFT JOIN public.data_sources d ON d.id=s.source_id
GROUP BY b.name,n.model_name,n.variant,n.market,n.model_year
ORDER BY b.name,n.model_name;

ROLLBACK;
