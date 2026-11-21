-- READ ONLY: Mahindra official model batch 233 production verification.
WITH selected(id) AS (
 VALUES ('c93fae3a-b63e-44e0-94d4-3b56815d8ce3'::uuid),
 ('ec2e914e-0c05-4646-ac94-de20eb56741b'::uuid),
 ('ac32976d-97ea-4d36-852f-e92c57c19bf0'::uuid))
SELECT t.id,b.name brand,t.model_name,t.variant,t.market,t.status,t.drivetrain,t.horsepower,t.model_year,
count(s.id) stored, count(s.id) FILTER(WHERE s.source_id IS NOT NULL AND s.verified_at IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) evidenced,
count(DISTINCT s.canonical_key) distinct_keys
FROM selected m JOIN public.tractors t ON t.id=m.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY t.id,b.name,t.model_name,t.variant,t.market,t.status,t.drivetrain,t.horsepower,t.model_year
ORDER BY model_name,variant;
-- Expected 3 PUBLISHED 4WD, 13/12/12 specs, no guessed rated horsepower/year.

SELECT count(*) public_specs,count(DISTINCT tractor_id) public_models
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- Expected 6150 / 233 at release checkpoint.

SELECT count(*) source_verified_new FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL
AND tractor_id IN ('c93fae3a-b63e-44e0-94d4-3b56815d8ce3',
 'ec2e914e-0c05-4646-ac94-de20eb56741b','ac32976d-97ea-4d36-852f-e92c57c19bf0');
-- Expected 37.

SELECT batch_id,count(*) original_private_backups FROM tc_backup.tractor_publication_patches
WHERE batch_id IN ('20261121_mahindra_oja3132_3136_3140_india_v1',
 '20261121_mahindra_jivo_yuvraj_six_models_v1',
 '20261121_mahindra_jivo245di_305_305vineyard_v1')
GROUP BY batch_id ORDER BY batch_id;
-- Expected 45 / 85 / 40.

SELECT count(*) incorrect_305_pto_records FROM public.tractor_specs WHERE
 tractor_id IN ('ec2e914e-0c05-4646-ac94-de20eb56741b',
 'ac32976d-97ea-4d36-852f-e92c57c19bf0') AND canonical_key='pto_speeds';
-- Expected 0 (official product feature/table disagreement).

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_photo_queue;
-- Expected security_invoker=true, security_barrier=true, anon false.
