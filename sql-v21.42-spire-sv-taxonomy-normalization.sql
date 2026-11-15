-- TractorCompare AI v21.42
-- Lamborghini Spire S/V pending-finding taxonomy normalization.
-- Scope: exactly 18 audited pending findings from the Spire S 80 Target and
-- Spire V 80 Target runs. No research runs, queues, tractors, published specs,
-- review statuses, or source documents are changed.
--
-- Required predecessor functions: tc_canonical_spec_key_v21_37_alias,
-- tc_canonical_spec_class, and tc_apply_spec_taxonomy.
-- Safe behavior: exact-row preflight; one transaction; aborts on any mismatch;
-- post-update assertions; all 18 findings remain pending.

BEGIN;

-- 1) Exact immutable target manifest from the v21.41 read-only audit.
CREATE TEMP TABLE tc_v2142_targets ON COMMIT DROP AS
SELECT *
FROM (VALUES
  -- Spire S 80 Target: previously unmapped aliases (5 findings)
  ('1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target'::text, 'Injection system'::text, 'Common Rail @ 2000 bar'::text, NULL::text, 6::integer, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8'::text, NULL::text, 'other'::text, 'fuel_injection_system'::text, 'engine'::text),
  ('8cbb1c5d-18c6-4377-9f60-02f7c624336c'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'Max. power', '76', 'HP', 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'engine_max_power', 'engine'),
  ('bfcad029-d550-44ce-8c09-5c3e6e01cc89'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'Max. power', '55.8', 'kW', 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'engine_max_power', 'engine'),
  ('ad3addb7-1c31-4260-9b80-a7a625e1d95b'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'With front tyre', '280/70 R18', NULL, 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'front_tire_size', 'tires'),
  ('d3dc1f16-b6c8-4a45-a9e0-09609db745a4'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'With rear tyre', '380/70 R28', NULL, 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'rear_tire_size', 'tires'),

  -- Spire V 80 Target: previously unmapped aliases (5 findings)
  ('cc8a15cd-37de-4d7b-ae24-489aec6f6c5b'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'Injection type', 'Common Rail', NULL, 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'fuel_injection_system', 'engine'),
  ('64716e79-5c28-41a0-8494-df25915485c6'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'Max. power', '76', 'HP', 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'engine_max_power', 'engine'),
  ('eca82457-b6ce-456a-b027-7df02a5980f4'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'Max. power', '55.8', 'kW', 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'engine_max_power', 'engine'),
  ('420c724b-4f42-4d09-9364-fe94799be356'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'With front tyre Size', '180/95 R16', NULL, 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'front_tire_size', 'tires'),
  ('c495b976-d388-445c-9299-b356412983aa'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'With rear tyre Size', '280/85 R24', NULL, 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', NULL, 'other', 'rear_tire_size', 'tires'),

  -- S/V: rated-engine-speed power values were incorrectly keyed as engine_rated_speed.
  ('89466039-0123-4d09-ae6e-6d7386b18154'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'Power at rated engine speed', '55.2', 'kW', 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'engine_rated_speed', 'engine', 'engine_rated_power', 'engine'),
  ('d4bf3eab-c0a1-42b4-a995-fb32a193931e'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'Power at rated engine speed', '75', 'HP', 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'engine_rated_speed', 'engine', 'engine_rated_power', 'engine'),
  ('b8825f0b-7605-467f-86fb-902b6aeb2954'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'Power at rated engine speed', '55.2', 'kW', 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'engine_rated_speed', 'engine', 'engine_rated_power', 'engine'),
  ('f7f8ed79-f23c-470c-96f0-6975d6672200'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'Power at rated engine speed', '75', 'HP', 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'engine_rated_speed', 'engine', 'engine_rated_power', 'engine'),

  -- S/V: forward/reverse speed-count configurations must align with the F model's
  -- transmission_gear_configuration key. Shuttle type remains in measurement_standard.
  ('1de5cb39-38e3-49f5-9c24-d174cb26ba1c'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL, 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'transmission_type', 'transmission', 'transmission_gear_configuration', 'transmission'),
  ('4ed765cf-0a46-4128-a817-81d15c0cf8ba'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'Spire S 80 Target', 'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL, 6, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'transmission_type', 'transmission', 'transmission_gear_configuration', 'transmission'),
  ('5a39cd16-4040-4e38-9226-e1968853f5e8'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL, 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'transmission_type', 'transmission', 'transmission_gear_configuration', 'transmission'),
  ('d7ddae54-61b2-49d0-9263-b5a95dcd9d0c'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, 'Spire V 80 Target', 'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL, 7, 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8', 'transmission_type', 'transmission', 'transmission_gear_configuration', 'transmission')
) AS v(
  finding_id, tractor_id, run_id, model_name, spec_name, spec_value, unit,
  page_number, source_url, old_canonical_key, old_comparison_class,
  new_canonical_key, new_comparison_class
);

ALTER TABLE tc_v2142_targets ADD PRIMARY KEY (finding_id);

-- 2) Stop immediately unless all 18 target rows still exactly match the audit.
DO $preflight$
DECLARE
  v_target_count integer;
  v_matched_count integer;
  v_s_count integer;
  v_v_count integer;
  v_s_non_pending integer;
  v_v_non_pending integer;
BEGIN
  SELECT count(*) INTO v_target_count FROM tc_v2142_targets;
  IF v_target_count <> 18 THEN
    RAISE EXCEPTION 'v21.42 preflight failed: target manifest count %, expected 18.', v_target_count;
  END IF;

  SELECT count(*) INTO v_matched_count
  FROM tc_v2142_targets t
  JOIN public.ai_research_findings f ON f.id = t.finding_id
  WHERE f.tractor_id = t.tractor_id
    AND f.run_id = t.run_id
    AND f.proposed_model_name = t.model_name
    AND f.spec_name = t.spec_name
    AND f.spec_value = t.spec_value
    AND f.unit IS NOT DISTINCT FROM t.unit
    AND f.page_number = t.page_number
    AND f.source_url = t.source_url
    AND f.canonical_key IS NOT DISTINCT FROM t.old_canonical_key
    AND f.comparison_class = t.old_comparison_class
    AND f.review_status = 'pending'
    AND f.inserted_spec_id IS NULL;

  IF v_matched_count <> 18 THEN
    RAISE EXCEPTION 'v21.42 preflight failed: only % of 18 exact audited pending findings matched. No rows changed.', v_matched_count;
  END IF;

  SELECT count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid),
         count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid AND review_status <> 'pending'),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid AND review_status <> 'pending')
  INTO v_s_count, v_v_count, v_s_non_pending, v_v_non_pending
  FROM public.ai_research_findings
  WHERE run_id IN (
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  );

  IF v_s_count <> 56 OR v_v_count <> 57 OR v_s_non_pending <> 0 OR v_v_non_pending <> 0 THEN
    RAISE EXCEPTION 'v21.42 preflight failed: S total/pending %,%; V total/non-pending %,%. Expected 56/0 and 57/0.', v_s_count, v_s_non_pending, v_v_count, v_v_non_pending;
  END IF;

  IF to_regprocedure('public.tc_canonical_spec_key_v21_37_alias(text,text)') IS NULL
     OR to_regprocedure('public.tc_canonical_spec_class(text)') IS NULL
     OR to_regprocedure('public.tc_apply_spec_taxonomy()') IS NULL THEN
    RAISE EXCEPTION 'v21.42 preflight failed: required predecessor taxonomy functions are missing.';
  END IF;
