-- TractorVS | Belarus 900-series manufacturer power review, 23 Nov 2026
-- Read-only follow-up for exactly three published models and five private
-- manufacturer-cited review candidates; never promotes or approves anything.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '10s';

-- The private review queue must remain RLS protected and not available to normal
-- API roles. No "fix" should make a private evidence queue public.
SELECT n.nspname AS schema_name,c.relname AS table_name,c.relrowsecurity AS rls_enabled,
 has_table_privilege('anon',c.oid,'SELECT') AS anon_select_granted,
 has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select_granted,
 (SELECT count(*) FROM pg_policies p WHERE p.schemaname=n.nspname
   AND p.tablename=c.relname)::int AS policy_count
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname='tractorvs_spec_review_candidates';

-- Fail review if any record is linked to the wrong tractor/motor, if its
-- canonical kind is mixed, if the original tolerance is lost, or if a live
-- published spec was inserted without a separate publication review.
WITH expected(model_name,variant,motor,kind,val,source_url) AS (
 VALUES
 ('922.4','MTW 922 / Stage IIIa','D-245.5S3A',
  'manufacturer_nominal_engine_power','70',
  'https://www.istokrtps.ru/catalog_images/traktory/MTZ922/MTZ_922.pdf'),
 ('923.3','MTW 923 / Stage II','D-245.5S2',
  'manufacturer_nominal_engine_power','70',
  'https://mtzavr.ru/wp-content/uploads/2023/09/re-belarus-923.3_923.4-2015.pdf'),
 ('923.3','MTW 923 / Stage II','D-245.5S2',
  'manufacturer_operating_engine_power','66.7 ± 2.0',
  'https://mtzavr.ru/wp-content/uploads/2023/09/re-belarus-923.3_923.4-2015.pdf'),
 ('952.4','MTW 952 / D-245.5S3A','D-245.5S3A',
  'manufacturer_nominal_engine_power','70.0 ± 2.0',
  'https://beltrakt.ru/upload/iblock/a08/akjfreahpb4ymrsd5d8tpg7mttw336a8.pdf'),
 ('952.4','MTW 952 / D-245.5S3A','D-245.5S3A',
  'manufacturer_operating_engine_power','66.7 ± 2.0',
  'https://beltrakt.ru/upload/iblock/a08/akjfreahpb4ymrsd5d8tpg7mttw336a8.pdf')
), matched AS (
 SELECT e.model_name,e.kind,e.val,c.id AS candidate_id,
 c.review_status,c.unit,c.comparison_class,c.source_tier,c.measurement_standard,
 c.evidence_text,c.review_note,t.horsepower,t.status,
 EXISTS(SELECT 1 FROM public.tractor_specs s WHERE s.tractor_id=t.id
   AND s.canonical_key='engine_model' AND s.spec_value=e.motor) AS matches_motor,
 EXISTS(SELECT 1 FROM public.tractor_specs s WHERE s.tractor_id=t.id
   AND s.canonical_key=e.kind) AS exists_as_live_spec
 FROM expected e
 LEFT JOIN public.tractors t ON t.model_name=e.model_name AND t.variant=e.variant
  AND t.brand_id=(SELECT id FROM public.brands WHERE name='Belarus')
 LEFT JOIN public.tractorvs_spec_review_candidates c ON c.tractor_id=t.id
  AND c.canonical_key=e.kind AND c.spec_value=e.val AND c.source_url=e.source_url
)
SELECT model_name,kind,val,
 (count(candidate_id)=1) AS exactly_one_private_candidate,
 bool_and(review_status='needs_review' AND unit='kW' AND comparison_class='engine'
  AND source_tier='manufacturer' AND length(btrim(coalesce(evidence_text,'')))>0
  AND length(btrim(coalesce(measurement_standard,'')))>0
  AND length(btrim(coalesce(review_note,'')))>0) AS has_evidence_and_is_not_approved,
 bool_and(status='published' AND horsepower IS NULL AND matches_motor
  AND NOT exists_as_live_spec) AS public_records_untouched
FROM matched
GROUP BY model_name,kind,val ORDER BY model_name,kind;

ROLLBACK;
