-- READ ONLY: verify five abandoned source-less verified markers are quarantined.
WITH ids(id) AS (VALUES
 ('aff7369d-69e6-4e51-838d-ddeb95d22724'::uuid),
 ('d96000ac-970f-40e8-b018-3f070a6e507e'::uuid),
 ('7d1271e9-6cb8-49de-aaeb-480ff0ed3885'::uuid),
 ('d2905ce2-9d79-433c-b142-8ac1f3572931'::uuid),
 ('b7989721-b60e-4946-90db-d7d86ab07792'::uuid))
SELECT b.name brand,t.model_name,t.variant,s.id,s.canonical_key,s.spec_value,s.verified_at,
 s.last_verified_at,s.source_id,LEFT(s.measurement_standard,140) review_note,
 CASE WHEN s.verified_at IS NULL AND s.last_verified_at IS NULL
 THEN 'quarantined' ELSE 'NOT_QUARANTINED' END review_status
FROM ids JOIN public.tractor_specs s ON s.id=ids.id
JOIN public.tractors t ON t.id=s.tractor_id JOIN public.brands b ON b.id=t.brand_id
ORDER BY brand,t.model_name;
-- All five verification marks NULL. Original values remain present.

SELECT count(*) saved_original_rows FROM tc_backup.tractor_publication_patches
WHERE batch_id='20261121_legacy_5_missing_evidence_quarantine_v1';
-- Expected 5.

SELECT count(*) unsubstantiated_markers_still_verified
FROM public.tractor_specs s JOIN public.tractors t ON t.id=s.tractor_id
WHERE t.status='published' AND s.verified_at IS NOT NULL
AND (s.source_id IS NULL OR nullif(trim(s.evidence_text),'') IS NULL);
-- Expected 0 at this checkpoint.

SELECT count(distinct tractor_id) models,count(*) FILTER (WHERE spec_id IS NOT NULL) verified_public_specs
FROM public.tractorvs_public_specs WHERE spec_id IS NOT NULL;
-- Expected 221 published and 5997 visible rows.
SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
-- security_invoker=true, security_barrier=true.