END;
$preflight$;

-- 3) Add narrow, deterministic aliases while preserving v21.37 and earlier aliases.
CREATE OR REPLACE FUNCTION public.tc_canonical_spec_key_v21_42_alias(
  p_name text,
  p_evidence text DEFAULT NULL::text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
WITH x AS (
  SELECT regexp_replace(
    lower(trim(coalesce(p_name, ''))),
    '[^a-z0-9]+',
    ' ',
    'g'
  ) AS n
)
SELECT COALESCE(
  CASE
    -- Preserve the v21.38 dimension and maximum-speed aliases explicitly.
    -- The v21.37 fallback chain does not include that later alias function.
    WHEN n LIKE 'max length%'
      OR n LIKE 'maximum length%'
      THEN 'overall_length'
    WHEN n LIKE 'maximum traveling speed%'
      OR n LIKE 'maximum travelling speed%'
      OR n LIKE 'max traveling speed%'
      OR n LIKE 'max travelling speed%'
      THEN 'maximum_speed'
    WHEN n LIKE 'injection system%'
      OR n LIKE 'injection type%'
      OR n LIKE 'fuel injection system%'
      THEN 'fuel_injection_system'
    WHEN n LIKE 'max power%'
      OR n LIKE 'maximum power%'
      THEN 'engine_max_power'
    WHEN n LIKE 'power at rated engine speed%'
      THEN 'engine_rated_power'
    WHEN n LIKE 'with front tyre%'
      OR n LIKE 'with front tire%'
      THEN 'front_tire_size'
    WHEN n LIKE 'with rear tyre%'
      OR n LIKE 'with rear tire%'
      THEN 'rear_tire_size'
    WHEN n LIKE 'number of speeds%transmission%'
      THEN 'transmission_gear_configuration'
    ELSE NULL
  END,
  public.tc_canonical_spec_key_v21_37_alias(p_name, p_evidence)
)
FROM x;
$function$;

-- 4) Route inserts/updates through v21.42 first, retaining all legacy fallback behavior.
CREATE OR REPLACE FUNCTION public.tc_apply_spec_taxonomy()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_old_key text;
  v_new_key text;
  v_old_class text;
