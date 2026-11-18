-- READ ONLY: active duplicates only. Archive rows remain preserved.
SELECT b.name AS brand, lower(btrim(t.model_name)) AS normalized_model,
       lower(btrim(coalesce(t.variant,''))) AS normalized_variant,
       lower(btrim(coalesce(t.market,''))) AS normalized_market,
       t.model_year, count(*) AS active_copies,
       array_agg(t.id::text ORDER BY t.id::text) AS tractor_ids
FROM public.tractors t
JOIN public.brands b ON b.id = t.brand_id
WHERE t.status IS DISTINCT FROM 'archived'
GROUP BY b.name, t.brand_id, lower(btrim(t.model_name)),
         lower(btrim(coalesce(t.variant,''))), lower(btrim(coalesce(t.market,''))), coalesce(t.model_year,-1)
HAVING count(*) > 1
ORDER BY active_copies DESC, brand, normalized_model;
