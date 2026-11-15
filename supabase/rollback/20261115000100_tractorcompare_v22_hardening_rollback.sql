-- TractorCompare AI v22.0 rollback script
-- Use only if rolling the Edge Function back to the unmodified v21.40 baseline.
-- This script removes v22 runtime entry points and restores the audited v21.42
-- alias/trigger behavior. It deliberately PRESERVES new identity and ownership
-- columns plus the rate-limit table so evidence/ownership data is not discarded.

BEGIN;

-- Stop v22-specific database entry points first.
DROP TRIGGER IF EXISTS tc_guard_active_research_run_insert
  ON public.ai_research_runs;

DROP FUNCTION IF EXISTS public.tc_guard_active_tractor_research_insert();

REVOKE ALL ON FUNCTION public.tc_open_or_reuse_tractor_research_run(
  uuid, uuid, text, text, integer, text, text, text, text, text, uuid, uuid
) FROM PUBLIC, anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.tc_open_or_reuse_tractor_research_run(
  uuid, uuid, text, text, integer, text, text, text, text, text, uuid, uuid
);

REVOKE ALL ON FUNCTION public.tc_consume_edge_rate_limit(uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.tc_consume_edge_rate_limit(uuid, text, integer, integer);

-- Restore the original audited v21.42 alias resolver.
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

-- Restore the original attached taxonomy trigger behavior.
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

DROP FUNCTION IF EXISTS public.tc_canonical_spec_key_v22_alias(text, text);

-- Restore the previously audited SECURITY DEFINER queue-claim search path.
ALTER FUNCTION public.tc_claim_next_tractor_research()
  SET search_path = 'public';

ALTER FUNCTION public.tc_claim_tractor_research_by_id(uuid)
  SET search_path = 'public';

-- Preserve the v22-added columns and rate-limit table. They are additive and
-- are not referenced by the v21.40 Edge Function. The rate-limit table retains
-- RLS and its restricted privileges while unused.

NOTIFY pgrst, 'reload schema';

COMMIT;