BEGIN
  v_new_key := public.tc_canonical_spec_key_v21_42_alias(NEW.spec_name, NEW.evidence_text);

  IF TG_OP = 'UPDATE' THEN
    v_old_key := public.tc_canonical_spec_key_v21_42_alias(OLD.spec_name, OLD.evidence_text);

    IF NEW.canonical_key IS NULL
       OR NEW.canonical_key IS NOT DISTINCT FROM v_old_key
    THEN
      NEW.canonical_key := v_new_key;
    END IF;

    v_old_class := public.tc_canonical_spec_class(v_old_key);

    IF NEW.comparison_class IS NULL
       OR NEW.comparison_class IS NOT DISTINCT FROM v_old_class
    THEN
      NEW.comparison_class := public.tc_canonical_spec_class(NEW.canonical_key);
    END IF;
  ELSE
    IF NEW.canonical_key IS NULL THEN
      NEW.canonical_key := v_new_key;
    END IF;
    IF NEW.comparison_class IS NULL THEN
      NEW.comparison_class := public.tc_canonical_spec_class(NEW.canonical_key);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5) Validate aliases before changing the audited records.
DO $alias_tests$
BEGIN
  IF public.tc_canonical_spec_key_v21_42_alias('Injection system') IS DISTINCT FROM 'fuel_injection_system'
     OR public.tc_canonical_spec_key_v21_42_alias('Injection type') IS DISTINCT FROM 'fuel_injection_system'
     OR public.tc_canonical_spec_key_v21_42_alias('Max. power') IS DISTINCT FROM 'engine_max_power'
     OR public.tc_canonical_spec_key_v21_42_alias('Power at rated engine speed') IS DISTINCT FROM 'engine_rated_power'
     OR public.tc_canonical_spec_key_v21_42_alias('With front tyre Size') IS DISTINCT FROM 'front_tire_size'
     OR public.tc_canonical_spec_key_v21_42_alias('With rear tyre') IS DISTINCT FROM 'rear_tire_size'
     OR public.tc_canonical_spec_key_v21_42_alias('Number of speeds - 5 gears transmission') IS DISTINCT FROM 'transmission_gear_configuration'
     OR public.tc_canonical_spec_key_v21_42_alias('Max. length') IS DISTINCT FROM 'overall_length'
     OR public.tc_canonical_spec_key_v21_42_alias('Maximum length') IS DISTINCT FROM 'overall_length'
     OR public.tc_canonical_spec_key_v21_42_alias('Maximum traveling speed') IS DISTINCT FROM 'maximum_speed'
     OR public.tc_canonical_spec_key_v21_42_alias('Maximum travelling speed') IS DISTINCT FROM 'maximum_speed'
     OR public.tc_canonical_spec_key_v21_42_alias('Max traveling speed') IS DISTINCT FROM 'maximum_speed'
     OR public.tc_canonical_spec_key_v21_42_alias('Max travelling speed') IS DISTINCT FROM 'maximum_speed' THEN
    RAISE EXCEPTION 'v21.42 alias test failed. No finding rows have been changed.';
  END IF;

  IF public.tc_canonical_spec_class('fuel_injection_system') IS DISTINCT FROM 'engine'
     OR public.tc_canonical_spec_class('engine_max_power') IS DISTINCT FROM 'engine'
     OR public.tc_canonical_spec_class('engine_rated_power') IS DISTINCT FROM 'engine'
     OR public.tc_canonical_spec_class('front_tire_size') IS DISTINCT FROM 'tires'
     OR public.tc_canonical_spec_class('rear_tire_size') IS DISTINCT FROM 'tires'
     OR public.tc_canonical_spec_class('transmission_gear_configuration') IS DISTINCT FROM 'transmission' THEN
    RAISE EXCEPTION 'v21.42 class test failed. No finding rows have been changed.';
  END IF;
