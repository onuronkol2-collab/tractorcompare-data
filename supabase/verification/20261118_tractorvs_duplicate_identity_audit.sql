-- TractorVS / 2026-11-18: READ-ONLY preflight for duplicate identities.
-- This does NOT merge/delete/update records. Same model across markets/variants/years is allowed.
SELECT b.name AS brand, lower(btrim(t.model_name)) AS normalized_model,
       lower(btrim(coalesce(t.variant,''))) AS normalized_variant,
       lower(btrim(coalesce(t.market,''))) AS normalized_market,
       t.model_year, count(*) AS copies,
       array_agg(t.id::text ORDER BY t.id::text) AS tractor_ids
FROM public.tractors t
JOIN public.brands b ON b.id = t.brand_id
GROUP BY b.name, t.brand_id, lower(btrim(t.model_name)),
         lower(btrim(coalesce(t.variant,''))), lower(btrim(coalesce(t.market,''))), t.model_year
HAVING count(*) > 1
ORDER BY copies DESC, brand, normalized_model;
