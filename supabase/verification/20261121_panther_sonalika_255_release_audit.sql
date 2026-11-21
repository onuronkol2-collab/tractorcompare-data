-- READ-ONLY 21 Nov 2026 Panther/Sonalika model publication and RLS verification.
WITH selected(id) AS (VALUES
('da7afde6-6c29-49b9-a79f-63bc32025825'::uuid),
('48e8caec-9a7f-4eb6-b271-9a7c517c7d27'::uuid),
('fb435078-e556-417b-a5be-4084d6cf26f7'::uuid),
('9486ecf8-7150-494a-9173-0364986a195a'::uuid))
SELECT b.name brand,t.model_name,t.variant,t.status,t.market,t.horsepower,t.drivetrain,t.model_year,
COUNT(s.id) stored,
COUNT(s.id) FILTER(WHERE s.source_id IS NOT NULL AND s.verified_at IS NOT NULL
 AND NULLIF(TRIM(s.evidence_text),'') IS NOT NULL) exact_evidenced,
COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND NULLIF(TRIM(s.evidence_text),'') IS NULL) unsupported_verified
FROM selected q JOIN public.tractors t ON t.id=q.id JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
GROUP BY b.name,t.id,t.model_name,t.variant,t.status,t.market,t.horsepower,t.drivetrain,t.model_year
ORDER BY t.model_name;
-- Expected 4 published, manufacturer-backed Panther 26 M 11, H 10, Sonalika DI734 12, Tiger DI55 III 14.

SELECT COUNT(*) old_orig_snapshot_rows FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_panther26_sonalika_di734_tiger55_verified_v1';
-- Expected 63 (4 tractor records + 59 old technical rows).

SELECT t.model_name,s.canonical_key,s.spec_value,s.verified_at,s.measurement_standard FROM public.tractor_specs s
JOIN public.tractors t ON t.id=s.tractor_id WHERE
 (t.id='fb435078-e556-417b-a5be-4084d6cf26f7' AND s.canonical_key IN('air_filter_type','transmission_type','engine_hp_category'))
 OR (t.id IN('da7afde6-6c29-49b9-a79f-63bc32025825','48e8caec-9a7f-4eb6-b271-9a7c517c7d27')
 AND s.canonical_key IN('engine_power','manufacturer_engine_power_unspecified_standard'))
ORDER BY t.model_name,s.canonical_key;
-- Two Sonalika internally inconsistent fields remain NULL verification. Original old Panther power row
-- also unverified, manufacturer-state 25 hp separated from model number 26.

SELECT COUNT(DISTINCT tractor_id) published_models,COUNT(*) source_verified_rows
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- Expected 255 models/6384 specs at checkpoint, may increase after later releases.

SELECT status,COUNT(*) FROM public.tractors GROUP BY status ORDER BY status;
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') anon_photo_queue;
-- Expected 255 published/213 draft/10 archived; security_invoker/barrier true; anon false.
