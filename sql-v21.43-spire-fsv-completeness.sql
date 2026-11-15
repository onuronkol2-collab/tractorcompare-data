-- TractorCompare AI v21.43
-- Full-page technical coverage and field normalization for Lamborghini Spire F/S/V 80 Target.
-- Based on the official manufacturer tables:
--   F: official PDF 7987, printed page 5
--   S: official PDF 7988, printed page 6
--   V: official PDF 7988, printed page 7
--
-- Adds the 23 missing F-page equipment/options findings and Common Rail injection type,
-- splits S's combined Common Rail @ 2000 bar into type + pressure, and normalizes
-- option capacities, PTO speed values, and the maximum-speed footnote.
--
-- No tractor catalog field, queue state, published spec, or approved finding is changed.
-- Run exactly once. The exact-ID preflight aborts if the current database no longer
-- matches the audited state. All changes are transactional and all findings remain pending.

BEGIN;

CREATE TEMP TABLE tc_v2143_new_findings ON COMMIT DROP AS
SELECT *
FROM (VALUES
  -- 24 additions for Spire F Target (all sourced from its exact official PDF, page 5).
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target'::text, 'Injection type'::text, 'Common Rail'::text, NULL::text, 'Injection @ pressure Type Common Rail @ 2000 bar'::text, 5::integer, 'fuel_injection_system'::text, 'engine'::text, NULL::text),

  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Four-wheel braking', 'Standard', NULL, '4 wheel braking ■ (STD)', 5, 'four_wheel_braking', 'brakes', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Hydraulic trailer brake', 'Optional', NULL, 'Hydraulic trailer brake □ (OPT)', 5, 'hydraulic_trailer_brake', 'brakes', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Independent front suspension features', 'Standard', NULL, 'INDEPENDENT FRONT SUSPENDED AXLE (OPT) Adaptive-Damping, Active Self-Levelling functions ■ (STD)', 5, 'independent_front_suspension_features', 'dimensions_weights', 'Standard within optional Independent Front Suspended Axle package'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Anti-dive and anti-roll functions', 'Standard', NULL, 'INDEPENDENT FRONT SUSPENDED AXLE (OPT) Anti-Dive, Anti-Roll functions ■ (STD)', 5, 'suspension_safety_features', 'dimensions_weights', 'Standard within optional Independent Front Suspended Axle package'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Halogen working lights', 'Standard', NULL, '4x Halogen working lights ■ (STD)', 5, 'work_lights', 'electrical', 'Equipment availability'),

  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Front lift capacity', '1500', 'kg', 'Front lift (1500 kg) □ (OPT)', 5, 'front_lift_capacity', 'hydraulics', 'Optional equipment'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Hydraulic flow regulator', 'Standard', NULL, 'Flow regulator ■ (STD)', 5, 'hydraulic_flow_regulator', 'hydraulics', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Rear free return', 'Standard', NULL, 'Rear free return ■ (STD)', 5, 'hydraulic_rear_free_return', 'hydraulics', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Hydraulic right tie rod and stabilisers', 'Optional', NULL, 'Hydraulic right tie rod and stabilisers □ (OPT)', 5, 'hydraulic_stabilizers', 'hydraulics', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Mid-mounted free return', 'Optional', NULL, 'Mid-mounted free return □ (OPT)', 5, 'mid_mounted_free_return', 'hydraulics', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Mid-mounted hydraulic ways', '2/4', 'n° of ways', 'Mid-mounted hydraulic ways - duplicated from rear (OPT) n° of ways 2/4', 5, 'mid_mounted_hydraulic_ways', 'hydraulics', 'Optional equipment'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Electronic rear lift', 'Optional', NULL, 'Electronic rear lift □ (OPT)', 5, 'rear_lift_control_type', 'hydraulics', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Mechanical rear lift', 'Standard', NULL, 'Mechanical rear lift ■ (STD)', 5, 'rear_lift_control_type', 'hydraulics', 'Equipment availability'),

  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Air conditioning', 'Optional', NULL, 'Air conditioning □ (OPT)', 5, 'air_conditioning', 'operator_station', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Four-post cab', 'Standard', NULL, '4-post cab ■ (STD)', 5, 'cab_configuration', 'operator_station', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Driver seat suspension', 'Standard', NULL, 'Driver seat with pneumatic suspension ■ (STD)', 5, 'operator_seat_suspension', 'operator_station', 'Equipment availability'),

  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Front PTO speed', '1000', 'rpm', 'Front PTO 1000 □ (OPT)', 5, 'front_pto_speed', 'power_take_off', 'Optional equipment'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Groundspeed PTO', 'Optional', NULL, 'Groundspeed PTO □ (OPT)', 5, 'pto_ground_speed', 'power_take_off', 'Equipment availability'),

  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Automatic four-wheel drive', 'Optional', NULL, 'Auto 4WD □ (OPT)', 5, 'automatic_four_wheel_drive', 'powertrain', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Differential traction control', 'Standard', NULL, 'INDEPENDENT FRONT SUSPENDED AXLE (OPT) Differential Traction Control (DTC) ■ (STD)', 5, 'differential_traction_control', 'powertrain', 'Standard within optional Independent Front Suspended Axle package'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Electrohydraulic 4WD and differential lock engagement', 'Standard', NULL, 'Electrohydraulic engagement for 4WD and Diff.Lock ■ (STD)', 5, 'front_axle_drive_and_diff_lock', 'powertrain', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Adjustable steering column', 'Standard', NULL, 'Adjustable steering column ■ (STD)', 5, 'adjustable_steering_column', 'steering', 'Equipment availability'),
  ('f4c4bf24-562a-421a-8233-f8351675f706'::uuid, 'Spire F Target', 'Independent steering pump', 'Standard', NULL, 'Independent steering pump ■ (STD)', 5, 'independent_steering_pump', 'steering', 'Equipment availability'),

  -- One missing S injection-pressure finding; the existing S combined value is split below.
  ('1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid, 'Spire S 80 Target', 'Engine injection pressure', '2000', 'bar', 'Injection @ pressure Type Common Rail @ 2000 bar', 6, 'engine_injection_pressure', 'engine', NULL)
) AS v(
  template_finding_id, model_name, spec_name, spec_value, unit, evidence_text,
  page_number, canonical_key, comparison_class, measurement_standard
);

