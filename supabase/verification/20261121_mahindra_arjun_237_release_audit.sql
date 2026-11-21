-- READ-ONLY QA, latest release 2026-11-21. No DDL/UPDATE/DELETE.
WITH r(id) AS (VALUES
('2c1a6638-fe60-46fd-8a56-ea212ddbbd5b'::uuid),
('bee5e88f-d217-49a4-b484-4e34b9b60ff9'::uuid),
('739db984-4cba-4173-bf8c-b022fc2a8f80'::uuid),
('163dbb9b-676d-4b0d-b1f7-17a30bb16c1f'::uuid))
SELECT b.name brand,t.model_name,t.variant,t.market,t.status,t.horsepower,t.drivetrain,t.model_year,
COUNT(s.id) stored,COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) source_verified,
COUNT(DISTINCT s.canonical_key) distinct_keys
FROM r JOIN public.tractors t ON t.id=r.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.drivetrain,t.model_year ORDER BY t.model_name;
-- Four published, evidence 8/7/7/8. Header engine hp, drive and year must be NULL.

SELECT COUNT(*) verified_new_public_technical_specs FROM public.tractorvs_public_specs
WHERE spec_id IS NOT NULL AND tractor_id IN(
 '2c1a6638-fe60-46fd-8a56-ea212ddbbd5b',
 'bee5e88f-d217-49a4-b484-4e34b9b60ff9',
 '739db984-4cba-4173-bf8c-b022fc2a8f80',
 '163dbb9b-676d-4b0d-b1f7-17a30bb16c1f');
-- 30.

SELECT COUNT(*) protected_original_rows FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_mahindra_arjun_four_models_v1';
-- 40 originals (4 tractor + 36 spec).

SELECT t.model_name,s.canonical_key,s.spec_value,s.verified_at FROM public.tractor_specs s
JOIN public.tractors t ON t.id=s.tractor_id
WHERE t.id IN ('bee5e88f-d217-49a4-b484-4e34b9b60ff9',
 '739db984-4cba-4173-bf8c-b022fc2a8f80')
AND s.canonical_key='transmission_type';
-- FCM rows held unverified (verified_at=NULL) because exact OEM feature/table terminology conflicts.

SELECT status,COUNT(*) FROM public.tractors GROUP BY status ORDER BY status;
-- Release checkpoint published 237 / draft 231 / archived 10.

SELECT COUNT(*) verified_public_specs,COUNT(DISTINCT tractor_id) verified_public_models
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- 6180 / 237.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_photo_queue;
-- Expect security_invoker=true, security_barrier=true and false.
