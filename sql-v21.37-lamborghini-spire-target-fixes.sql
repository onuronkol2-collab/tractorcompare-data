-- TractorCompare AI v21.37 — Lamborghini Spire F/S/V Target audit correction
-- One transaction: taxonomy migration, F Target evidence normalization, queue reconciliation,
-- and safe split of the combined S/V catalog row into exact S and V model records.
-- No findings are approved or published. Existing Spire Target family record is preserved but paused.
-- Safe to re-run only while the preflight invariants below still match; the transaction rolls back on any mismatch.

BEGIN;

-- 1) Extend the existing canonical taxonomy without removing v21.32/v21.33 behavior.
CREATE OR REPLACE FUNCTION public.tc_canonical_spec_key_v21_37_alias(
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
        '[_-]+',
        ' ',
        'g'
    ) AS n
)
SELECT COALESCE(
    CASE
        WHEN n LIKE 'front tyre size%' OR n LIKE 'front tire size%'
            THEN 'front_tire_size'
        WHEN n LIKE 'rear tyre size%' OR n LIKE 'rear tire size%'
            THEN 'rear_tire_size'
        WHEN n LIKE 'height at bonnet%'
            THEN 'bonnet_height'
        WHEN n LIKE 'max length%' OR n LIKE 'maximum length%'
            THEN 'overall_length'
        WHEN n LIKE 'total height%'
            THEN 'overall_height'
        WHEN n LIKE 'total admissible load%'
            THEN 'total_admissible_load'
        WHEN n LIKE 'injection pressure%' OR n LIKE 'injection @ pressure%'
            THEN 'engine_injection_pressure'
        WHEN n LIKE 'engine power at rated speed%'
            THEN 'engine_rated_power'
        WHEN n LIKE 'open centre hydraulic system%'
          OR n LIKE 'open center hydraulic system%'
            THEN 'hydraulic_main_flow'
        WHEN n LIKE 'rear spool valves%'
            THEN 'hydraulic_remote_valve_count'
        WHEN n LIKE 'fuel tank capacity with additional%'
            THEN 'fuel_tank_capacity'
        WHEN n LIKE 'groundspeed pto%'
            THEN 'pto_ground_speed'
        WHEN n LIKE 'front pto 1000%'
            THEN 'front_pto_speed'
        WHEN n LIKE 'mechanical rear lift%'
          OR n LIKE 'electronic rear lift%'
            THEN 'rear_lift_control_type'
        WHEN n LIKE 'hydraulic right tie rod and stabilisers%'
            THEN 'hydraulic_stabilizers'
        WHEN n LIKE 'front lift%'
            THEN 'front_lift_capacity'
        WHEN n LIKE 'flow regulator%'
            THEN 'hydraulic_flow_regulator'
        WHEN n LIKE 'rear free return%'
            THEN 'hydraulic_rear_free_return'
        WHEN n LIKE 'mid mounted hydraulic ways%'
            THEN 'mid_mounted_hydraulic_ways'
        WHEN n LIKE 'mid mounted free return%'
            THEN 'mid_mounted_free_return'
        WHEN n LIKE '4 wheel braking%'
            THEN 'four_wheel_braking'
        WHEN n LIKE 'hydraulic trailer brake%'
            THEN 'hydraulic_trailer_brake'
        WHEN n LIKE 'electrohydraulic engagement for 4wd%'
            THEN 'front_axle_drive_and_diff_lock'
        WHEN n LIKE 'auto 4wd%'
            THEN 'automatic_four_wheel_drive'
        WHEN n LIKE 'independent steering pump%'
            THEN 'independent_steering_pump'
        WHEN n LIKE 'adaptive damping active self levelling functions%'
            THEN 'independent_front_suspension_features'
        WHEN n LIKE 'anti dive anti roll functions%'
            THEN 'suspension_safety_features'
        WHEN n LIKE 'differential traction control%'
            THEN 'differential_traction_control'
        WHEN n LIKE '4 post cab%'
            THEN 'cab_configuration'
        WHEN n LIKE 'driver seat with pneumatic suspension%'
            THEN 'operator_seat_suspension'
        WHEN n LIKE 'air conditioning%'
            THEN 'air_conditioning'
        WHEN n LIKE '4x halogen working lights%'
            THEN 'work_lights'
        WHEN n LIKE 'adjustable steering column%'
            THEN 'adjustable_steering_column'
        ELSE NULL
    END,
    public.tc_canonical_spec_key_v21_33_alias(p_name, p_evidence),
    public.tc_canonical_spec_key_v21_32_alias(p_name, p_evidence),
    public.tc_canonical_spec_key(p_name, p_evidence)
)
FROM x;
$function$;