-- 25 unique additions expected: 24 for F and one for S.
DO $preflight$
DECLARE
  v_count integer;
  v_f_pending integer;
  v_s_pending integer;
  v_v_pending integer;
  v_f_total integer;
  v_s_total integer;
  v_v_total integer;
BEGIN
  SELECT count(*) INTO v_count FROM tc_v2143_new_findings;
  IF v_count <> 25 THEN
    RAISE EXCEPTION 'v21.43 manifest mismatch: expected 25 additions, found %.', v_count;
  END IF;

  -- Runs and exact tractor identities must all remain completed and pinned.
  SELECT count(*) INTO v_count
  FROM public.ai_research_runs r
  WHERE (r.id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid AND r.status = 'completed' AND r.tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'::uuid)
     OR (r.id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid AND r.status = 'completed' AND r.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid)
     OR (r.id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid AND r.status = 'completed' AND r.tractor_id = '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid);

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'v21.43 preflight failed: one or more F/S/V runs are not completed against their exact tractor IDs.';
  END IF;

  -- Catalog records must remain the expected draft models.
  SELECT count(*) INTO v_count
  FROM public.tractors t
  JOIN public.brands b ON b.id = t.brand_id
  WHERE b.name = 'Lamborghini Trattori'
    AND t.status = 'draft'
    AND t.horsepower = 80
    AND (
      (t.id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'::uuid AND t.model_name = 'Spire F Target')
      OR
      (t.id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid AND t.model_name = 'Spire S 80 Target')
      OR
      (t.id = '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid AND t.model_name = 'Spire V 80 Target')
    );

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'v21.43 preflight failed: catalog records, draft status, or 80 designation changed.';
  END IF;

  -- Exact queue states must all be completed, including the just-reconciled V queue.
  SELECT count(*) INTO v_count
  FROM public.tractor_research_queue q
  WHERE (q.id = '1ac9a3c9-550d-433f-a2b4-fcb55237d6b7'::uuid AND q.tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'::uuid AND q.status = 'completed' AND q.last_run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid)
     OR (q.id = '8f407f35-9112-4338-81ee-d1d9436b186d'::uuid AND q.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid AND q.status = 'completed' AND q.last_run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid)
     OR (q.id = 'b914d47a-258c-45e3-85d3-2d8cb5b41e49'::uuid AND q.tractor_id = '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid AND q.status = 'completed' AND q.last_run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid);

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'v21.43 preflight failed: exact F/S/V queue rows are not all completed.';
  END IF;

  SELECT count(*) FILTER (WHERE run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid),
         count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid),
         count(*) FILTER (WHERE run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid AND review_status = 'pending'),
         count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid AND review_status = 'pending'),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid AND review_status = 'pending')
  INTO v_f_total, v_s_total, v_v_total, v_f_pending, v_s_pending, v_v_pending
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  );

  IF v_f_total <> 33 OR v_f_pending <> 33 OR v_s_total <> 56 OR v_s_pending <> 56 OR v_v_total <> 57 OR v_v_pending <> 57 THEN
    RAISE EXCEPTION 'v21.43 preflight failed: current F/S/V total/pending counts are %,%, %,%, %,%; expected 33/33, 56/56, 57/57.', v_f_total, v_f_pending, v_s_total, v_s_pending, v_v_total, v_v_pending;
  END IF;

  -- No pre-existing findings may have null canonical keys or other class after v21.42.
  IF EXISTS (
    SELECT 1 FROM public.ai_research_findings
    WHERE run_id IN (
      '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
      '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
      '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
    )
      AND (canonical_key IS NULL OR comparison_class = 'other')
  ) THEN
    RAISE EXCEPTION 'v21.43 preflight failed: a prior F/S/V finding has an unmapped canonical key or other class.';
  END IF;

  -- Template rows must be pending and pinned to the expected PDF pages/documents.
  IF NOT EXISTS (
    SELECT 1 FROM public.ai_research_findings
    WHERE id = 'f4c4bf24-562a-421a-8233-f8351675f706'::uuid
      AND run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid
      AND tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'::uuid
      AND document_id = '469a8954-bd86-47a6-95a2-f225a881bdae'::uuid
      AND source_url = 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7987_d432d453ca77b6271f17857f0d842cd0'
      AND page_number = 5 AND review_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'v21.43 preflight failed: exact F PDF page-5 template missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ai_research_findings
    WHERE id = '1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid
      AND run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid
      AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid
      AND document_id = '4516c2fc-28d7-4144-a40e-82bcd3986b8f'::uuid
      AND source_url = 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8'
      AND page_number = 6 AND spec_value = 'Common Rail @ 2000 bar'
      AND review_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'v21.43 preflight failed: exact S combined injection finding missing or changed.';
  END IF;

  -- Existing values that will be normalized must still match the original v21.41 audit.
  IF (SELECT count(*) FROM public.ai_research_findings
      WHERE id IN (
        '48d6d9a7-899a-4ffb-b52b-7d831a4c7894'::uuid,
        '6b2d73f5-8b89-423b-964f-e2acf0873350'::uuid
      )
        AND spec_name = 'Front lift capacity' AND spec_value = 'Optional'
        AND review_status = 'pending') <> 2 THEN
    RAISE EXCEPTION 'v21.43 preflight failed: S/V front-lift rows differ from the audit.';
  END IF;

  IF (SELECT count(*) FROM public.ai_research_findings
      WHERE id IN (
        'e2afaecd-1618-4ca7-8026-b7994c27dd70'::uuid,
        'c3040de8-a29b-44c3-9b5a-487949d04fcd'::uuid
      )
        AND spec_name = 'Front PTO speed' AND spec_value = 'Optional'
        AND review_status = 'pending') <> 2 THEN
    RAISE EXCEPTION 'v21.43 preflight failed: S/V front PTO rows differ from the audit.';
  END IF;

  IF (SELECT count(*) FROM public.ai_research_findings
      WHERE id IN (
        '3b14719d-9fe1-4d61-b103-980c2b600446'::uuid,
        '7ae53124-a51e-4ea5-beed-f47d3706a40b'::uuid
      )
        AND spec_name = 'Mid-mounted hydraulic ways' AND spec_value = '2/4'
        AND measurement_standard IS NULL AND review_status = 'pending') <> 2 THEN
    RAISE EXCEPTION 'v21.43 preflight failed: S/V mid-mounted hydraulic way rows differ from the audit.';
  END IF;

  -- There must be no exact duplicate of any proposed new finding.
  IF EXISTS (
    SELECT 1
    FROM tc_v2143_new_findings n
    JOIN public.ai_research_findings t ON t.id = n.template_finding_id
    JOIN public.ai_research_findings f
      ON f.run_id = t.run_id
     AND f.tractor_id = t.tractor_id
     AND f.spec_name = n.spec_name
     AND f.spec_value = n.spec_value
     AND f.unit IS NOT DISTINCT FROM n.unit
     AND f.page_number = n.page_number
     AND f.canonical_key = n.canonical_key
     AND f.measurement_standard IS NOT DISTINCT FROM n.measurement_standard
     AND f.review_status <> 'rejected'
  ) THEN
    RAISE EXCEPTION 'v21.43 preflight failed: at least one proposed row already exists. No rows changed.';
  END IF;
END;
$preflight$;

-- 2) Insert 24 missing F technical/equipment rows and the S injection-pressure row.
INSERT INTO public.ai_research_findings (
  run_id, document_id, tractor_id,
  proposed_brand_name, proposed_model_name, proposed_model_year, proposed_variant, proposed_market,
  spec_name, spec_value, unit, evidence_text, page_number, confidence,
  review_status, review_notes, created_tractor_id, created_at,
  canonical_key, comparison_class, measurement_standard, rated_rpm,
  source_url, comparison_note
)
SELECT
  t.run_id, t.document_id, t.tractor_id,
  t.proposed_brand_name, t.proposed_model_name, t.proposed_model_year, t.proposed_variant, t.proposed_market,
  n.spec_name, n.spec_value, n.unit, n.evidence_text, n.page_number, t.confidence,
  'pending',
  'Manually transcribed from the exact official Lamborghini Trattori technical table page. STD/OPT marking and any optional package scope are preserved. Requires human review; not approved or published.',
  t.created_tractor_id, now(),
  n.canonical_key, n.comparison_class, n.measurement_standard, NULL,
  t.source_url, NULL
FROM tc_v2143_new_findings n
JOIN public.ai_research_findings t ON t.id = n.template_finding_id;

-- 3) Split S's combined injection field into comparable type and pressure values.
UPDATE public.ai_research_findings
SET spec_name = 'Injection type',
    spec_value = 'Common Rail',
    unit = NULL,
    review_notes = 'Split from the source row "Injection @ pressure Type Common Rail @ 2000 bar". The type remains here; a separate pending 2000 bar pressure finding was added from the same evidence. Requires human review.'
WHERE id = '1a2026a9-348b-45f4-91d7-efd89ed0f7bd'::uuid
  AND review_status = 'pending';

-- Normalize F's injection-pressure display label to match S/V while retaining its key/value.
UPDATE public.ai_research_findings
SET spec_name = 'Engine injection pressure',
    review_notes = 'Canonical display label aligned with the other Spire F/S/V findings; source value and evidence are unchanged.'
WHERE id = '0a049f71-e6e0-4ce4-aa42-c09f62982b14'::uuid
  AND spec_name = 'Injection pressure'
  AND review_status = 'pending';

-- 4) Preserve the explicit capacities hidden in the availability-only S/V findings.
UPDATE public.ai_research_findings
SET spec_value = '1500',
    unit = 'kg',
    measurement_standard = 'Optional equipment',
    review_notes = 'The manufacturer table specifies a 1500 kg front lift and marks it OPT. Numeric capacity and optional availability are both preserved.'
