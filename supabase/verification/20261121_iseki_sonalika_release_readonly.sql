-- Read-only live audit after exact 21 Nov 2026 model-family transaction.
SELECT b.name AS brand,t.model_name,t.variant,t.market,t.model_year,t.status,
 COUNT(s.id) AS stored_specs,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL AND NULLIF(trim(s.evidence_text),'') IS NOT NULL) AS visible_verified,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NULL) AS held_for_review
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
WHERE t.id IN('1d67a7d0-00bd-4898-a510-98735b28b9b4','c2488a63-9d6c-434e-983e-ebcb87e224c9')
GROUP BY t.id,b.name,t.model_name,t.variant,t.market,t.model_year,t.status;
-- Expected: Iseki 29 stored, 28 visible, 1 held; Sonalika 38/38/0, both published.

SELECT count(DISTINCT tractor_id) models,
 count(*) FILTER(WHERE spec_id IS NOT NULL) public_verified_specs
FROM public.tractorvs_public_specs
WHERE tractor_id IN('1d67a7d0-00bd-4898-a510-98735b28b9b4','c2488a63-9d6c-434e-983e-ebcb87e224c9');
-- Expected 2 models, 66 specs.

SELECT count(*) backed_up FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_iseki_txgs24_sonalika_fp18_v1';
-- Expected 69 records.

SELECT count(*) disputed_unpublished FROM public.tractor_specs
WHERE tractor_id='1d67a7d0-00bd-4898-a510-98735b28b9b4'
  AND canonical_key='engine_rated_speed' AND verified_at IS NULL;
-- Expected 1.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_private_photo_access;
-- Expected security_invoker=true, security_barrier=true, false.
