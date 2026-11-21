-- READ-ONLY 2026-11-21 Antonio Carraro manufacturer source release QA.
WITH selected(id) AS (VALUES
('321df789-607c-4045-b5d7-9a428e5d117f'::uuid),
('ef4320ef-6d0c-41fd-b35a-1e74377d76e8'::uuid),
('057ddf74-0aac-48d0-a2ca-44df28e48619'::uuid))
SELECT b.name brand,t.model_name,t.variant,t.status,t.market,t.horsepower,t.drivetrain,t.model_year,
count(s.id) stored,
count(s.id) FILTER(WHERE s.source_id IS NOT NULL AND s.verified_at IS NOT NULL AND nullif(trim(s.evidence_text),'') IS NOT NULL) source_evidenced,
count(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND nullif(trim(s.evidence_text),'') IS NULL) proofless_marked_verified
FROM selected x JOIN public.tractors t ON t.id=x.id JOIN public.brands b ON t.brand_id=b.id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.status,t.market,t.horsepower,t.drivetrain,t.model_year ORDER BY t.model_name;
-- Expected three published; SN 14 / TC 12 / TONY 15; zero proofless stamps.

SELECT t.model_name,s.canonical_key,s.spec_value,s.unit,s.measurement_standard,d.source_url
FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id JOIN public.data_sources d ON d.id=s.source_id
WHERE t.id IN('321df789-607c-4045-b5d7-9a428e5d117f',
'ef4320ef-6d0c-41fd-b35a-1e74377d76e8','057ddf74-0aac-48d0-a2ca-44df28e48619')
AND s.verified_at IS NOT NULL AND s.canonical_key IN('manufacturer_engine_power_unspecified_standard',
'transmission_type','engine_max_torque_nm','engine_max_torque_rpm','operating_weight_cab_max_kg',
'operating_weight_cab_min_kg','operating_weight_rops_min_kg','operating_weight_rops_max_kg')
ORDER BY t.model_name,s.canonical_key;
-- TONY has 8700-only 375Nm@1400rpm, manufacturer transmission description (without unproved CVT).
-- Manufacturer HP fields are NOT rated ISO/SAE headline horsepower.

SELECT count(*) original_backup_rows FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_antonio_sn_tc_tony_3_models_v1';
-- 60 (3 tractor + 57 technical original rows).
SELECT count(DISTINCT tractor_id) public_models,count(*) public_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- At checkpoint 258/6425, later publications may raise counts.
SELECT status,count(*) FROM public.tractors GROUP BY status ORDER BY status;
-- 258 published /210 draft /10 archived checkpoint.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_photo_queue;
-- invoker true, barrier true, anon false.