-- Preserve the established v21.32 class taxonomy and add the two new dimension keys.
CREATE OR REPLACE FUNCTION public.tc_canonical_spec_class(p_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
SELECT CASE
    WHEN p_key IN (
        'front_axle_capacity',
        'engine_oil_capacity',
        'hydraulic_oil_capacity',
        'transmission_hydraulic_system_capacity',
        'transmission_oil_capacity'
    ) THEN 'capacities'

    WHEN p_key LIKE 'engine_%'
      OR p_key IN (
          'engine_power', 'engine_cylinders', 'engine_aspiration',
          'engine_emission_standard', 'cooling_system', 'fuel_injection_system'
      ) THEN 'engine'

    WHEN p_key LIKE 'transmission_%'
      OR p_key IN ('clutch_type', 'clutch_control', 'clutch_diameter', 'gear_shift_type')
        THEN 'transmission'

    WHEN p_key IN ('hydraulic_trailer_brake', 'four_wheel_braking')
        THEN 'brakes'

    WHEN p_key LIKE 'hydraulic_%'
      OR p_key IN (
          'front_lift_capacity', 'rear_lift_capacity', 'hydraulic_lift_capacity',
          'hydraulic_draft_control', 'steering_pump_flow', 'rear_lift_system_type',
          'implement_pump_flow', 'rear_hitch_category'
      ) THEN 'hydraulics'

    WHEN p_key LIKE 'pto_%' OR p_key = 'rear_pto_speed'
        THEN 'power_take_off'

    WHEN p_key IN (
        'drive_configuration', 'front_axle_drive', 'differential_lock',
        'differential_lock_rear', 'front_axle_drive_and_diff_lock',
        'automatic_four_wheel_drive', 'differential_traction_control'
    ) THEN 'powertrain'

    WHEN p_key LIKE '%brake%'
      OR p_key IN ('brake_control', 'four_wheel_braking')
        THEN 'brakes'

    WHEN p_key LIKE 'steering_%'
      OR p_key IN ('independent_steering_pump', 'adjustable_steering_column')
        THEN 'steering'

    WHEN p_key IN (
        'weight_kg', 'operating_weight', 'shipping_weight', 'weight_with_cab',
        'weight_with_rops', 'weight_with_air_cab', 'weight_with_protector_cab',
        'weight_with_redcab', 'weight_without_cab', 'base_machine_weight',
        'weight_range', 'wheelbase', 'ground_clearance', 'overall_length',
        'overall_width', 'overall_width_range', 'overall_height', 'track_width',
        'front_track_width', 'rear_track_width', 'turning_radius', 'seat_height',
        'power_to_weight_ratio', 'speed_range', 'bonnet_height',
        'total_admissible_load', 'independent_front_suspension_features',
        'suspension_safety_features'
    ) THEN 'dimensions_weights'

    WHEN p_key IN (
        'maximum_speed', 'forward_speed_range', 'maximum_road_speed', 'minimum_speed',
        'min_forward_speed', 'max_forward_speed'
    ) THEN 'performance'

    WHEN p_key IN (
        'fuel_tank_capacity', 'tank_capacity', 'adblue_tank_capacity',
        'engine_oil_capacity', 'coolant_capacity'
    ) THEN 'capacities'

    WHEN p_key IN ('battery_capacity', 'alternator', 'starter_motor_specification', 'work_lights')
        THEN 'electrical'

    WHEN p_key IN (
        'three_point_linkage_category', 'three_point_hitch_category',
        'top_link_type', 'tow_hook', 'tire_options'
    ) THEN 'implements'

    WHEN p_key IN ('front_tire_size', 'rear_tire_size')
        THEN 'tires'

    WHEN p_key IN ('rops_configuration', 'safety_features')
        THEN 'safety'

    WHEN p_key IN (
        'dashboard_features', 'seat_features', 'mirror_count',
        'cab_configuration', 'operator_seat_suspension', 'air_conditioning'
    ) THEN 'operator_station'

    ELSE 'other'
END;
$function$;

CREATE OR REPLACE FUNCTION public.tc_apply_spec_taxonomy()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_old_key text;
    v_new_key text;
    v_old_class text;
BEGIN
    v_new_key := COALESCE(
        public.tc_canonical_spec_key_v21_37_alias(NEW.spec_name, NEW.evidence_text),
        public.tc_canonical_spec_key_v21_33_alias(NEW.spec_name, NEW.evidence_text),
        public.tc_canonical_spec_key_v21_32_alias(NEW.spec_name, NEW.evidence_text),
        public.tc_canonical_spec_key(NEW.spec_name, NEW.evidence_text)
    );

    IF TG_OP = 'UPDATE' THEN
        v_old_key := COALESCE(
            public.tc_canonical_spec_key_v21_37_alias(OLD.spec_name, OLD.evidence_text),
            public.tc_canonical_spec_key_v21_33_alias(OLD.spec_name, OLD.evidence_text),
            public.tc_canonical_spec_key_v21_32_alias(OLD.spec_name, OLD.evidence_text),
            public.tc_canonical_spec_key(OLD.spec_name, OLD.evidence_text)
        );

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

DO $$
DECLARE
    v_count integer;
    v_total_findings integer;
    v_pending_findings integer;
    v_v_tractor_id uuid;
    v_source_notes text :=
      'Official Lamborghini Trattori Spire S/V 80 Target Stage V technical brochure. Exact model-to-table mapping: Spire S 80 Target = printed PDF page 6; Spire V 80 Target = printed PDF page 7. For Spire S 80 Target use only page 6. For Spire V 80 Target use only page 7. Never merge the S and V technical tables or use the F table for either model. Both records use this same official PDF but must retain separate model IDs and independent findings. Parenthetical fuel tank values are the capacities with front lift/PTO: main tank 55 (35) l; additional tank 85 (65) l. Extract both numbers as separate configuration-scoped findings. Decode the page legend: filled square = STD, empty square = OPT, dash = not available. All findings require human review.';
BEGIN
    -- Preflight 1: the successful F Target research must be complete and pinned to this exact record.
    SELECT COUNT(*) INTO v_count
    FROM public.ai_research_runs r
    WHERE r.id = '374814b4-22c5-47bc-a2b3-2045e718e733'
      AND r.status = 'completed'
      AND r.tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'
      AND r.result_meta->>'model_found' = 'true'
      AND r.result_meta->>'pinned_source_identity_verified' = 'true'
      AND r.result_meta->>'matched_tractor_id' = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'
      AND (r.result_meta->>'findings_saved')::integer = 31;

    IF v_count <> 1 THEN
        RAISE EXCEPTION 'F Target successful run validation failed; no business-data changes were made.';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM public.ai_research_findings f
    WHERE f.run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'
      AND f.tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'
      AND f.review_status = 'pending';

    IF v_count <> 31 THEN
        RAISE EXCEPTION 'Expected exactly 31 pending F Target findings, found %; no business-data changes were made.', v_count;
    END IF;

    -- Preflight 2: exact F/S-V catalog rows and existing queues must match the inspected audit.
    SELECT COUNT(*) INTO v_count
    FROM public.tractors t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE b.name = 'Lamborghini Trattori'
      AND (
        (t.id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37' AND t.model_name = 'Spire F Target')
        OR
        (t.id = 'f9a68e93-5534-40b7-891f-ba0249fe25db' AND t.model_name = 'Spire S/V Target')
        OR
        (t.id = '239bb110-07e3-4257-a967-56f7018ecd66' AND t.model_name = 'Spire Target')
      );

    IF v_count <> 3 THEN
        RAISE EXCEPTION 'Lamborghini Spire catalog IDs/names changed since audit; no business-data changes were made.';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM public.tractor_research_queue q
    WHERE (q.id = '1ac9a3c9-550d-433f-a2b4-fcb55237d6b7'
           AND q.tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'
           AND q.status = 'retry'
           AND q.last_run_id = '16731bde-2b2c-4864-a25f-252316ef5576')
       OR (q.id = '8f407f35-9112-4338-81ee-d1d9436b186d'
           AND q.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
           AND q.status = 'queued'
           AND q.last_run_id IS NULL)
       OR (q.tractor_id = '239bb110-07e3-4257-a967-56f7018ecd66'
           AND q.status = 'queued');

    IF v_count <> 3 THEN
        RAISE EXCEPTION 'Expected F, S/V and generic Spire queue states no longer match audit; no business-data changes were made.';
    END IF;

    -- Do not split a record if any data has been attached since the audit.
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT 1
        FROM public.tractor_specs s
        WHERE s.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
        UNION ALL
        SELECT 1
        FROM public.ai_research_findings f
        WHERE f.tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
    ) x;

    IF v_count <> 0 THEN
        RAISE EXCEPTION 'S/V combined record now has specs or findings; manual reconciliation is required before splitting.';
    END IF;

    -- Avoid creating duplicate exact S/V catalog rows.
    SELECT COUNT(*) INTO v_count
    FROM public.tractors t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE b.name = 'Lamborghini Trattori'
      AND t.model_name IN ('Spire S 80 Target', 'Spire V 80 Target');

    IF v_count <> 0 THEN
        RAISE EXCEPTION 'An exact Spire S or V record already exists; duplicate-safe reconciliation is required.';
    END IF;

    -- Confirm the exact official S/V PDF source exists once.
    SELECT COUNT(*) INTO v_count
    FROM public.data_sources
    WHERE publisher = 'Lamborghini Trattori'
      AND source_url = 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8';

    IF v_count <> 1 THEN
        RAISE EXCEPTION 'Expected exactly one official S/V PDF source row; no business-data changes were made.';
    END IF;

    -- 2) Fix canonical taxonomy on the existing 31 F findings.
    -- Values are assigned explicitly so pre-existing 'other' classifications are corrected as well.
    UPDATE public.ai_research_findings f
    SET
        spec_name = f.spec_name,
        evidence_text = f.evidence_text,
        canonical_key = public.tc_canonical_spec_key_v21_37_alias(f.spec_name, f.evidence_text),
        comparison_class = public.tc_canonical_spec_class(
            public.tc_canonical_spec_key_v21_37_alias(f.spec_name, f.evidence_text)
        ),
        measurement_standard = CASE
            WHEN f.id = 'f4c4bf24-562a-421a-8233-f8351675f706'
                THEN 'Without front lift/PTO'
            WHEN f.id = '0668eaf2-8d99-4fb3-808a-44019402bf76'
                THEN 'Additional fuel tank; without front lift/PTO'
            WHEN f.spec_name ILIKE 'Open centre hydraulic system flow (STD)'
                THEN 'Standard configuration'
            WHEN f.spec_name ILIKE 'Open centre hydraulic system flow (OPT)'
                THEN 'Optional double-pump configuration'
            WHEN f.spec_name ILIKE 'Rear spool valves (STD)'
                THEN 'Standard configuration'
            ELSE f.measurement_standard
        END
    WHERE f.run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'
      AND f.tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'
      AND f.review_status = 'pending';

    -- 3) Split the two parenthetical fuel capacities into separate configuration-scoped pending findings.
    INSERT INTO public.ai_research_findings (
        run_id, document_id, tractor_id,
        proposed_brand_name, proposed_model_name, proposed_model_year, proposed_variant, proposed_market,
        spec_name, spec_value, unit, evidence_text, page_number, confidence,
        review_status, review_notes, created_tractor_id, created_at,
        canonical_key, comparison_class, measurement_standard, rated_rpm, source_url
    )
    SELECT
        f.run_id, f.document_id, f.tractor_id,
        f.proposed_brand_name, f.proposed_model_name, f.proposed_model_year, f.proposed_variant, f.proposed_market,
        'Fuel tank capacity', '35', 'l',
        'Fuel tank capacity (with front lift/PTO) l 55 (35) — parenthetical value is the front lift/PTO configuration.',
        5, f.confidence, 'pending',
        'Manually separated from the manufacturer capacity row. Parenthetical 35 l is retained as a distinct front lift/PTO configuration; requires human approval.',
        f.created_tractor_id, now(),
        'fuel_tank_capacity', 'capacities', 'With front lift/PTO', NULL, f.source_url
    FROM public.ai_research_findings f
    WHERE f.id = 'f4c4bf24-562a-421a-8233-f8351675f706'
      AND NOT EXISTS (
        SELECT 1 FROM public.ai_research_findings x
        WHERE x.run_id = f.run_id
          AND x.tractor_id = f.tractor_id
          AND x.canonical_key = 'fuel_tank_capacity'
          AND x.spec_value = '35'
          AND x.unit = 'l'
          AND x.measurement_standard = 'With front lift/PTO'
          AND x.review_status <> 'rejected'
      );

    INSERT INTO public.ai_research_findings (
        run_id, document_id, tractor_id,
        proposed_brand_name, proposed_model_name, proposed_model_year, proposed_variant, proposed_market,
        spec_name, spec_value, unit, evidence_text, page_number, confidence,
        review_status, review_notes, created_tractor_id, created_at,
        canonical_key, comparison_class, measurement_standard, rated_rpm, source_url
    )
    SELECT
        f.run_id, f.document_id, f.tractor_id,
        f.proposed_brand_name, f.proposed_model_name, f.proposed_model_year, f.proposed_variant, f.proposed_market,
        'Fuel tank capacity with additional tank', '75', 'l',
        'Fuel tanks capacity with additional fuel tank (with front lift/PTO) l 95 (75) — parenthetical value is the front lift/PTO configuration.',
        5, f.confidence, 'pending',
        'Manually separated from the manufacturer additional-tank capacity row. Parenthetical 75 l is retained as a distinct front lift/PTO configuration; requires human approval.',
        f.created_tractor_id, now(),
        'fuel_tank_capacity', 'capacities', 'Additional fuel tank; with front lift/PTO', NULL, f.source_url
    FROM public.ai_research_findings f
    WHERE f.id = '0668eaf2-8d99-4fb3-808a-44019402bf76'
      AND NOT EXISTS (
        SELECT 1 FROM public.ai_research_findings x
        WHERE x.run_id = f.run_id
          AND x.tractor_id = f.tractor_id
          AND x.canonical_key = 'fuel_tank_capacity'
          AND x.spec_value = '75'
          AND x.unit = 'l'
          AND x.measurement_standard = 'Additional fuel tank; with front lift/PTO'
          AND x.review_status <> 'rejected'
      );

    -- Keep the family/model badge in the name, but make the numeric comparison field match the printed max power.
    -- Keep the catalog's existing 80 HP model designation intact.
    -- Exact manufacturer output (76 HP maximum / 75 HP at rated speed) remains in separate pending findings.
    UPDATE public.tractors
    SET variant = NULL,
        updated_at = now()
    WHERE id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'
      AND model_name = 'Spire F Target';

    -- 4) Reconcile the F Target queue with its actually successful verified run,
    -- rather than allowing it to poll the earlier failed run 16731...
    UPDATE public.tractor_research_queue
    SET status = 'completed',
        last_run_id = '374814b4-22c5-47bc-a2b3-2045e718e733',
        last_error = NULL,
        completed_at = now(),
        updated_at = now()
    WHERE id = '1ac9a3c9-550d-433f-a2b4-fcb55237d6b7'
      AND tractor_id = '0c8f654d-3651-401c-8f7a-0e5d488e1b37'
      AND status = 'retry'
      AND last_run_id = '16731bde-2b2c-4864-a25f-252316ef5576';

    -- 5) Split the empty combined S/V draft into two distinct exact catalog models.
    -- Existing S/V queue ID stays attached to the S record.
    UPDATE public.tractors
    SET model_name = 'Spire S 80 Target',
        variant = NULL,
        updated_at = now()
    WHERE id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
      AND model_name = 'Spire S/V Target';

    INSERT INTO public.tractors (
        brand_id, model_name, model_year, variant, market, status,
        horsepower, engine, weight_kg, drivetrain, transmission,
        created_at, updated_at
    )
    SELECT
        t.brand_id, 'Spire V 80 Target', t.model_year, NULL, t.market, 'draft',
        t.horsepower, t.engine, t.weight_kg, t.drivetrain, t.transmission,
        now(), now()
    FROM public.tractors t
    WHERE t.id = 'f9a68e93-5534-40b7-891f-ba0249fe25db'
      AND t.model_name = 'Spire S 80 Target'
    RETURNING id INTO v_v_tractor_id;

    IF v_v_tractor_id IS NULL THEN
        RAISE EXCEPTION 'Could not create the distinct Spire V 80 Target catalog row.';
    END IF;

    -- The registered PDF now explicitly names both exact model/page identities.
    UPDATE public.data_sources
    SET source_type = 'official_technical_pdf',
        source_priority = 100,
        notes = v_source_notes,
        accessed_at = now()
    WHERE publisher = 'Lamborghini Trattori'
      AND source_url = 'https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8';

    -- Preserve the existing S queue row and reset it only for its now-exact page-6 model.
    UPDATE public.tractor_research_queue
    SET status = 'queued',
        priority = 15,
        last_run_id = NULL,
        last_error = 'Exact Spire S 80 Target identity. Use only the dedicated S table on printed PDF page 6; never merge F or V values.',
        next_attempt_at = now(),
        completed_at = NULL,
        updated_at = now()
    WHERE id = '8f407f35-9112-4338-81ee-d1d9436b186d'
      AND tractor_id = 'f9a68e93-5534-40b7-891f-ba0249fe25db';

    -- Add one independent queue job for V, with a lower urgency than S (priority ASC).
    INSERT INTO public.tractor_research_queue (
        tractor_id, status, priority, attempt_count, max_attempts,
        last_run_id, last_error, next_attempt_at, completed_at, created_at, updated_at
    )
    VALUES (
        v_v_tractor_id, 'queued', 16, 0, 30,
        NULL,
        'Exact Spire V 80 Target identity. Use only the dedicated V table on printed PDF page 7; never merge F or S values.',
        now(), NULL, now(), now()
    );

    -- The old broad family-level Spire Target item has one existing spec; preserve it untouched,
    -- but prevent a family-level page from being claimed as if it were an exact model.
    UPDATE public.tractors
    SET variant = NULL, updated_at = now()
    WHERE id = '239bb110-07e3-4257-a967-56f7018ecd66'
      AND model_name = 'Spire Target';

    UPDATE public.tractor_research_queue
    SET status = 'needs_source',
        last_run_id = NULL,
        last_error = 'Paused: generic Spire Target family-level catalog row is ambiguous. Exact F, S and V models are tracked separately; do not research or publish this generic row until a distinct official model identity is established.',
        completed_at = NULL,
        updated_at = now()
    WHERE tractor_id = '239bb110-07e3-4257-a967-56f7018ecd66'
      AND id = 'a1c4a5d2-c172-4ca7-bd9d-0a5ee7c8709b';

    -- 6) Reconcile the F run's persisted counters after the two manual configuration splits.
    SELECT COUNT(*) INTO v_total_findings
    FROM public.ai_research_findings
    WHERE run_id = '374814b4-22c5-47bc-a2b3-2045e718e733';

    SELECT COUNT(*) INTO v_pending_findings
    FROM public.ai_research_findings
    WHERE run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'
      AND review_status = 'pending';

    UPDATE public.ai_research_runs
    SET
        summary = 'Spire F Target was verified against the official product page and the dedicated F 80 Target technical table. The original 31 extracted findings were taxonomy-normalized; two parenthetical fuel-tank configuration values were split into separate pending findings. All findings remain pending human review; none were published or written to tractor_specs.',
        result_meta = jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    coalesce(result_meta, '{}'::jsonb),
                                    '{findings_saved}', to_jsonb(v_total_findings), true
                                ),
                                '{pending_findings}', to_jsonb(v_pending_findings), true
                            ),
                            '{dedupe_diagnostics,persisted_findings_total}', to_jsonb(v_total_findings), true
                        ),
                        '{dedupe_diagnostics,persisted_pending_findings}', to_jsonb(v_pending_findings), true
                    ),
                    '{dedupe_diagnostics,newly_inserted_findings}', to_jsonb(v_total_findings), true
                ),
                '{confidence_diagnostics,persisted_count}', to_jsonb(v_total_findings), true
            ),
            '{manual_normalization}',
            jsonb_build_object(
                'performed', true,
                'reason', 'Parenthetical fuel-tank capacity values were preserved as separate configuration-specific findings; taxonomy aliases for the official Lamborghini table labels were normalized.',
                'additional_findings_created', 2,
                'all_findings_remain_pending', true,
                'published_or_written_to_tractor_specs', false
            ),
            true
        )
    WHERE id = '374814b4-22c5-47bc-a2b3-2045e718e733';

    -- Final transaction assertions.
    IF v_total_findings <> 33 OR v_pending_findings <> 33 THEN
        RAISE EXCEPTION 'Expected 33 pending F findings after parenthetical split; found total %, pending %.', v_total_findings, v_pending_findings;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.ai_research_findings
        WHERE run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'
          AND review_status <> 'pending'
    ) THEN
        RAISE EXCEPTION 'A finding is no longer pending; refusing to commit.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.tractor_research_queue
        WHERE id = '1ac9a3c9-550d-433f-a2b4-fcb55237d6b7'
          AND NOT (status = 'completed' AND last_run_id = '374814b4-22c5-47bc-a2b3-2045e718e733')
    ) THEN
        RAISE EXCEPTION 'F Target queue did not reconcile to the successful run.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.tractor_research_queue q
        JOIN public.tractors t ON t.id = q.tractor_id
        WHERE t.model_name = 'Spire S/V Target'
    ) THEN
        RAISE EXCEPTION 'The combined S/V model name still exists after split.';
    END IF;