WHERE id IN (
  '48d6d9a7-899a-4ffb-b52b-7d831a4c7894'::uuid,
  '6b2d73f5-8b89-423b-964f-e2acf0873350'::uuid
)
  AND review_status = 'pending';

UPDATE public.ai_research_findings
SET spec_value = '1000',
    unit = 'rpm',
    measurement_standard = 'Optional equipment',
    review_notes = 'The manufacturer table specifies a 1000 rpm front PTO and marks it OPT. Numeric speed and optional availability are both preserved.'
WHERE id IN (
  'e2afaecd-1618-4ca7-8026-b7994c27dd70'::uuid,
  'c3040de8-a29b-44c3-9b5a-487949d04fcd'::uuid
)
  AND review_status = 'pending';

UPDATE public.ai_research_findings
SET measurement_standard = 'Optional equipment',
    review_notes = 'The manufacturer table labels the mid-mounted hydraulic ways as OPT; the 2/4-way quantity is retained.'
WHERE id IN (
  '3b14719d-9fe1-4d61-b103-980c2b600446'::uuid,
  '7ae53124-a51e-4ea5-beed-f47d3706a40b'::uuid
)
  AND review_status = 'pending';

-- The three V subfeatures are standard inside the optional independent suspended-axle package.
UPDATE public.ai_research_findings
SET measurement_standard = 'Standard within optional Independent Front Suspended Axle package',
    review_notes = 'The package heading is OPT; the individual feature row is marked STD. This is standard only within the optional package.'
