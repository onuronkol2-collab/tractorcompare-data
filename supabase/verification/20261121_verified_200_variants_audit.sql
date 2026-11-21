-- READ-ONLY; actual live release quality check. Do not publish draft inventory via CI.
WITH target AS (
 SELECT t.id,b.name AS brand,t.model_name,t.variant,t.market,t.status,t.horsepower,
 COUNT(s.id) AS stored_specs,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL
  AND NULLIF(btrim(s.evidence_text),'') IS NOT NULL) AS verified_evidenced,
 COUNT(DISTINCT s.canonical_key) distinct_keys
 FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
 LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
 WHERE t.id IN(
 '2d79ca05-3378-47dc-9d68-a368434d0dbe',
 'a0e16b7d-3b48-41c8-b4d9-5945b542b3c2',
 'dd65e38b-8268-48f4-a9ac-1308e2decb86',
 '5d1360a7-1494-44b9-9728-93de291ab082',
 '458be7b8-f6b8-4319-b264-dc6c7cc36ae7'
 )
 GROUP BY t.id,b.name,t.model_name,t.variant,t.market,t.status,t.horsepower
) SELECT * FROM target ORDER BY brand,model_name,variant;
-- Expected five published, each 15/15, unique canonical keys, headline horsepower NULL.

SELECT COUNT(DISTINCT tractor_id) models,
 COUNT(*) FILTER(WHERE spec_id IS NOT NULL) public_visible_verified_specs
FROM public.tractorvs_public_specs WHERE tractor_id IN(
'2d79ca05-3378-47dc-9d68-a368434d0dbe',
'a0e16b7d-3b48-41c8-b4d9-5945b542b3c2',
'dd65e38b-8268-48f4-a9ac-1308e2decb86',
'5d1360a7-1494-44b9-9728-93de291ab082',
'458be7b8-f6b8-4319-b264-dc6c7cc36ae7'
);
-- Expected 5 / 75. Public table must remain security_invoker/security_barrier.

SELECT batch_id,COUNT(*) saved
FROM tc_backup.tractor_publication_patches WHERE batch_id IN(
'20261121_sonalika_di42p_india_v1',
'20261121_sonalika_mahabali_rx42_verified_2wd_4wd_v1',
'20261121_tym_t3048_f50c_variants_v1')
GROUP BY batch_id ORDER BY batch_id;
-- Expected 16 / 18 / 16.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_can_read_private_photo_candidates;
-- Expected security_invoker=true + security_barrier=true, anon false.

SELECT t.status,COUNT(*) FROM public.tractors t GROUP BY t.status ORDER BY t.status;
-- At this checkpoint expected published 200 / draft 263 / archived 5.
