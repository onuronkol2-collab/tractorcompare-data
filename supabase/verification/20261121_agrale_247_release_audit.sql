-- Read-only 3 Agrale official product page release verification.
WITH selected(id) AS (VALUES
('0b53e944-0ccd-4fbd-84e8-f49ffde1a2ae'::uuid),
('66781999-258a-4baa-a52b-9a4f79c8b708'::uuid),
('e3ed3f24-a207-44cf-8b96-b33e5e92723e'::uuid))
SELECT b.name brand,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain,
count(s.id) specs,
count(s.id) FILTER(WHERE s.source_id IS NOT NULL AND s.verified_at IS NOT NULL AND NULLIF(trim(s.evidence_text),'') IS NOT NULL) evidence_verified,
count(DISTINCT s.canonical_key) unique_keys
FROM selected r JOIN public.tractors t ON r.id=t.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain
ORDER BY t.model_name;
-- Expected three published Brazilian Agrale models with 7 evidence-backed specs each.
SELECT s.tractor_id,s.canonical_key,s.spec_value,s.unit,s.measurement_standard,d.source_url
FROM public.tractor_specs s JOIN public.data_sources d ON d.id=s.source_id
WHERE s.tractor_id IN('0b53e944-0ccd-4fbd-84e8-f49ffde1a2ae',
'66781999-258a-4baa-a52b-9a4f79c8b708','e3ed3f24-a207-44cf-8b96-b33e5e92723e')
AND s.canonical_key IN('engine_power_kw','engine_power_metric','engine_max_torque')
ORDER BY s.tractor_id,s.canonical_key;
-- Cargo only cites NBR ISO 1585.
SELECT count(distinct tractor_id) published_models,count(*) verified_public_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- At publication checkpoint: 247, 6289.
SELECT count(*) backup_originals FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_agrale_4125_cargo_4233_official_v1';
-- Expected 24.
SELECT status,count(*) FROM public.tractors GROUP BY status ORDER BY status;
-- Release 247 published /221 draft /10 archived.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_private_photo_queue;
-- Expected invoker+barrier true, anon false.