WHERE id IN (
  'c8d6880b-9138-47bb-9be0-151550ff5ea2'::uuid,
  '52b45fc1-c522-4249-b5ff-673fc3de9f75'::uuid,
  '3464192a-9af0-463d-9e0e-e80c13332648'::uuid
)
  AND review_status = 'pending';

-- 5) Retain the common maximum-speed footnote as structured comparison context.
-- The asterisk is a footnote marker, not part of the speed value.
UPDATE public.ai_research_findings
SET spec_value = '40 ECO',
    comparison_note = 'Engine rpm at maximum speed varies according to rear tyre size.',
    review_notes = 'The source asterisk is retained as a structured footnote; 40 ECO remains the comparable speed value.'
WHERE id IN (
  '11d042cc-c34b-40c0-a4d3-9146618cad6d'::uuid,
  '28e656af-2b6f-45cf-8dcc-ce96e4f56ede'::uuid,
  '290359bf-226e-4354-866c-b70b3fae7229'::uuid,
  '3cff61fb-42aa-4a44-918d-4cf0aa025ba5'::uuid,
  '62e1c218-89a0-4fd4-b398-7f6e101aa65c'::uuid,
  'b0fdac06-3df4-4968-b2a1-8a7d6d309c9e'::uuid
)
  AND review_status = 'pending';

