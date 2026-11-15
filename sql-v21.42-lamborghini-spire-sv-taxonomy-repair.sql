-- TractorCompare AI v21.42
-- Lamborghini Spire S/V taxonomy repair.
-- Exactly 18 audited pending rows are normalized. One composite S injection cell is split.
-- F Target is untouched. Nothing is approved or published.
-- Transaction aborts unless all expected IDs/values/pages/statuses match.

BEGIN;

DO $migration$
DECLARE
  v_updated integer := 0;
  v_inserted integer := 0;
  v_pending_count integer := 0;
  v_run_updated integer := 0;
  v_meta_type text;
  v_run_meta jsonb;
  v_run_summary text;
BEGIN
  PERFORM 1
  FROM public.ai_research_findings
  WHERE id = ANY (ARRAY[
    '1a2026a9-348b-45f4-91d7-efd89ed0f7bd',
    '8cbb1c5d-18c6-4377-9f60-02f7c624336c',
    'bfcad029-d550-44ce-8c09-5c3e6e01cc89',
    'ad3addb7-1c31-4260-9b80-a7a625e1d95b',
    'd3dc1f16-b6c8-4a45-a9e0-09609db745a4',
    '89466039-0123-4d09-ae6e-6d7386b18154',
    'd4bf3eab-c0a1-42b4-a995-fb32a193931e',
    '1de5cb39-38e3-49f5-9c24-d174cb26ba1c',
    '4ed765cf-0a46-4128-a817-81d15c0cf8ba',
    'cc8a15cd-37de-4d7b-ae24-489aec6f6c5b',
    '64716e79-5c28-41a0-8494-df25915485c6',
    'eca82457-b6ce-456a-b027-7df02a5980f4',
    '420c724b-4f42-4d09-9364-fe94799be356',
    'c495b976-d388-445c-9299-b356412983aa',
    'b8825f0b-7605-467f-86fb-902b6aeb2954',
    'f7f8ed79-f23c-470c-96f0-6975d6672200',
    '5a39cd16-4040-4e38-9226-e1968853f5e8',
    'd7ddae54-61b2-49d0-9263-b5a95dcd9d0c'
  ]::uuid[])
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.ai_research_findings
    WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid
      AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid
      AND canonical_key = 'engine_fuel_system'
      AND spec_value = 'Common Rail'
      AND unit IS NULL
      AND page_number = 6
      AND review_status <> 'rejected'
  ) THEN
    RAISE EXCEPTION 'v21.42 stopped: S Target Common Rail finding already exists. Inspect current rows; no changes committed.';
  END IF;

  WITH repair (
    id, expected_run_id, expected_tractor_id, expected_page,
    old_name, old_value, old_unit, old_key, old_class,
    new_name, new_value, new_unit, new_key, new_class
  ) AS (
    VALUES
      ('1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Injection system', 'Common Rail @ 2000 bar', NULL::text, NULL::text, 'other',
       'Engine injection pressure', '2000', 'bar', 'engine_injection_pressure', 'engine'),
      ('8cbb1c5d-18c6-4377-9f60-02f7c624336c'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Max. power', '76', 'HP', NULL::text, 'other',
       'Maximum engine power', '76', 'HP', 'engine_max_power', 'engine'),
      ('bfcad029-d550-44ce-8c09-5c3e6e01cc89'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Max. power', '55.8', 'kW', NULL::text, 'other',
       'Maximum engine power', '55.8', 'kW', 'engine_max_power', 'engine'),
      ('ad3addb7-1c31-4260-9b80-a7a625e1d95b'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'With front tyre', '280/70 R18', NULL::text, NULL::text, 'other',
       'Front tire size', '280/70 R18', NULL::text, 'front_tire_size', 'tires'),
      ('d3dc1f16-b6c8-4a45-a9e0-09609db745a4'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'With rear tyre', '380/70 R28', NULL::text, NULL::text, 'other',
       'Rear tire size', '380/70 R28', NULL::text, 'rear_tire_size', 'tires'),
      ('89466039-0123-4d09-ae6e-6d7386b18154'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Power at rated engine speed', '55.2', 'kW', 'engine_rated_speed', 'engine',
       'Engine power at rated speed', '55.2', 'kW', 'engine_rated_power', 'engine'),
      ('d4bf3eab-c0a1-42b4-a995-fb32a193931e'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Power at rated engine speed', '75', 'HP', 'engine_rated_speed', 'engine',
       'Engine power at rated speed', '75', 'HP', 'engine_rated_power', 'engine'),
      ('1de5cb39-38e3-49f5-9c24-d174cb26ba1c'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission',
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission'),
      ('4ed765cf-0a46-4128-a817-81d15c0cf8ba'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission',
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission'),
      ('cc8a15cd-37de-4d7b-ae24-489aec6f6c5b'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Injection type', 'Common Rail', NULL::text, NULL::text, 'other',
       'Engine fuel system', 'Common Rail', NULL::text, 'engine_fuel_system', 'engine'),
      ('64716e79-5c28-41a0-8494-df25915485c6'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Max. power', '76', 'HP', NULL::text, 'other',
       'Maximum engine power', '76', 'HP', 'engine_max_power', 'engine'),
      ('eca82457-b6ce-456a-b027-7df02a5980f4'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Max. power', '55.8', 'kW', NULL::text, 'other',
       'Maximum engine power', '55.8', 'kW', 'engine_max_power', 'engine'),
      ('420c724b-4f42-4d09-9364-fe94799be356'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'With front tyre Size', '180/95 R16', NULL::text, NULL::text, 'other',
       'Front tire size', '180/95 R16', NULL::text, 'front_tire_size', 'tires'),
      ('c495b976-d388-445c-9299-b356412983aa'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'With rear tyre Size', '280/85 R24', NULL::text, NULL::text, 'other',
       'Rear tire size', '280/85 R24', NULL::text, 'rear_tire_size', 'tires'),
      ('b8825f0b-7605-467f-86fb-902b6aeb2954'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Power at rated engine speed', '55.2', 'kW', 'engine_rated_speed', 'engine',
       'Engine power at rated speed', '55.2', 'kW', 'engine_rated_power', 'engine'),
      ('f7f8ed79-f23c-470c-96f0-6975d6672200'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Power at rated engine speed', '75', 'HP', 'engine_rated_speed', 'engine',
       'Engine power at rated speed', '75', 'HP', 'engine_rated_power', 'engine'),
      ('5a39cd16-4040-4e38-9226-e1968853f5e8'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission',
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission'),
      ('d7ddae54-61b2-49d0-9263-b5a95dcd9d0c'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission',
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission')
  )
  UPDATE public.ai_research_findings AS f
  SET
    spec_name = r.new_name,
    spec_value = r.new_value,
    unit = r.new_unit,
    canonical_key = r.new_key,
    comparison_class = r.new_class,
    review_notes = concat_ws(
      E'\n',
      NULLIF(f.review_notes, ''),
      'v21.42 manual taxonomy repair; evidence/page retained; pending human review.'
    )
  FROM repair AS r
  WHERE f.id = r.id
    AND f.run_id = r.expected_run_id
    AND f.tractor_id = r.expected_tractor_id
    AND f.page_number = r.expected_page
    AND f.spec_name = r.old_name
    AND f.spec_value = r.old_value
    AND f.unit IS NOT DISTINCT FROM r.old_unit
    AND f.canonical_key IS NOT DISTINCT FROM r.old_key
    AND f.comparison_class = r.old_class
    AND f.review_status = 'pending'
    AND f.inserted_spec_id IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 18 THEN
    RAISE EXCEPTION 'v21.42 rolled back: expected exactly 18 audited findings; updated %.', v_updated;
  END IF;

  INSERT INTO public.ai_research_findings (
    run_id, tractor_id, document_id, spec_name, spec_value, unit,
    evidence_text, page_number, confidence, review_status, review_notes,
    created_tractor_id, created_at, canonical_key, comparison_class,
    measurement_standard, rated_rpm, source_url, proposed_market,
    proposed_variant, proposed_brand_name, proposed_model_name,
    proposed_model_year, comparison_note
  )
  SELECT
    src.run_id, src.tractor_id, src.document_id,
    'Engine fuel system', 'Common Rail', NULL,
    src.evidence_text, src.page_number, src.confidence, 'pending',
    'v21.42 manual atomic split from the official Spire S 80 Target page 6 cell; requires human approval.',
    src.created_tractor_id, now(), 'engine_fuel_system', 'engine',
    NULL, src.rated_rpm, src.source_url, src.proposed_market,
    src.proposed_variant, src.proposed_brand_name, src.proposed_model_name,
    src.proposed_model_year,
    'Split from source cell: Injection @ pressure Type Common Rail @ 2000 bar.'
  FROM public.ai_research_findings AS src
  WHERE src.id = '1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid
    AND src.run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid
    AND src.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid
    AND src.spec_name = 'Engine injection pressure'
    AND src.spec_value = '2000'
    AND src.unit = 'bar'
    AND src.canonical_key = 'engine_injection_pressure'
    AND src.comparison_class = 'engine'
    AND src.review_status = 'pending'
    AND src.inserted_spec_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.ai_research_findings AS already
      WHERE already.run_id = src.run_id
        AND already.tractor_id = src.tractor_id
        AND already.canonical_key = 'engine_fuel_system'
        AND already.spec_value = 'Common Rail'
        AND already.unit IS NULL
        AND already.page_number = 6
        AND already.review_status <> 'rejected'
    );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted <> 1 THEN
    RAISE EXCEPTION 'v21.42 rolled back: expected one S Target Engine fuel system finding; inserted %.', v_inserted;
  END IF;

  -- Keep the run-level audit counters aligned with the one manual atomic split.
  SELECT data_type INTO v_meta_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'ai_research_runs'
    AND column_name = 'result_meta';

  IF v_meta_type NOT IN ('json', 'jsonb') THEN
    RAISE EXCEPTION 'v21.42 rolled back: unsupported ai_research_runs.result_meta type: %.', v_meta_type;
  END IF;

  SELECT COALESCE(result_meta::jsonb, '{}'::jsonb)
    INTO v_run_meta
  FROM public.ai_research_runs
  WHERE id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid
    AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid
    AND status = 'completed'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'v21.42 rolled back: completed Spire S research run was not found for metadata synchronization.';
  END IF;

  v_run_meta := v_run_meta
    || jsonb_build_object(
      'findings_saved', 57,
      'pending_findings', 57,
      'manual_normalization', jsonb_build_object(
        'reason', 'The composite Injection system cell on official PDF page 6 was split into separate Engine fuel system and Engine injection pressure findings.',
        'performed', true,
        'additional_findings_created', 1,
        'all_findings_remain_pending', true,
        'published_or_written_to_tractor_specs', false
      ),
      'dedupe_diagnostics',
        COALESCE(v_run_meta -> 'dedupe_diagnostics', '{}'::jsonb)
        || jsonb_build_object(
          'persisted_findings_total', 57,
          'persisted_pending_findings', 57
        )
    );

  v_run_summary := 'Lamborghini Trattori Spire S 80 Target was verified against the official manufacturer PDF page 6. The original 56 extracted findings remain source-backed; one composite injection-system cell was manually split into two atomic pending findings, resulting in 57 pending findings. No specifications were approved or published.';

  IF v_meta_type = 'jsonb' THEN
    EXECUTE
      'UPDATE public.ai_research_runs SET result_meta = $1, summary = $2 '
      || 'WHERE id = $3 AND tractor_id = $4 AND status = ''completed'''
      USING v_run_meta, v_run_summary,
        '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
        'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid;
  ELSE
    EXECUTE
      'UPDATE public.ai_research_runs SET result_meta = $1::json, summary = $2 '
      || 'WHERE id = $3 AND tractor_id = $4 AND status = ''completed'''
      USING v_run_meta, v_run_summary,
        '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
        'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid;
  END IF;

  GET DIAGNOSTICS v_run_updated = ROW_COUNT;
  IF v_run_updated <> 1 THEN
    RAISE EXCEPTION 'v21.42 rolled back: expected exactly one Spire S run metadata update; got %.', v_run_updated;
  END IF;

  SELECT COUNT(*) INTO v_pending_count
  FROM public.ai_research_findings
  WHERE id = ANY (ARRAY[
    '1a2026a9-348b-45f4-91d7-efd89ed0f7bd',
    '8cbb1c5d-18c6-4377-9f60-02f7c624336c',
    'bfcad029-d550-44ce-8c09-5c3e6e01cc89',
    'ad3addb7-1c31-4260-9b80-a7a625e1d95b',
    'd3dc1f16-b6c8-4a45-a9e0-09609db745a4',
    '89466039-0123-4d09-ae6e-6d7386b18154',
    'd4bf3eab-c0a1-42b4-a995-fb32a193931e',
    '1de5cb39-38e3-49f5-9c24-d174cb26ba1c',
    '4ed765cf-0a46-4128-a817-81d15c0cf8ba',
    'cc8a15cd-37de-4d7b-ae24-489aec6f6c5b',
    '64716e79-5c28-41a0-8494-df25915485c6',
    'eca82457-b6ce-456a-b027-7df02a5980f4',
    '420c724b-4f42-4d09-9364-fe94799be356',
    'c495b976-d388-445c-9299-b356412983aa',
    'b8825f0b-7605-467f-86fb-902b6aeb2954',
    'f7f8ed79-f23c-470c-96f0-6975d6672200',
    '5a39cd16-4040-4e38-9226-e1968853f5e8',
    'd7ddae54-61b2-49d0-9263-b5a95dcd9d0c'
  ]::uuid[])
    AND review_status = 'pending'
    AND inserted_spec_id IS NULL
    AND canonical_key IS NOT NULL
    AND comparison_class <> 'other';

  IF v_pending_count <> 18 THEN
    RAISE EXCEPTION 'v21.42 rolled back: final pending-row check expected 18, got %.', v_pending_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ai_research_findings
    WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid
      AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid
      AND spec_name = 'Engine fuel system'
      AND spec_value = 'Common Rail'
      AND canonical_key = 'engine_fuel_system'
      AND comparison_class = 'engine'
      AND page_number = 6
      AND review_status = 'pending'
      AND inserted_spec_id IS NULL
  ) THEN
    RAISE EXCEPTION 'v21.42 rolled back: split Engine fuel system finding not verified.';
  END IF;

  RAISE NOTICE 'v21.42 complete: 18 findings normalized + 1 atomic S injection finding added; all remain pending; no publishing performed.';
END
$migration$;

COMMIT;

-- Read-only verification: finding distribution for the three exact runs.
SELECT
  t.model_name,
  f.review_status,
  f.comparison_class,
  f.canonical_key,
  COUNT(*) AS finding_count,
  COUNT(*) FILTER (WHERE f.canonical_key IS NULL) AS missing_key_count,
  COUNT(*) FILTER (WHERE f.comparison_class = 'other') AS other_class_count,
  COUNT(*) FILTER (WHERE f.inserted_spec_id IS NOT NULL) AS inserted_or_published_count
FROM public.ai_research_findings f
JOIN public.tractors t ON t.id = f.tractor_id
WHERE f.run_id IN (
  '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
  '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
  '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
)
GROUP BY t.model_name, f.review_status, f.comparison_class, f.canonical_key
ORDER BY t.model_name, f.review_status, f.comparison_class, f.canonical_key;

-- Read-only verification: all repaired records and their retained PDF evidence.
SELECT
  t.model_name,
  f.run_id,
  f.review_status,
  f.spec_name,
  f.spec_value,
  f.unit,
  f.canonical_key,
  f.comparison_class,
  f.measurement_standard,
  f.page_number,
  f.evidence_text
FROM public.ai_research_findings f
JOIN public.tractors t ON t.id = f.tractor_id
WHERE f.id IN (
  '1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid,
  '8cbb1c5d-18c6-4377-9f60-02f7c624336c'::uuid,
  'bfcad029-d550-44ce-8c09-5c3e6e01cc89'::uuid,
  'ad3addb7-1c31-4260-9b80-a7a625e1d95b'::uuid,
  'd3dc1f16-b6c8-4a45-a9e0-09609db745a4'::uuid,
  '89466039-0123-4d09-ae6e-6d7386b18154'::uuid,
  'd4bf3eab-c0a1-42b4-a995-fb32a193931e'::uuid,
  '1de5cb39-38e3-49f5-9c24-d174cb26ba1c'::uuid,
  '4ed765cf-0a46-4128-a817-81d15c0cf8ba'::uuid,
  'cc8a15cd-37de-4d7b-ae24-489aec6f6c5b'::uuid,
  '64716e79-5c28-41a0-8494-df25915485c6'::uuid,
  'eca82457-b6ce-456a-b027-7df02a5980f4'::uuid,
  '420c724b-4f42-4d09-9364-fe94799be356'::uuid,
  'c495b976-d388-445c-9299-b356412983aa'::uuid,
  'b8825f0b-7605-467f-86fb-902b6aeb2954'::uuid,
  'f7f8ed79-f23c-470c-96f0-6975d6672200'::uuid,
  '5a39cd16-4040-4e38-9226-e1968853f5e8'::uuid,
  'd7ddae54-61b2-49d0-9263-b5a95dcd9d0c'::uuid
)
ORDER BY t.model_name, f.canonical_key, f.spec_name, f.unit;

-- V queue synchronization diagnostic. Do not alter queue status in this data migration.
SELECT
  q.id AS queue_id,
  q.tractor_id,
  q.status AS queue_status,
  q.last_run_id,
  r.status AS research_run_status,
  q.last_error,
  q.next_attempt_at
FROM public.tractor_research_queue q
LEFT JOIN public.ai_research_runs r ON r.id = q.last_run_id
WHERE q.id = 'b914d47a-258c-45e3-85d3-2d8cb5b41e49'::uuid;
