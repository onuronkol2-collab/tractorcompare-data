-- READ ONLY: ArmaTrac 804 Cab vs 804.4 ROPS distinct exact-model QA.
WITH ids(id) AS (VALUES
('619e4fd9-1155-4927-b488-4f55c95ee739'::uuid),
('362ad12b-7e89-4adf-83df-841b96b0362e'::uuid))
SELECT b.name brand,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain,
COUNT(s.id) stored,
COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) evidence_verified,
COUNT(DISTINCT s.canonical_key) distinct_keys
FROM ids JOIN public.tractors t ON t.id=ids.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain
ORDER BY t.model_name;
-- Both published, each 5 verified specs, 5 distinct keys; no guessed rated power/year/drivetrain.

SELECT t.model_name,s.canonical_key,s.spec_value,s.unit,d.source_url,s.measurement_standard
FROM public.tractors t JOIN public.tractor_specs s ON s.tractor_id=t.id
JOIN public.data_sources d ON s.source_id=d.id
WHERE t.id IN('619e4fd9-1155-4927-b488-4f55c95ee739',
 '362ad12b-7e89-4adf-83df-841b96b0362e')
ORDER BY t.model_name,s.canonical_key;
-- OEM explicitly lists Stage3A, Perkins, Cab vs ROPS, 307Nm and maker-stated 80HP (test standard unspecified).

SELECT COUNT(*) original_private_snapshot_rows FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_armatrac_804_cab_8044_rops_v1';
-- Exactly 12 (2 original tractors+10 original specs).

SELECT COUNT(DISTINCT tractor_id) public_models,COUNT(*) evidenced_public_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- At checkpoint expected 266 models / 6502 specs; numbers may increase if later batches publish.

SELECT status,COUNT(*) FROM public.tractors GROUP BY status ORDER BY status;
-- Checkpoint expected 266 published,202 draft,10 archived.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_private_photo_queue;
-- Expected security_invoker/barrier true, false.

SELECT t.model_name,t.status FROM public.tractors t
WHERE t.id IN('8f0b855e-9cd7-401e-ae10-facd552da759',
 '445a5f5c-8219-4eab-8d73-94518e8b9823',
 'a0a214b3-bc54-4cc1-b83c-59d2f8765e24');
-- Must stay drafts until maker conflicts resolved.