-- 6) Reconcile research metadata to the manually normalized pending finding totals.
UPDATE public.ai_research_runs r
SET result_meta = COALESCE(r.result_meta, '{}'::jsonb)
  || jsonb_build_object(
       'findings_saved', 57,
       'pending_findings', 57,
       'manual_normalization',
         COALESCE(r.result_meta->'manual_normalization', '{}'::jsonb)
         || jsonb_build_object(
              'performed', true,
              'reason', 'Official page-level transcription completed missing technical/equipment fields and split compound source values into comparable pending findings. No specification was published.',
              'additional_findings_created', 26,
              'all_findings_remain_pending', true,
              'published_or_written_to_tractor_specs', false
            ),
       'dedupe_diagnostics',
         COALESCE(r.result_meta->'dedupe_diagnostics', '{}'::jsonb)
         || jsonb_build_object(
              'newly_inserted_findings', 57,
              'persisted_findings_total', 57,
              'persisted_pending_findings', 57,
              'persisted_duplicate_findings', 0
            ),
       'confidence_diagnostics',
         COALESCE(r.result_meta->'confidence_diagnostics', '{}'::jsonb)
         || jsonb_build_object('persisted_count', 57)
     )
WHERE r.id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid;

UPDATE public.ai_research_runs r
SET result_meta = COALESCE(r.result_meta, '{}'::jsonb)
  || jsonb_build_object(
       'findings_saved', 57,
       'pending_findings', 57,
       'manual_normalization',
         COALESCE(r.result_meta->'manual_normalization', '{}'::jsonb)
         || jsonb_build_object(
              'performed', true,
              'reason', 'The combined Common Rail @ 2000 bar source row was separated into injection type and injection pressure findings, both retaining the exact official PDF evidence and page reference.',
              'additional_findings_created', 1,
              'all_findings_remain_pending', true,
              'published_or_written_to_tractor_specs', false
            ),
       'dedupe_diagnostics',
         COALESCE(r.result_meta->'dedupe_diagnostics', '{}'::jsonb)
         || jsonb_build_object(
              'newly_inserted_findings', 57,
              'persisted_findings_total', 57,
              'persisted_pending_findings', 57,
              'persisted_duplicate_findings', 0
            ),
       'confidence_diagnostics',
         COALESCE(r.result_meta->'confidence_diagnostics', '{}'::jsonb)
         || jsonb_build_object('persisted_count', 57)
     )
