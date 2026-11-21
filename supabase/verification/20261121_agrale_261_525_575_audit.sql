-- READ ONLY. 2026-11-21 maker-specific Agrale 525/575 Compact/575 Super evidence-gated production audit.
WITH ids(id) AS (VALUES
 ('fb5e66a6-71bc-4bbf-afed-68eb685ebf08'::uuid),
 ('5a960051-ed8b-4f1d-9211-3d05e4d094ed'::uuid),
 ('d3f67001-278b-4a27-8a00-ddbde6ee7a91'::uuid))
SELECT b.name brand,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain,
count(s.id) all_stored,count(s.id) FILTER(WHERE s.source_id IS NOT NULL AND s.verified_at IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) exact_source_rows,
count(DISTINCT s.canonical_key) distinct_keys
FROM ids JOIN public.tractors t ON t.id=ids.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON t.id=s.tractor_id
GROUP BY b.name,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain ORDER BY t.model_name;
-- Three published; 8/6/6 exact specs, null non-comparable numeric horsepower/model-year/drivetrain.

SELECT t.model_name,s.canonical_key,s.spec_name,s.spec_value,s.unit,s.verified_at,s.measurement_standard,d.source_url
FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id JOIN public.data_sources d ON s.source_id=d.id
WHERE t.id IN('fb5e66a6-71bc-4bbf-afed-68eb685ebf08',
 '5a960051-ed8b-4f1d-9211-3d05e4d094ed','d3f67001-278b-4a27-8a00-ddbde6ee7a91')
AND s.canonical_key IN('manufacturer_engine_torque_range_at_rpm','engine_power_metric','engine_model','transmission_gear_configuration')
ORDER BY t.model_name,s.canonical_key;
-- Range 83-100 Nm is not max scalar; 575's 75 cv is a product marketing figure vs ISO/SAE separately measured brochure.
-- Exact product-pages sourced new gears 8F8R /15F15R /15F15R.

SELECT count(*) original_private_snapshots FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_agrale_525_575compact_super_individual_v1';
-- Expected 20 (3 tractors +17 old model-specs).

SELECT count(distinct tractor_id) public_model_count,count(*) source_verified_rows
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- At publication checkpoint 261 / 6445; may increase when new guarded models are released.
SELECT status,count(*) FROM public.tractors GROUP BY status ORDER BY status;
-- At release published 261, draft 207, archived 10.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_can_read_private_photo_queue;
-- Expect security_invoker=true,security_barrier=true; anon=false.
