-- TractorVS 21 Nov 2026: independent read-only verification for two official source batches.
WITH new_models AS (
 SELECT unnest(ARRAY[
 '821bd689-5ce1-468e-a11a-66e07c7e9051'::uuid,
 '8d846784-9459-47e4-b557-982a6d6feabb'::uuid,
 '596c8706-723d-4c47-befd-b0fc47bc167a'::uuid,
 '793fe40e-d19b-471f-b940-0dc39a3d2838'::uuid,
 '6b8aa469-6c20-4377-9320-bd41dade4a1a'::uuid,
 '3156002b-c2a4-428d-a63d-1853d4a89812'::uuid,
 '02aa9c86-2df5-4b64-96e2-7f6a9b1df830'::uuid,
 'cff4bd2c-cb82-43dc-aabe-dc4e4a5f910e'::uuid,
 '840269b7-e7c3-4e57-80db-56a55e9fbf46'::uuid,
 '82fbcc0b-d0b2-4fa2-940b-f8404c384840'::uuid]) id
)
SELECT b.name brand,t.model_name,t.variant,t.market,t.status,t.horsepower,
 COUNT(s.id) stored_specs,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL
  AND NULLIF(trim(s.evidence_text),'') IS NOT NULL) evidence_valid,
 COUNT(DISTINCT s.canonical_key) distinct_keys
FROM new_models n JOIN public.tractors t ON t.id=n.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY t.id,b.name,t.model_name,t.variant,t.market,t.status,t.horsepower ORDER BY b.name,t.model_name,t.variant;
-- Expected all 10 published; total evidence_valid 146; RX42 stored 15 but evidence_valid 14.

SELECT COUNT(DISTINCT tractor_id) new_models,COUNT(*) FILTER(WHERE spec_id IS NOT NULL) public_verified_specs
FROM public.tractorvs_public_specs WHERE tractor_id IN(
'821bd689-5ce1-468e-a11a-66e07c7e9051','8d846784-9459-47e4-b557-982a6d6feabb',
'596c8706-723d-4c47-befd-b0fc47bc167a','793fe40e-d19b-471f-b940-0dc39a3d2838',
'6b8aa469-6c20-4377-9320-bd41dade4a1a','3156002b-c2a4-428d-a63d-1853d4a89812',
'02aa9c86-2df5-4b64-96e2-7f6a9b1df830','cff4bd2c-cb82-43dc-aabe-dc4e4a5f910e',
'840269b7-e7c3-4e57-80db-56a55e9fbf46','82fbcc0b-d0b2-4fa2-940b-f8404c384840');
-- 10 / 146.

SELECT batch_id,COUNT(*) backup_snapshots FROM tc_backup.tractor_publication_patches
WHERE batch_id IN('20261121_sonalika_official_four_models_v1','20261121_tym_four_families_six_models_v1')
GROUP BY batch_id ORDER BY batch_id;
-- 63 / 63.

SELECT count(*) ambiguous_displacement_held FROM public.tractor_specs WHERE
 tractor_id='8d846784-9459-47e4-b557-982a6d6feabb'
 AND canonical_key='engine_displacement' AND verified_at IS NULL;
-- 1

SELECT count(*) unsupported_6225CH_cab_mass FROM public.tractor_specs WHERE
 tractor_id='82fbcc0b-d0b2-4fa2-940b-f8404c384840' AND canonical_key='weight_with_cab';
-- 0

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_can_read_private_photos;
-- Expected security_invoker=true, security_barrier=true; anon false.

SELECT status,count(*) FROM public.tractors GROUP BY status ORDER BY status;
-- Checkpoint expected: 210 published / 255 draft / 7 archived.