WHERE r.id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid;

-- 7) Transaction assertions: every model must have exactly 57 pending, mapped findings.
DO $postflight$
DECLARE
  v_f integer;
  v_s integer;
  v_v integer;
  v_f_pending integer;
  v_s_pending integer;
  v_v_pending integer;
  v_unmapped integer;
  v_injection integer;
  v_front_lift integer;
  v_front_pto integer;
  v_speed_notes integer;
  v_torque integer;
BEGIN
  SELECT count(*) FILTER (WHERE run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid),
         count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid),
         count(*) FILTER (WHERE run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid AND review_status = 'pending'),
         count(*) FILTER (WHERE run_id = '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid AND review_status = 'pending'),
         count(*) FILTER (WHERE run_id = '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid AND review_status = 'pending')
  INTO v_f, v_s, v_v, v_f_pending, v_s_pending, v_v_pending
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  );

  IF v_f <> 57 OR v_s <> 57 OR v_v <> 57
     OR v_f_pending <> 57 OR v_s_pending <> 57 OR v_v_pending <> 57 THEN
    RAISE EXCEPTION 'v21.43 postflight failed: F/S/V totals/pending %,%,%; expected 57/57 each.', v_f, v_s, v_v;
  END IF;

  SELECT count(*) INTO v_unmapped
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
    AND (canonical_key IS NULL OR comparison_class = 'other');

  IF v_unmapped <> 0 THEN
    RAISE EXCEPTION 'v21.43 postflight failed: % findings have missing keys or other class.', v_unmapped;
  END IF;

  -- Each model must have separate Common Rail type and 2000 bar pressure records.
  SELECT count(*) INTO v_injection
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
    AND (
      (canonical_key = 'fuel_injection_system' AND spec_value = 'Common Rail')
      OR
      (canonical_key = 'engine_injection_pressure' AND spec_value = '2000' AND unit = 'bar')
    )
    AND review_status = 'pending';

  IF v_injection <> 6 THEN
    RAISE EXCEPTION 'v21.43 postflight failed: expected six comparable injection type/pressure rows, found %.', v_injection;
  END IF;

  SELECT count(*) INTO v_front_lift
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
    AND canonical_key = 'front_lift_capacity'
    AND spec_value = '1500' AND unit = 'kg'
    AND measurement_standard = 'Optional equipment'
    AND review_status = 'pending';

  IF v_front_lift <> 3 THEN
    RAISE EXCEPTION 'v21.43 postflight failed: expected three 1500 kg optional front-lift rows, found %.', v_front_lift;
  END IF;

  SELECT count(*) INTO v_front_pto
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
    AND canonical_key = 'front_pto_speed'
    AND spec_value = '1000' AND unit = 'rpm'
    AND measurement_standard = 'Optional equipment'
    AND review_status = 'pending';

  IF v_front_pto <> 3 THEN
    RAISE EXCEPTION 'v21.43 postflight failed: expected three optional 1000 rpm front PTO rows, found %.', v_front_pto;
  END IF;

  SELECT count(*) INTO v_speed_notes
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
    AND canonical_key = 'maximum_speed'
    AND spec_value = '40 ECO'
    AND comparison_note = 'Engine rpm at maximum speed varies according to rear tyre size.'
    AND review_status = 'pending';

  IF v_speed_notes <> 6 THEN
    RAISE EXCEPTION 'v21.43 postflight failed: expected six maximum-speed notes, found %.', v_speed_notes;
  END IF;

  SELECT count(*) INTO v_torque
  FROM public.ai_research_findings
  WHERE run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
    AND canonical_key = 'engine_torque'
    AND spec_value = '341' AND unit = 'Nm'
    AND rated_rpm = 1500
    AND review_status = 'pending';

  IF v_torque <> 3 THEN
    RAISE EXCEPTION 'v21.43 postflight failed: expected three 341 Nm @ 1500 rpm torque findings, found %.', v_torque;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.ai_research_findings
    WHERE run_id IN (
      '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
      '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
      '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
    )
      AND (review_status <> 'pending' OR inserted_spec_id IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'v21.43 postflight failed: a finding is not pending or has been attached to a published spec.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tractor_research_queue
    WHERE id IN (
      '1ac9a3c9-550d-433f-a2b4-fcb55237d6b7'::uuid,
      '8f407f35-9112-4338-81ee-d1d9436b186d'::uuid,
      'b914d47a-258c-45e3-85d3-2d8cb5b41e49'::uuid
    )
      AND status <> 'completed'
  ) THEN
    RAISE EXCEPTION 'v21.43 postflight failed: an F/S/V queue state changed.';
  END IF;
END;
$postflight$;

COMMIT;

-- 8) Read-only final verification.
SELECT
  t.model_name AS model,
  t.horsepower AS catalog_designation_hp,
  count(f.id) AS findings_total,
  count(f.id) FILTER (WHERE f.review_status = 'pending') AS pending_findings,
  count(f.id) FILTER (WHERE f.canonical_key IS NULL) AS missing_canonical_keys,
  count(f.id) FILTER (WHERE f.comparison_class = 'other') AS other_class_findings,
  count(f.id) FILTER (WHERE f.inserted_spec_id IS NOT NULL) AS linked_or_published_findings
FROM public.tractors t
JOIN public.brands b ON b.id = t.brand_id
LEFT JOIN public.ai_research_findings f ON f.tractor_id = t.id
  AND f.run_id IN (
    '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
    '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
    '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
  )
WHERE b.name = 'Lamborghini Trattori'
  AND t.id IN (
    '0c8f654d-3651-401c-8f7a-0e5d488e1b37'::uuid,
    'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid,
    '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid
  )
GROUP BY t.id, t.model_name, t.horsepower
ORDER BY t.model_name;

SELECT
  proposed_model_name AS model,
  spec_name, spec_value, unit, rated_rpm,
  canonical_key, comparison_class, measurement_standard,
  page_number, review_status, comparison_note
FROM public.ai_research_findings
WHERE run_id IN (
  '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
  '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
  '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid
)
  AND (
    canonical_key IN ('fuel_injection_system','engine_injection_pressure','engine_max_power','engine_rated_power','engine_torque','front_lift_capacity','front_pto_speed','maximum_speed')
    OR spec_name ILIKE '%driver seat%'
  )
ORDER BY proposed_model_name, canonical_key, spec_name, spec_value;
