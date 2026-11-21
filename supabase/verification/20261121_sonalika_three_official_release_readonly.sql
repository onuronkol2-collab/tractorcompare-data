-- READ ONLY: current live Sonalika 2WD family release, 2026-11-21.
SELECT b.name AS brand,t.model_name,t.variant,t.market,t.status,t.model_year,t.horsepower,
 COUNT(s.id) saved_specs,COUNT(s.id) FILTER (WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL
  AND NULLIF(btrim(s.evidence_text),'') IS NOT NULL) source_verified,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NULL) held_conflicts
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
WHERE t.id IN (
'ad248a3c-d9af-45f9-9aff-93c54d2f45e8',
'd5d14815-e556-4485-a747-a3de3ebf2b81',
'15fca0db-11a6-486d-872e-fc0518d78cd0')
GROUP BY t.id,b.name,t.model_name,t.variant,t.market,t.status,t.model_year,t.horsepower
ORDER BY t.model_name;
-- Expected 2WD, India, published, model_year NULL, horsepower NULL; 14/14, 13/14, 14/14 verified.

SELECT COUNT(DISTINCT tractor_id) models,
 COUNT(*) FILTER (WHERE spec_id IS NOT NULL) public_source_verified_specs
FROM public.tractorvs_public_specs
WHERE tractor_id IN('ad248a3c-d9af-45f9-9aff-93c54d2f45e8',
'd5d14815-e556-4485-a747-a3de3ebf2b81','15fca0db-11a6-486d-872e-fc0518d78cd0');
-- Expected 3 models, 41 public specs.

SELECT COUNT(*) backup_records FROM tc_backup.tractor_publication_patches
 WHERE batch_id='20261121_sonalika_di30_di734_gt20_v1';
-- Expected 45 original row snapshots.

SELECT s.canonical_key,s.spec_value,s.verified_at,s.measurement_standard
FROM public.tractor_specs s
WHERE s.tractor_id='d5d14815-e556-4485-a747-a3de3ebf2b81' AND s.canonical_key='air_filter_type';
-- Expected disputed oil bath row verified_at NULL and conflict annotation.

SELECT status, COUNT(*) models FROM public.tractors GROUP BY status ORDER BY status;
-- At this checkpoint: 213 published / 252 draft / 7 archived.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_photo_queue_visible;
-- Expected security_invoker=true and security_barrier=true, anon false.
