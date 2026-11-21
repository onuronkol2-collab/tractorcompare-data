-- TractorVS READ-ONLY factory page QA: two published Agrale 6185 / 7215, Brazil.
WITH ids(id) AS (VALUES
 ('6294988c-26de-4180-9b37-ac75f32b9ab3'::uuid),
 ('5d2edc98-24ce-4d19-a1c7-e51aa0b96414'::uuid))
SELECT b.name brand,t.model_name,t.id,t.market,t.variant,t.status,t.horsepower,t.drivetrain,t.model_year,
COUNT(s.id) all_stored_specs,
COUNT(s.id) FILTER(WHERE s.source_id IS NOT NULL AND s.verified_at IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) public_source_evidenced,
COUNT(DISTINCT s.canonical_key) unique_keys
FROM ids JOIN public.tractors t ON t.id=ids.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.market,t.variant,t.status,t.horsepower,t.drivetrain,t.model_year ORDER BY t.model_name;
-- Expected two published, 9 + 7 manufacturer backed, 25 + 20 stored (including independent unverified).
SELECT t.model_name,s.canonical_key,s.spec_value,s.unit,s.source_id,d.source_url
FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id JOIN public.data_sources d ON d.id=s.source_id
WHERE t.id IN('6294988c-26de-4180-9b37-ac75f32b9ab3','5d2edc98-24ce-4d19-a1c7-e51aa0b96414') AND s.verified_at IS NOT NULL
ORDER BY t.model_name,s.canonical_key;
-- All 16 source URLs must equal official corresponding Agrale Brazilian model page; no third party.
SELECT count(*) original_private_snapshots FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_agrale_6185_7215_official_heads_v1';
-- Expected 47: 2 tractor + 45 spec rows.
SELECT COUNT(DISTINCT tractor_id) public_model_count,COUNT(*) public_verified_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- At the release checkpoint 251 / 6337; after future releases these can increase.
SELECT status,COUNT(*) FROM public.tractors GROUP BY status ORDER BY status;
-- At release published 251/draft 217/archived 10.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_can_read_private_image_candidate_queue;
-- Expected security_invoker=true/security_barrier=true; anon false.
