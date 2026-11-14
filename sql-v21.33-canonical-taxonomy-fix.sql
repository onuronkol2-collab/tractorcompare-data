-- TractorCompare AI v21.33 — exact aliases observed in the TYM T3047 v21.32 run.
-- Function-only migration. Does NOT UPDATE, DELETE, approve, publish, or rewrite findings.
-- Safe to re-run.

BEGIN;

CREATE OR REPLACE FUNCTION public.tc_canonical_spec_key_v21_33_alias(
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
SELECT CASE
    -- Gemini returned "Engine fuel system", not only the shorter "Fuel system".
    WHEN n LIKE '%engine fuel system%'
      OR n = 'fuel system'
        THEN 'engine_fuel_system'

    -- Preserve the slash variant printed by the TYM Series 3 source label.
    -- This condition must win before legacy generic transmission matching.
    WHEN n LIKE '%transmission/hydraulics system capacity%'
      OR n LIKE '%transmission hydraulics system capacity%'
      OR n LIKE '%transmission/hydraulics fluid capacity%'
        THEN 'transmission_hydraulic_system_capacity'

    ELSE public.tc_canonical_spec_key_v21_32_alias(p_name, p_evidence)
END
FROM x;
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
    -- Exact v21.33 aliases first, v21.32 aliases second, then the legacy taxonomy.
    v_new_key := COALESCE(
        public.tc_canonical_spec_key_v21_33_alias(NEW.spec_name, NEW.evidence_text),
        public.tc_canonical_spec_key_v21_32_alias(NEW.spec_name, NEW.evidence_text),
        public.tc_canonical_spec_key(NEW.spec_name, NEW.evidence_text)
    );

    IF TG_OP = 'UPDATE' THEN
        v_old_key := COALESCE(
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

-- Assertions use the exact strings produced by the latest TYM T3047 research run.
DO $$
BEGIN
    IF public.tc_canonical_spec_key_v21_33_alias(
        'Engine fuel system',
        'IDI'
    ) IS DISTINCT FROM 'engine_fuel_system' THEN
        RAISE EXCEPTION 'v21.33 engine fuel-system alias validation failed';
    END IF;

    IF public.tc_canonical_spec_class('engine_fuel_system')
       IS DISTINCT FROM 'engine' THEN
        RAISE EXCEPTION 'v21.33 engine fuel-system class validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_33_alias(
        'Transmission/Hydraulics system capacity',
        '32.2 L'
    ) IS DISTINCT FROM 'transmission_hydraulic_system_capacity' THEN
        RAISE EXCEPTION 'v21.33 slash transmission/hydraulics capacity alias validation failed';
    END IF;

    IF public.tc_canonical_spec_class('transmission_hydraulic_system_capacity')
       IS DISTINCT FROM 'capacities' THEN
        RAISE EXCEPTION 'v21.33 transmission/hydraulics capacity class validation failed';
    END IF;

    IF public.tc_canonical_spec_key_v21_33_alias(
        'Transmission and hydraulics fluid capacity',
        '32.2 L'
    ) IS DISTINCT FROM 'transmission_hydraulic_system_capacity' THEN
        RAISE EXCEPTION 'v21.33 legacy transmission/hydraulics alias regression failed';
    END IF;
END;
$$;

COMMIT;
