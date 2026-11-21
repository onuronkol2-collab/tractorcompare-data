-- READ ONLY Antonio Carraro MACH4 R / TRX 5800 manufacturer source QA.
WITH selected(id) AS (VALUES
('f267b552-5cdb-4936-9857-b4d88f0618cb'::uuid),
('cf9f7eff-7d64-4c5a-83d3-281e37679252'::uuid))
SELECT b.name brand,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain,
COUNT(s.id) stored,
COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL
  AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) source_verified,
COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NULL) unsupported_marked_verified,
COUNT(DISTINCT s.canonical_key) distinct_keys
FROM selected q JOIN public.tractors t ON q.id=t.id JOIN public.brands b ON t.brand_id=b.id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain
ORDER BY t.model_name;
-- Expect 2 published with 16/16 evidence-backed; 0 unsupported flags, 22 each stored, NULL headline rated hp/year/drivetrain.

SELECT t.model_name,s.canonical_key,s.spec_name,s.spec_value,s.unit,s.measurement_standard
FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id
WHERE t.id IN('f267b552-5cdb-4936-9857-b4d88f0618cb','cf9f7eff-7d64-4c5a-83d3-281e37679252')
AND s.canonical_key IN('manufacturer_engine_power_unspecified_standard','engine_rated_power_kw',
'operating_weight_cab_kg','operating_weight_rops_kg','operating_weight_cab_min_kg',
'operating_weight_cab_max_kg','operating_weight_rops_min_kg','operating_weight_rops_max_kg')
ORDER BY t.model_name,s.canonical_key;
-- Primary hp marked manufacturer-stated no ISO, redundant kW stays unverified.

SELECT COUNT(*) original_snapshots FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_antonio_mach4_trx5800_official_v1';
-- 46 (two original tractor +44 original specs).
SELECT COUNT(DISTINCT tractor_id) public_models,COUNT(*) verified_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- This checkpoint: 249/6321.
SELECT status,COUNT(*) FROM public.tractors GROUP BY status ORDER BY status;
-- This checkpoint: 249 published, 219 draft, 10 archived.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_can_read_private_photo_queue;
-- Expected invoker/barrier true and anon false.
