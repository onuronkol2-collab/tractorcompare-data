-- TractorVS independent publication audit; READ ONLY.
WITH ids(id) AS (VALUES
('67d959b0-74cc-4685-950d-e0ae6d0eddb4'::uuid),
('3a46f879-666c-47cd-ae1f-53f0c7861521'::uuid),
('71e2b971-0585-4b12-920a-993c31559c43'::uuid),
('2de80a0e-4aac-4bc8-ad69-397fbf2c44cb'::uuid),
('1aa3a3d6-822b-4346-9d13-b6c0d99bdb1e'::uuid),
('37c62cc5-b235-41a6-a2f0-4a1260cf4884'::uuid),
('efd5ab99-1bc3-4dde-b0e8-581d7559e490'::uuid),
('e92e0124-064f-49f3-a189-a4cfab682fb4'::uuid)
)
SELECT b.name AS brand,t.id,t.model_name,t.variant,t.market,t.status,t.model_year,t.horsepower,
count(s.id) stored_spec_rows,count(s.id) filter(where s.verified_at is not null and
 s.source_id is not null and nullif(trim(s.evidence_text),'') is not null) evidenced,
count(distinct s.canonical_key) unique_keys
FROM ids JOIN public.tractors t ON ids.id=t.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.market,t.status,t.model_year,t.horsepower
ORDER BY brand,model_name,variant;
-- Expected 8 published, 109 evidenced, no marketing-HP or unsupported model year.

SELECT status,count(*) model_count FROM public.tractors GROUP BY status ORDER BY status;
-- Initial checkpoint: 221 published / 247 draft / 10 archived.

SELECT count(*) evidenced_public_rows,count(distinct tractor_id) published_models
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- Initial checkpoint: 5,997 / 221.

SELECT batch_id,count(*) private_original_snapshots
FROM tc_backup.tractor_publication_patches
WHERE batch_id IN('20261121_sonalika_di740iii_tigerdi50_v1',
 '20261121_tym_2500_2500l_5025_six_variants_v1')
GROUP BY batch_id ORDER BY batch_id;
-- 27 Sonalika / 47 TYM.

SELECT count(*) contradictory_2500_clearance_or_weight_leaked
FROM public.tractor_specs WHERE tractor_id IN
 ('71e2b971-0585-4b12-920a-993c31559c43',
  '2de80a0e-4aac-4bc8-ad69-397fbf2c44cb')
AND canonical_key IN('ground_clearance','weight_with_rops');
-- Expected zero; source TYM table/header conflict or mass not gearbox-specific.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_can_read_private_photos;
-- Expected security_invoker=true, security_barrier=true; anon false.
