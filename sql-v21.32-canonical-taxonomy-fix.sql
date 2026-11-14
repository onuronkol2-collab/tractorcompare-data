-- TractorCompare AI v21.32 — targeted canonical-key aliases and taxonomy fallback
-- Safe to re-run. This migration changes function definitions only; it does NOT
-- UPDATE, DELETE, approve, publish, or otherwise rewrite existing finding rows.

BEGIN;

CREATE OR REPLACE FUNCTION public.tc_canonical_spec_key_v21_32_alias(
    p_name text,
    p_evidence text DEFAULT NULL::text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
WITH x AS (
    SELECT
        regexp_replace(
            lower(trim(coalesce(p_name, ''))),
            '[_-]+',
            ' ',
            'g'
        ) AS n,
        lower(coalesce(p_evidence, '')) AS e
)
SELECT CASE
    -- Turn-radius labels must be caught BEFORE the legacy generic "%brake%"
    -- branch, otherwise "Minimum turn radius with brakes" becomes brake_type.
    WHEN n LIKE '%turn radius%'
      OR n LIKE '%turning radius%'
        THEN 'turning_radius'

    -- Keep the three hydraulic flow circuits separate; broad legacy hydraulic
    -- flow rules must not collapse them into hydraulic_main_flow.
    WHEN n LIKE '%implement hydraulic flow%'
      OR n LIKE '%implement flow%'
      OR n LIKE '%implement pump flow%'
      OR n LIKE '%implement qow%'
        THEN 'hydraulic_implement_flow'

    WHEN n LIKE '%steering hydraulic flow%'
      OR n LIKE '%steering flow%'
      OR n LIKE '%steering qow%'
        THEN 'hydraulic_steering_flow'

    WHEN n LIKE '%total hydraulic flow%'
      OR n LIKE '%total flow%'
      OR n LIKE '%total qow%'
        THEN 'hydraulic_total_flow'

    WHEN n LIKE '%hydraulic pump type%'
      OR n = 'pump type'
        THEN 'hydraulic_pump_type'

    WHEN n LIKE '%rear remote valve%'
      OR n LIKE '%standard remote valve%'
      OR n LIKE '%hydraulic remote valve%'
        THEN 'hydraulic_remote_valve_count'

    WHEN n LIKE '%3 point hitch category%'
      OR n LIKE '%three point hitch category%'
      OR n LIKE '%3 point linkage category%'
      OR n LIKE '%three point linkage category%'
      OR n LIKE '%category 3 point hitch%'
        THEN 'three_point_linkage_category'

    WHEN n LIKE '%coolant capacity%'
        THEN 'coolant_capacity'

    WHEN n LIKE '%crankcase oil capacity%'
      OR n LIKE '%crankcase capacity%'
        THEN 'engine_oil_capacity'

    -- Front axle capacity is fluid capacity, not front axle drive configuration.
    WHEN n LIKE '%front axle fluid capacity%'
      OR n = 'front axle capacity'
        THEN 'front_axle_capacity'

    -- This must precede the legacy broad transmission -> transmission_type rule.
    WHEN n LIKE '%transmission and hydraulics fluid capacity%'
      OR n LIKE '%transmission hydraulics fluid capacity%'
      OR n LIKE '%transmission and hydraulic system capacity%'
        THEN 'transmission_hydraulic_system_capacity'

    -- R1/R3/R4 are alternative tire fitments, not one simultaneous tire setup.
    WHEN n LIKE 'r1%tire%front%'
      OR n LIKE 'r3%tire%front%'
      OR n LIKE 'r4%tire%front%'
        THEN 'front_tire_size'

    WHEN n LIKE 'r1%tire%rear%'
      OR n LIKE 'r3%tire%rear%'
      OR n LIKE 'r4%tire%rear%'
        THEN 'rear_tire_size'

    ELSE NULL
END
FROM x;
$function$;

CREATE OR REPLACE FUNCTION public.tc_canonical_spec_class(p_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
SELECT CASE
    -- These are fluid capacities even though two keys begin with transmission_.
    -- Keep this exception before the broad transmission_ classification.
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
        'differential_lock_rear'
    ) THEN 'powertrain'

    WHEN p_key LIKE '%brake%' OR p_key = 'brake_control'
        THEN 'brakes'

    WHEN p_key LIKE 'steering_%'
        THEN 'steering'

    WHEN p_key IN (
        'weight_kg', 'operating_weight', 'shipping_weight', 'weight_with_cab',
        'weight_with_rops', 'weight_with_air_cab', 'weight_with_protector_cab',
        'weight_with_redcab', 'weight_without_cab', 'base_machine_weight',
        'weight_range', 'wheelbase', 'ground_clearance', 'overall_length',
        'overall_width', 'overall_width_range', 'overall_height', 'track_width',
        'front_track_width', 'rear_track_width', 'turning_radius', 'seat_height',
        'power_to_weight_ratio', 'speed_range'
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

    WHEN p_key IN ('dashboard_features', 'seat_features', 'mirror_count')
        THEN 'operator_station'

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
    -- Prefer the narrow v21.32 aliases; otherwise retain the existing canonical
    -- taxonomy and legacy v1 fallback for all previously supported labels.
    v_new_key := COALESCE(
        public.tc_canonical_spec_key_v21_32_alias(NEW.spec_name, NEW.evidence_text),
        public.tc_canonical_spec_key(NEW.spec_name, NEW.evidence_text)
    );

    IF TG_OP = 'UPDATE' THEN
        v_old_key := COALESCE(
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
            NEW.comparison_class :=
                public.tc_canonical_spec_class(NEW.canonical_key);
        END IF;
    ELSE
        IF NEW.canonical_key IS NULL THEN
            NEW.canonical_key := v_new_key;
        END IF;

        IF NEW.comparison_class IS NULL THEN
            NEW.comparison_class :=
                public.tc_canonical_spec_class(NEW.canonical_key);
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Fail and roll back unless the targeted aliases return the intended mappings.
DO $$
BEGIN
    IF public.tc_canonical_spec_key_v21_32_alias('Minimum turn radius with brakes', 'ROPS 2710 mm')
       IS DISTINCT FROM 'turning_radius' THEN
        RAISE EXCEPTION 'v21.32 turning-radius alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Implement hydraulic flow', '29 L/min')
       IS DISTINCT FROM 'hydraulic_implement_flow' THEN
        RAISE EXCEPTION 'v21.32 implement-flow alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Steering hydraulic flow', '16.1 L/min')
       IS DISTINCT FROM 'hydraulic_steering_flow' THEN
        RAISE EXCEPTION 'v21.32 steering-flow alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Total hydraulic flow', '45.1 L/min')
       IS DISTINCT FROM 'hydraulic_total_flow' THEN
        RAISE EXCEPTION 'v21.32 total-flow alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('R1 Agricultural tire - Front', '8.0-16 4PR')
       IS DISTINCT FROM 'front_tire_size' THEN
        RAISE EXCEPTION 'v21.32 tire alias validation failed';
    END IF;

    IF public.tc_canonical_spec_class('front_axle_capacity')
       IS DISTINCT FROM 'capacities' THEN
        RAISE EXCEPTION 'v21.32 front-axle capacity class validation failed';
    END IF;

    IF public.tc_canonical_spec_class('transmission_hydraulic_system_capacity')
       IS DISTINCT FROM 'capacities' THEN
        RAISE EXCEPTION 'v21.32 transmission/hydraulic capacity class validation failed';
    END IF;

    IF public.tc_canonical_spec_class('engine_oil_capacity')
       IS DISTINCT FROM 'capacities' THEN
        RAISE EXCEPTION 'v21.32 engine oil capacity class validation failed';
    END IF;

    IF public.tc_canonical_spec_class('maximum_speed')
       IS DISTINCT FROM 'performance' THEN
        RAISE EXCEPTION 'v21.32 maximum speed class validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('3-point hitch category', 'Category 3-point hitch I')
       IS DISTINCT FROM 'three_point_linkage_category' THEN
        RAISE EXCEPTION 'v21.32 3-point hitch alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Hydraulic pump type', 'Dual gear pump')
       IS DISTINCT FROM 'hydraulic_pump_type' THEN
        RAISE EXCEPTION 'v21.32 hydraulic pump type alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Rear remote valves', '1')
       IS DISTINCT FROM 'hydraulic_remote_valve_count' THEN
        RAISE EXCEPTION 'v21.32 rear remote valve alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Coolant capacity', '6.5 L')
       IS DISTINCT FROM 'coolant_capacity' THEN
        RAISE EXCEPTION 'v21.32 coolant capacity alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Crankcase oil capacity', '6.4 L')
       IS DISTINCT FROM 'engine_oil_capacity' THEN
        RAISE EXCEPTION 'v21.32 crankcase oil capacity alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Front axle fluid capacity', '2.1 L')
       IS DISTINCT FROM 'front_axle_capacity' THEN
        RAISE EXCEPTION 'v21.32 front axle fluid capacity alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('Transmission and hydraulics fluid capacity', '32.2 L')
       IS DISTINCT FROM 'transmission_hydraulic_system_capacity' THEN
        RAISE EXCEPTION 'v21.32 transmission/hydraulics capacity alias validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_32_alias('R4 Industrial tire - Rear', '12.5-20 10PR')
       IS DISTINCT FROM 'rear_tire_size' THEN
        RAISE EXCEPTION 'v21.32 R4 rear tire alias validation failed';
    END IF;
END;
$;

COMMIT;
