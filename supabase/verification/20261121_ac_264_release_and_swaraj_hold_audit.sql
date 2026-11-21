-- READ-ONLY production release audit and conflict hold. No schema writes / DML.
WITH ids(id) AS (VALUES
('44929c2c-c1db-48e8-a8a5-fdfef3bb467f'::uuid),
('b678b91d-976c-489a-9d75-ce85865f91ad'::uuid),
('7fa6422c-6cfc-401e-8677-6933fbe8ea62'::uuid))
SELECT b.name brand,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain,
count(s.id) stored,
count(s.id) FILTER(WHERE s.source_id IS NOT NULL AND s.verified_at IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) source_evidenced,
count(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NULL) proofless_verified
FROM ids JOIN public.tractors t ON t.id=ids.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain
ORDER BY t.model_name;
-- Expected TGF 16 /TRX 16 /TONY TRG 15 source-backed, zero legacy proofless flags, 3 published.

SELECT t.model_name,s.canonical_key,s.spec_value,s.unit,s.verified_at,s.measurement_standard,d.source_url
FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id
JOIN public.data_sources d ON d.id=s.source_id
WHERE s.tractor_id IN('44929c2c-c1db-48e8-a8a5-fdfef3bb467f',
'b678b91d-976c-489a-9d75-ce85865f91ad','7fa6422c-6cfc-401e-8677-6933fbe8ea62')
AND s.canonical_key IN('manufacturer_engine_power_unspecified_standard','engine_rated_power_kw',
'rear_hitch_lift_capacity_kg','operating_weight_cab_min_kg','operating_weight_cab_max_kg',
'operating_weight_rops_min_kg','operating_weight_rops_max_kg','transmission_type')
ORDER BY t.model_name,s.canonical_key;
-- 70/70/74.2 HP manufacturer claimed without normalized ISO/SAE; TONY 54.6 kW duplicate unverified.

SELECT COUNT(*) original_private_snapshots FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_ac_tgf7800_trx7800_tony8900trg_v1';
-- Expected exactly 70 = three before-state tractors + 67 before-state specs.

SELECT COUNT(DISTINCT tractor_id) public_models,COUNT(*) source_verified_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- Expected 264/6492 at release checkpoint; may increase after later safe publication.
SELECT status,COUNT(*) FROM public.tractors GROUP BY status ORDER BY status;
-- Expected published264 /draft204 /archived10 at checkpoint.

SELECT model_name,variant,market,status,model_year FROM public.tractors
WHERE id IN('445a5f5c-8219-4eab-8d73-94518e8b9823','a0a214b3-bc54-4cc1-b83c-59d2f8765e24');
-- Swaraj 843 XM and 735 XT 4WD remain drafts until exact edition and conflicting official specs resolved.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_read_private_photo_queue;
-- Expected invoker/barrier true; false.
