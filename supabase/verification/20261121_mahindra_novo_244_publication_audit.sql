-- READ-ONLY QA of 2026-11-21 exact Mahindra manufacturer release. No DDL/DML.
WITH targets(id) AS (VALUES
('471d7ad4-6073-4405-a0f4-e90f71cbbccb'::uuid),('585b5da9-5f49-415e-99e4-fd75468fc960'::uuid),
('f6267c8d-21e1-4b11-9550-bbdfe5936f3e'::uuid),('872e7a07-8321-4565-88ff-1d25970fa784'::uuid),
('9658df33-8bbc-4dad-909d-9adbefda69f3'::uuid),('b51998b3-8174-4ecd-9abd-08fafac9ae4a'::uuid),
('e434867e-5125-48f4-9fee-f27f179d9bfc'::uuid))
SELECT b.name brand,t.model_name,t.id,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain,
COUNT(s.id) stored_specs,
COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) source_evidenced,
COUNT(DISTINCT s.canonical_key) distinct_keys
FROM targets d JOIN public.tractors t ON d.id=t.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON t.id=s.tractor_id
GROUP BY t.id,b.name,t.model_name,t.variant,t.market,t.status,t.horsepower,t.model_year,t.drivetrain ORDER BY t.model_name;
-- Expected 7 published, 13+13+13+13+11+13+12=88 source-backed specs.
SELECT COUNT(DISTINCT tractor_id) public_models,COUNT(*) source_verified_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- At initial release checkpoint, 244 / 6268.
SELECT COUNT(*) original_backup_rows FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_mahindra_novo6_jivo365_v1';
-- Expected 101.
SELECT t.model_name,s.canonical_key,s.spec_value,s.verified_at FROM public.tractor_specs s
JOIN public.tractors t ON t.id=s.tractor_id WHERE t.id IN
('f6267c8d-21e1-4b11-9550-bbdfe5936f3e','872e7a07-8321-4565-88ff-1d25970fa784',
'b51998b3-8174-4ecd-9abd-08fafac9ae4a','e434867e-5125-48f4-9fee-f27f179d9bfc')
AND s.canonical_key IN ('engine_torque','engine_power_range','pto_speeds','rear_lift_capacity') ORDER BY t.model_name,s.canonical_key;
-- PS motor torque 214; seven marketing generic HP rows must be unverified; no NOVO755 lift row due OEM self-contradiction.
SELECT COUNT(*) leaked_755_lift FROM public.tractor_specs
WHERE tractor_id='e434867e-5125-48f4-9fee-f27f179d9bfc' AND canonical_key='rear_lift_capacity' AND verified_at IS NOT NULL;
-- Expected 0.
SELECT status,count(*) FROM public.tractors GROUP BY status ORDER BY status;
-- At release 244 published/224 draft/10 archived.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_read_private_photo_queue;
-- Expected security_invoker=true,security_barrier=true; false.
