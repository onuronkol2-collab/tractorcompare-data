-- READ-ONLY production source, public-RLS and reversible-release audit.
WITH nine_models(id) AS (VALUES
('adfcfeb9-0604-4f77-bf30-2e0607404743'::uuid),
('413bd1b9-969b-44ab-92cf-503683935776'::uuid),
('52acafb7-b66d-4d88-be34-5c6091b0f2b0'::uuid),
('d52fdf40-1666-4880-a24b-61317308e5f1'::uuid),
('34f40738-a78d-4223-b52d-d0bfaa9903f2'::uuid),
('c67f6152-7377-4c22-b6f2-166c58e87f0c'::uuid),
('846dd47d-cf3d-4e12-8957-265b6d16931b'::uuid),
('8f4b2005-ec80-44a9-a093-fd2a3e9d8bc8'::uuid),
('ebe20072-90ee-41ac-a004-6ef3906c7533'::uuid)
)
SELECT b.name brand,t.model_name,t.id,t.variant,t.market,t.status,t.model_year,t.horsepower,t.drivetrain,
COUNT(s.id) all_specs,
COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL
 AND nullif(trim(s.evidence_text),'') IS NOT NULL) verified_with_evidence,
COUNT(DISTINCT s.canonical_key) unique_keys
FROM nine_models n JOIN public.tractors t ON t.id=n.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY t.id,b.name,t.model_name,t.variant,t.market,t.status,t.model_year,t.horsepower,t.drivetrain
ORDER BY model_name,variant;
-- Expected nine published Mahindra models; 116 supported technical specs, no fake test HP/year.

SELECT count(*) public_verified_specs,count(distinct tractor_id) public_models
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- At this release checkpoint: 6113, 230 (these will grow later).

SELECT batch_id,count(*) preserved_original_rows
FROM tc_backup.tractor_publication_patches
WHERE batch_id IN ('20261121_mahindra_oja3132_3136_3140_india_v1',
                   '20261121_mahindra_jivo_yuvraj_six_models_v1')
GROUP BY batch_id ORDER BY batch_id;
-- Expected 45 originals and 85 originals.

SELECT t.model_name,s.canonical_key,s.verified_at
FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id
WHERE s.tractor_id IN('adfcfeb9-0604-4f77-bf30-2e0607404743',
'413bd1b9-969b-44ab-92cf-503683935776',
'52acafb7-b66d-4d88-be34-5c6091b0f2b0')
AND s.canonical_key IN('engine_power_range','pto_speeds','rear_tyre')
ORDER BY t.model_name,s.canonical_key;
-- OJA three ranges+three PTO all verified_at=NULL; OJA 3136 rear tyre verified_at=NULL.

SELECT status,count(*) AS models FROM public.tractors GROUP BY status ORDER BY status;
-- At this release: published 230 / draft 238 / archived 10.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_can_read_private_photo_queue;
-- Expect security_invoker/security_barrier and false.

SELECT model_name,status FROM public.tractors
WHERE id='2883deee-23d9-47b9-a5af-cc1cb6299ea1';
-- OJA 2121 remains draft until manufacturer 2WD/4WD contradiction resolved.