END;
$$;

COMMIT;

-- Verification report: F run counts, canonical classes and configuration-split values.
SELECT
    f.comparison_class,
    f.review_status,
    COUNT(*) AS finding_count,
    COUNT(*) FILTER (WHERE f.canonical_key IS NULL) AS missing_canonical_key_count,
    COUNT(*) FILTER (WHERE f.page_number IS NULL) AS missing_page_count,
    COUNT(*) FILTER (WHERE f.evidence_text IS NULL OR BTRIM(f.evidence_text) = '') AS missing_evidence_count
FROM public.ai_research_findings f
WHERE f.run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'
GROUP BY f.comparison_class, f.review_status
ORDER BY f.comparison_class, f.review_status;

SELECT
    f.spec_name, f.spec_value, f.unit, f.measurement_standard,
    f.canonical_key, f.comparison_class, f.page_number, f.evidence_text
FROM public.ai_research_findings f
WHERE f.run_id = '374814b4-22c5-47bc-a2b3-2045e718e733'
  AND f.canonical_key = 'fuel_tank_capacity'
ORDER BY f.measurement_standard, f.spec_value;

-- Verification report: exact model rows and isolated queues.
SELECT
    b.name AS brand, t.id AS tractor_id, t.model_name, t.horsepower, t.variant,
    t.market, t.status AS tractor_status,
    q.id AS queue_id, q.status AS queue_status, q.priority,
    q.last_run_id, q.last_error
FROM public.tractors t
JOIN public.brands b ON b.id = t.brand_id
LEFT JOIN public.tractor_research_queue q ON q.tractor_id = t.id
WHERE b.name = 'Lamborghini Trattori'
  AND t.model_name IN ('Spire F Target', 'Spire S 80 Target', 'Spire V 80 Target', 'Spire Target')
ORDER BY q.priority ASC, t.model_name;
