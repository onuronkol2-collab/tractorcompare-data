-- TractorCompare AI v21.42 rollback
-- Run ONLY if the v21.42 migration was successfully committed and you explicitly need to revert it.
-- Exact pre-state/post-state guards protect against overwriting subsequent human edits.
-- This rollback restores the 18 changed findings and S run metadata, then deletes only the
-- one uniquely fingerprinted pending Common Rail split row created by v21.42.
-- It never touches tractor_specs or published specifications.

BEGIN;

DO $rollback$
DECLARE
  v_updated integer := 0;
  v_deleted integer := 0;
  v_run_updated integer := 0;
  v_meta_type text;
  v_run_meta jsonb;
  v_run_summary text;
  v_current_summary text;
BEGIN
  -- Lock the completed S research run and require the exact v21.42 post-state.
  SELECT data_type INTO v_meta_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'ai_research_runs'
    AND column_name = 'result_meta';

  IF v_meta_type IS NULL OR v_meta_type NOT IN ('json', 'jsonb') THEN
    RAISE EXCEPTION 'Rollback stopped: unsupported ai_research_runs.result_meta type: %.', v_meta_type;
  END IF;

  SELECT COALESCE(result_meta::jsonb, '{}'::jsonb), summary
    INTO v_run_meta, v_current_summary
  FROM public.ai_research_runs
  WHERE id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid
    AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid
    AND status = 'completed'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rollback stopped: Spire S completed research run was not found.';
  END IF;

  IF v_current_summary <> 'Lamborghini Trattori Spire S 80 Target was verified against the official manufacturer PDF page 6. The original 56 extracted findings remain source-backed; one composite injection-system cell was manually split into two atomic pending findings, resulting in 57 pending findings. No specifications were approved or published.'
     OR v_run_meta ->> 'findings_saved' <> '57'
     OR v_run_meta ->> 'pending_findings' <> '57'
     OR v_run_meta ->> 'atomic_specifications' <> '61'
     OR COALESCE(v_run_meta #>> '{manual_normalization,additional_findings_created}', '') <> '1'
  THEN
    RAISE EXCEPTION 'Rollback stopped: S run metadata no longer matches the exact v21.42 post-state.';
  END IF;

  -- Lock exact finding rows to be restored.
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

  -- Remove exactly the additional pending Common Rail field created by v21.42.
  DELETE FROM public.ai_research_findings
  WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid
    AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid
    AND document_id = '4516c2fc-28d7-4144-a40e-82bcd3986b8f'::uuid
    AND spec_name = 'Engine fuel system'
    AND spec_value = 'Common Rail'
    AND unit IS NULL
    AND canonical_key = 'engine_fuel_system'
    AND comparison_class = 'engine'
    AND page_number = 6
    AND review_status = 'pending'
    AND inserted_spec_id IS NULL
    AND comparison_note = 'Split from source cell: Injection @ pressure Type Common Rail @ 2000 bar.';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted <> 1 THEN
    RAISE EXCEPTION 'Rollback stopped: expected to delete exactly one v21.42 split finding; deleted %.', v_deleted;
  END IF;

  WITH restore_rows (
    id, expected_run_id, expected_tractor_id, expected_page,
    new_name, new_value, new_unit, new_key, new_class,
    old_name, old_value, old_unit, old_key, old_class
  ) AS (
    VALUES
      ('1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Engine injection pressure', '2000', 'bar', 'engine_injection_pressure', 'engine',
       'Injection system', 'Common Rail @ 2000 bar', NULL::text, NULL::text, 'other'),
      ('8cbb1c5d-18c6-4377-9f60-02f7c624336c'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Maximum engine power', '76', 'HP', 'engine_max_power', 'engine',
       'Max. power', '76', 'HP', NULL::text, 'other'),
      ('bfcad029-d550-44ce-8c09-5c3e6e01cc89'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Maximum engine power', '55.8', 'kW', 'engine_max_power', 'engine',
       'Max. power', '55.8', 'kW', NULL::text, 'other'),
      ('ad3addb7-1c31-4260-9b80-a7a625e1d95b'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Front tire size', '280/70 R18', NULL::text, 'front_tire_size', 'tires',
       'With front tyre', '280/70 R18', NULL::text, NULL::text, 'other'),
      ('d3dc1f16-b6c8-4a45-a9e0-09609db745a4'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Rear tire size', '380/70 R28', NULL::text, 'rear_tire_size', 'tires',
       'With rear tyre', '380/70 R28', NULL::text, NULL::text, 'other'),
      ('89466039-0123-4d09-ae6e-6d7386b18154'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Engine power at rated speed', '55.2', 'kW', 'engine_rated_power', 'engine',
       'Power at rated engine speed', '55.2', 'kW', 'engine_rated_speed', 'engine'),
      ('d4bf3eab-c0a1-42b4-a995-fb32a193931e'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Engine power at rated speed', '75', 'HP', 'engine_rated_power', 'engine',
       'Power at rated engine speed', '75', 'HP', 'engine_rated_speed', 'engine'),
      ('1de5cb39-38e3-49f5-9c24-d174cb26ba1c'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission',
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission'),
      ('4ed765cf-0a46-4128-a817-81d15c0cf8ba'::uuid, '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid, 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid, 6,
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission',
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission'),
      ('cc8a15cd-37de-4d7b-ae24-489aec6f6c5b'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Engine fuel system', 'Common Rail', NULL::text, 'engine_fuel_system', 'engine',
       'Injection type', 'Common Rail', NULL::text, NULL::text, 'other'),
      ('64716e79-5c28-41a0-8494-df25915485c6'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Maximum engine power', '76', 'HP', 'engine_max_power', 'engine',
       'Max. power', '76', 'HP', NULL::text, 'other'),
      ('eca82457-b6ce-456a-b027-7df02a5980f4'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Maximum engine power', '55.8', 'kW', 'engine_max_power', 'engine',
       'Max. power', '55.8', 'kW', NULL::text, 'other'),
      ('420c724b-4f42-4d09-9364-fe94799be356'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Front tire size', '180/95 R16', NULL::text, 'front_tire_size', 'tires',
       'With front tyre Size', '180/95 R16', NULL::text, NULL::text, 'other'),
      ('c495b976-d388-445c-9299-b356412983aa'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Rear tire size', '280/85 R24', NULL::text, 'rear_tire_size', 'tires',
       'With rear tyre Size', '280/85 R24', NULL::text, NULL::text, 'other'),
      ('b8825f0b-7605-467f-86fb-902b6aeb2954'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Engine power at rated speed', '55.2', 'kW', 'engine_rated_power', 'engine',
       'Power at rated engine speed', '55.2', 'kW', 'engine_rated_speed', 'engine'),
      ('f7f8ed79-f23c-470c-96f0-6975d6672200'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Engine power at rated speed', '75', 'HP', 'engine_rated_power', 'engine',
       'Power at rated engine speed', '75', 'HP', 'engine_rated_speed', 'engine'),
      ('5a39cd16-4040-4e38-9226-e1968853f5e8'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission',
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission'),
      ('d7ddae54-61b2-49d0-9263-b5a95dcd9d0c'::uuid, '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid, '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid, 7,
       'Transmission gear configuration', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_gear_configuration', 'transmission',
       'Number of speeds - 5 gears transmission', '30+15 (with mechanical splitter) or 45+45 (with HML 3-Powershift steps)', NULL::text, 'transmission_type', 'transmission')
  )
  UPDATE public.ai_research_findings AS f
  SET
    spec_name = r.old_name,
    spec_value = r.old_value,
    unit = r.old_unit,
    canonical_key = r.old_key,
    comparison_class = r.old_class,
    review_notes = NULLIF(
      regexp_replace(
        f.review_notes,
        E'\\n?v21\\.42 manual taxonomy repair; evidence/page retained; pending human review\\.$',
        ''
      ),
      ''
    )
  FROM restore_rows AS r
  WHERE f.id = r.id
    AND f.run_id = r.expected_run_id
    AND f.tractor_id = r.expected_tractor_id
    AND f.page_number = r.expected_page
    AND f.spec_name = r.new_name
    AND f.spec_value = r.new_value
    AND f.unit IS NOT DISTINCT FROM r.new_unit
    AND f.canonical_key = r.new_key
    AND f.comparison_class = r.new_class
    AND f.review_status = 'pending'
    AND f.inserted_spec_id IS NULL
    AND f.review_notes LIKE '%v21.42 manual taxonomy repair; evidence/page retained; pending human review.';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 18 THEN
    RAISE EXCEPTION 'Rollback stopped: expected to restore exactly 18 v21.42 rows; restored %.', v_updated;
  END IF;

  -- Restore S run counters and the original audit summary.
  v_run_meta := (v_run_meta - 'manual_normalization')
    || jsonb_build_object(
      'findings_saved', 56,
      'pending_findings', 56,
      'atomic_specifications', 60,
      'dedupe_diagnostics',
        COALESCE(v_run_meta -> 'dedupe_diagnostics', '{}'::jsonb)
        || jsonb_build_object(
          'persisted_findings_total', 56,
          'persisted_pending_findings', 56
        )
    );

  v_run_summary := 'Lamborghini Trattori Spire S 80 Target resmî kaynaklarda doğrulandı. 56 ham aday 60 karşılaştırılabilir teknik alana ayrıştırıldı; 0 teknik özellik güvenli biçimde eklendi/güncellendi, 0 yayımlanmış modele işlendi, 56 bulgu incelemede kaldı. Traktörün model durumu değiştirilmedi.';

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
    RAISE EXCEPTION 'Rollback stopped: expected one S run metadata restore; got %.', v_run_updated;
  END IF;

  RAISE NOTICE 'v21.42 rollback complete: 18 findings restored, one split row removed, S run counters and summary restored. Nothing was published by either script.';
END
$rollback$;

COMMIT;

-- Read-only rollback verification.
SELECT
  t.model_name,
  f.review_status,
  f.comparison_class,
  f.canonical_key,
  COUNT(*) AS finding_count,
  COUNT(*) FILTER (WHERE f.canonical_key IS NULL) AS missing_key_count,
  COUNT(*) FILTER (WHERE f.comparison_class = 'other') AS other_class_count
FROM public.ai_research_findings f
JOIN public.tractors t ON t.id = f.tractor_id
WHERE f.run_id IN (
  '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
  '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
)
GROUP BY t.model_name, f.review_status, f.comparison_class, f.canonical_key
ORDER BY t.model_name, f.review_status, f.comparison_class, f.canonical_key;
