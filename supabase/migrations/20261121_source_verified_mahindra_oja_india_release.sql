-- TractorVS producer evidence release: three India 4WD Mahindra OJA models.
-- Sources: each exact model on Mahindra Tractors India official product pages.
-- Unverified range claims stay in internal draft storage, but are excluded from
-- anon/authenticated reads and public catalogue view for ALL published tractors.
-- OJA 2121 stays draft due the official 2WD title / 4WD specification mismatch.
BEGIN;
CREATE TABLE IF NOT EXISTS tc_backup.tractor_publication_patches (
 batch_id text NOT NULL,
 record_kind text NOT NULL CHECK (record_kind IN ('tractor','spec')),
 record_id uuid NOT NULL,
 row_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (batch_id,record_kind,record_id)
);
ALTER TABLE tc_backup.tractor_publication_patches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tc_backup.tractor_publication_patches FROM PUBLIC,anon,authenticated;
GRANT ALL ON tc_backup.tractor_publication_patches TO service_role;
DO $guard$
BEGIN
 IF (SELECT count(*) FROM public.tractors
     WHERE id IN (
       'e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
       '3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
       '4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid
     ) AND status='draft' AND market='global' AND variant='Catalog listing - review')<>3
 THEN RAISE EXCEPTION 'Expected three exact OJA draft identities; abort without changes'; END IF;
 IF (SELECT count(*) FROM public.tractors WHERE status='published')<>172
 THEN RAISE EXCEPTION 'Published count changed; re-audit before publishing'; END IF;
 IF (SELECT count(*) FROM public.data_sources
     WHERE id IN (
       'e55c1501-8d11-4ac7-b736-bdfece675169'::uuid,
       'a43fccbc-11e1-4009-bd82-2de1d8bf6d24'::uuid,
       'af966209-98a4-4bf5-80b6-d29dc8135932'::uuid)
     AND source_url ~ '^https://www[.]mahindratractor[.]com/tractors/mahindra-oja-21(24|27|30)-tractor$')<>3
 THEN RAISE EXCEPTION 'Missing or changed exact official manufacturer source'; END IF;
 IF (SELECT count(*) FROM public.tractor_specs WHERE tractor_id IN (
       'e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
       '3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
       '4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid)
     AND canonical_key IN ('clutch_type','gear_shift_type','pto_speeds',
       'rear_tyre','steering_type','transmission_options','transmission_type'))<>21
 THEN RAISE EXCEPTION 'Missing or duplicated expected 7 manufacturer attributes per model'; END IF;
END $guard$;

INSERT INTO tc_backup.tractor_publication_patches(batch_id,record_kind,record_id,row_data)
SELECT 'oja-india-20261121','tractor',id,to_jsonb(t)
FROM public.tractors t WHERE t.id IN (
'e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
'3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
'4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid);
INSERT INTO tc_backup.tractor_publication_patches(batch_id,record_kind,record_id,row_data)
SELECT 'oja-india-20261121','spec',s.id,to_jsonb(s)
FROM public.tractor_specs s WHERE tractor_id IN (
'e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
'3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
'4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid);

-- Make the published specification API evidence-only. All original unverified
-- records remain stored privately; the existing two older exceptions also hide.
ALTER POLICY "Public can read published tractor specs" ON public.tractor_specs
TO anon,authenticated
USING (
  verified_at IS NOT NULL
  AND NULLIF(BTRIM(evidence_text),'') IS NOT NULL
  AND source_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.tractors t
    WHERE t.id=tractor_specs.tractor_id AND t.status='published')
);
CREATE OR REPLACE VIEW public.tractorvs_public_specs
WITH (security_invoker=true,security_barrier=true) AS
SELECT t.id AS tractor_id,b.name AS brand_name,b.country AS brand_country,
 b.website_url AS brand_website_url,
 t.model_name,t.model_year,t.variant,t.market,t.horsepower,t.engine,t.transmission,
 t.drivetrain,t.weight_kg,
 s.id AS spec_id,s.spec_name,s.spec_value,s.unit,s.canonical_key,
 s.comparison_class,s.measurement_standard,s.rated_rpm,
 s.evidence_text,s.verified_at,d.publisher AS source_publisher,
 d.source_url,d.source_type,d.accessed_at AS source_accessed_at,
 s.source_priority AS spec_source_priority
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
 AND s.verified_at IS NOT NULL
 AND NULLIF(BTRIM(s.evidence_text),'') IS NOT NULL
 AND s.source_id IS NOT NULL
LEFT JOIN public.data_sources d ON d.id=s.source_id
WHERE t.status='published';

-- Manufacturer page explicitly distinguishes the 12F+12R Indian 4WD variants.
WITH model_sources(tractor_id,source_id,model_name,tyre) AS (
 VALUES
 ('e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
  'e55c1501-8d11-4ac7-b736-bdfece675169'::uuid,'OJA 2124','8.3 x 20'),
 ('3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
  'a43fccbc-11e1-4009-bd82-2de1d8bf6d24'::uuid,'OJA 2127','8.3 x 20'),
 ('4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid,
  'af966209-98a4-4bf5-80b6-d29dc8135932'::uuid,'OJA 2130','9.5 x 18')
),
reconciled AS (
 SELECT s.id,s.canonical_key,m.source_id,m.model_name,
 CASE s.canonical_key
 WHEN 'clutch_type' THEN 'Single'
 WHEN 'gear_shift_type' THEN 'Synchro shuttle'
 WHEN 'pto_speeds' THEN '540/780'
 WHEN 'rear_tyre' THEN m.tyre
 WHEN 'steering_type' THEN 'Power steering'
 WHEN 'transmission_options' THEN '12 F + 12 R'
 WHEN 'transmission_type' THEN 'Constant mesh with synchro shuttle'
 END AS corrected,
 CASE s.canonical_key
 WHEN 'clutch_type' THEN 'Clutch Type Single'
 WHEN 'gear_shift_type' THEN 'Transmission Type Constant mesh with synchro shuttle'
 WHEN 'pto_speeds' THEN 'PTO RPM 540/780'
 WHEN 'rear_tyre' THEN 'Rear Tyre Size '||m.tyre||' in'
 WHEN 'steering_type' THEN 'Steering Type Power steering'
 WHEN 'transmission_options' THEN 'Number of Gears 12 F + 12 R'
 WHEN 'transmission_type' THEN 'Transmission Type Constant mesh with synchro shuttle'
 END AS source_quote
 FROM public.tractor_specs s JOIN model_sources m ON m.tractor_id=s.tractor_id
 WHERE s.canonical_key IN ('clutch_type','gear_shift_type','pto_speeds',
  'rear_tyre','steering_type','transmission_options','transmission_type')
)
UPDATE public.tractor_specs s SET
 spec_value=r.corrected,
 unit=CASE WHEN r.canonical_key='pto_speeds' THEN 'rpm'
           WHEN r.canonical_key='rear_tyre' THEN 'in'
           ELSE NULL END,
 source_id=r.source_id,
 evidence_text='Mahindra Tractors India — '||r.model_name||
  ' — official model-specific SPECIFICATIONS: '||r.source_quote||'.',
 verified_at=now(),last_verified_at=now(),updated_at=now()
FROM reconciled r WHERE s.id=r.id;

UPDATE public.tractors t SET
 status='published',market='India',variant='4WD (India)',
 drivetrain='4WD',transmission='Constant mesh with synchro shuttle',updated_at=now()
WHERE t.id IN (
'e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
'3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
'4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid)
AND status='draft';

DO $verify$
DECLARE c integer; s integer; a integer;
BEGIN
 SELECT count(*) INTO c FROM public.tractors t WHERE t.status='published';
 IF c<>175 THEN RAISE EXCEPTION 'Wrong total published count: %',c; END IF;
 SELECT count(*) INTO c FROM public.tractors t
 WHERE t.id IN ('e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
 '3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
 '4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid)
 AND t.status='published' AND t.market='India'
 AND t.variant='4WD (India)' AND t.horsepower IS NULL;
 IF c<>3 THEN RAISE EXCEPTION 'OJA model identity / unknown power regression'; END IF;
 SELECT count(*) INTO s FROM public.tractorvs_public_specs v
 WHERE v.tractor_id IN ('e943087d-56bf-4508-96c5-79fee6cf47ec'::uuid,
 '3ed7c93a-54e6-4cf6-8c26-9e05cbb24ad6'::uuid,
 '4c19362e-d8cf-4272-a283-abc40ab1d8ae'::uuid)
 AND v.spec_id IS NOT NULL;
 IF s<>42 THEN RAISE EXCEPTION 'Expected 14 reviewed specs/model, got %',s; END IF;
 SELECT count(*) INTO a FROM tc_backup.tractor_publication_patches
 WHERE batch_id='oja-india-20261121';
 IF a<>48 THEN RAISE EXCEPTION 'Missing rollback snapshots: %',a; END IF;
 IF (SELECT count(*) FROM public.tractorvs_public_specs
     WHERE spec_id IS NOT NULL
     AND (verified_at IS NULL OR NULLIF(BTRIM(evidence_text),'') IS NULL OR source_url !~ '^https://'))<>0
 THEN RAISE EXCEPTION 'Unverified public technical claims remain'; END IF;
 IF (SELECT count(*) FROM public.tractors WHERE model_name='OJA 2121' AND status='draft')<>1
 THEN RAISE EXCEPTION 'Ambiguous OJA 2121 must remain draft'; END IF;
END $verify$;
COMMIT;