END;
$alias_tests$;

-- 6) Update only the 18 exact findings listed above. The trigger will enforce
--    the same canonical key/class and all review statuses remain pending.
UPDATE public.ai_research_findings f
SET canonical_key = t.new_canonical_key,
    comparison_class = t.new_comparison_class
FROM tc_v2142_targets t
WHERE f.id = t.finding_id
  AND f.tractor_id = t.tractor_id
  AND f.run_id = t.run_id
  AND f.proposed_model_name = t.model_name
  AND f.spec_name = t.spec_name
  AND f.spec_value = t.spec_value
  AND f.unit IS NOT DISTINCT FROM t.unit
  AND f.page_number = t.page_number
  AND f.source_url = t.source_url
  AND f.canonical_key IS NOT DISTINCT FROM t.old_canonical_key
  AND f.comparison_class = t.old_comparison_class
  AND f.review_status = 'pending'
  AND f.inserted_spec_id IS NULL;

-- 7) Abort the entire transaction if anything differs from the expected state.
DO $postflight$
DECLARE
  v_target_count integer;
  v_unmapped_count integer;
  v_s_count integer;
  v_v_count integer;
  v_s_pending integer;
  v_v_pending integer;
BEGIN
  SELECT count(*) INTO v_target_count
  FROM tc_v2142_targets t
  JOIN public.ai_research_findings f ON f.id = t.finding_id
  WHERE f.tractor_id = t.tractor_id
    AND f.run_id = t.run_id
    AND f.canonical_key = t.new_canonical_key
    AND f.comparison_class = t.new_comparison_class
    AND f.review_status = 'pending'
    AND f.inserted_spec_id IS NULL;

  IF v_target_count <> 18 THEN
    RAISE EXCEPTION 'v21.42 postflight failed: % of 18 target findings have expected taxonomy/pending state.', v_target_count;
  END IF;

  SELECT count(*) INTO v_unmapped_count
  FROM public.ai_research_findings
  WHERE run_id IN (
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
    AND (canonical_key IS NULL OR comparison_class = 'other');

  IF v_unmapped_count <> 0 THEN
    RAISE EXCEPTION 'v21.42 postflight failed: % S/V findings still have a null canonical key or other class.', v_unmapped_count;
  END IF;

  SELECT count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid),
         count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid AND review_status = 'pending'),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid AND review_status = 'pending')
  INTO v_s_count, v_v_count, v_s_pending, v_v_pending
  FROM public.ai_research_findings
  WHERE run_id IN (
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  );

  IF v_s_count <> 56 OR v_s_pending <> 56 OR v_v_count <> 57 OR v_v_pending <> 57 THEN
    RAISE EXCEPTION 'v21.42 postflight failed: unexpected S/V total or review-status count.';
  END IF;
END;
$postflight$;

COMMIT;

-- 8) Final read-only confirmation.
SELECT
  proposed_model_name AS model,
  count(*) AS findings_total,
  count(*) FILTER (WHERE review_status = 'pending') AS pending_findings,
  count(*) FILTER (WHERE canonical_key IS NULL) AS missing_canonical_keys,
  count(*) FILTER (WHERE comparison_class = 'other') AS other_class_findings
FROM public.ai_research_findings
WHERE run_id IN (
  '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
  '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
)
GROUP BY proposed_model_name
ORDER BY proposed_model_name;
