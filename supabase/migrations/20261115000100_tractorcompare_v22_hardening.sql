-- TractorCompare AI v22.0 hardening migration
-- Candidate only. Review, back up, and apply before deploying indexim-v22.0.ts.
-- Existing research rows, documents, notes, hashes, findings and tractor_specs are preserved.
-- No historical identity-marker backfill is performed.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Add ownership and source-local identity metadata. Existing rows remain
--    NULL/false; no evidence is inferred from legacy notes.
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_research_runs
  ADD COLUMN IF NOT EXISTS requested_by_user_id uuid
  REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.ai_research_documents
  ADD COLUMN IF NOT EXISTS identity_evidence_model_key text,
  ADD COLUMN IF NOT EXISTS identity_evidence_variant_key text,
  ADD COLUMN IF NOT EXISTS identity_evidence_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_evidence_method text;

COMMENT ON COLUMN public.ai_research_documents.identity_evidence_model_key IS
  'Normalized exact model identity independently verified from this document or a curated official source cross-reference. Never derived from another document notes.';
COMMENT ON COLUMN public.ai_research_documents.identity_evidence_variant_key IS
  'Normalized exact variant identity independently verified from this document or a curated official source cross-reference.';
COMMENT ON COLUMN public.ai_research_documents.identity_evidence_verified IS
  'True only when model identity and any requested variant identity are verified for this exact source document.';
COMMENT ON COLUMN public.ai_research_documents.identity_evidence_method IS
  'Method used for this document-specific identity proof; legacy rows remain unverified.';

-- ---------------------------------------------------------------------------
-- 2) Minimal server-side rate-limit store. RLS is enabled and only service_role
--    receives table privileges. The Edge Function validates user JWTs itself.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tc_edge_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 32),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, action, window_started_at)
);

ALTER TABLE public.tc_edge_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tc_edge_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tc_edge_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.tc_consume_edge_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_window_started_at timestamptz;
  v_request_count integer;
BEGIN
  IF p_user_id IS NULL
     OR p_action IS NULL
     OR pg_catalog.length(pg_catalog.btrim(p_action)) = 0
     OR pg_catalog.length(p_action) > 32
     OR p_limit IS NULL OR p_limit < 1 OR p_limit > 1000
     OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400
  THEN
    RAISE EXCEPTION 'Invalid rate-limit arguments'
      USING ERRCODE = '22023';
  END IF;

  v_window_started_at := pg_catalog.to_timestamp(
    (
      pg_catalog.floor(
        extract(epoch FROM pg_catalog.clock_timestamp()) / p_window_seconds
      ) * p_window_seconds
    )::double precision
  );

  DELETE FROM public.tc_edge_rate_limits
  WHERE window_started_at < pg_catalog.clock_timestamp() - INTERVAL '2 days';

  INSERT INTO public.tc_edge_rate_limits (
    user_id, action, window_started_at, request_count
  )
  VALUES (
    p_user_id, p_action, v_window_started_at, 1
  )
  ON CONFLICT (user_id, action, window_started_at)
  DO UPDATE SET request_count = public.tc_edge_rate_limits.request_count + 1
  RETURNING request_count INTO v_request_count;

  RETURN v_request_count <= p_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.tc_consume_edge_rate_limit(uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tc_consume_edge_rate_limit(uuid, text, integer, integer)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 3) Shared advisory-lock key and insert guard. Existing duplicated active
--    historical runs are not modified. New direct inserts cannot create a
--    second active run for the same pinned tractor or exact unpinned identity.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tc_guard_active_tractor_research_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_lock_key text;
  v_conflicting_run_id uuid;
BEGIN
  IF NEW.status NOT IN ('queued', 'running') THEN
    RETURN NEW;
  END IF;

  IF NEW.tractor_id IS NOT NULL THEN
    v_lock_key := 'tractor:' || NEW.tractor_id::text;
  ELSE
    v_lock_key := 'identity:'
      || COALESCE(NEW.brand_id::text, '')
      || ':' || pg_catalog.lower(pg_catalog.btrim(COALESCE(NEW.requested_model, '')))
      || ':' || COALESCE(NEW.requested_year::text, '')
      || ':' || pg_catalog.lower(pg_catalog.btrim(COALESCE(NEW.requested_variant, '')))
      || ':' || pg_catalog.lower(pg_catalog.btrim(COALESCE(NEW.requested_market, 'global')));
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_lock_key, 0)
  );

  SELECT r.id
    INTO v_conflicting_run_id
  FROM public.ai_research_runs AS r
  WHERE r.status IN ('queued', 'running')
    AND (
      (NEW.tractor_id IS NOT NULL AND r.tractor_id = NEW.tractor_id)
      OR (
        NEW.tractor_id IS NULL
        AND r.tractor_id IS NULL
        AND r.brand_id = NEW.brand_id
        AND pg_catalog.lower(pg_catalog.btrim(COALESCE(r.requested_model, '')))
            = pg_catalog.lower(pg_catalog.btrim(COALESCE(NEW.requested_model, '')))
        AND r.requested_year IS NOT DISTINCT FROM NEW.requested_year
        AND pg_catalog.lower(pg_catalog.btrim(COALESCE(r.requested_variant, '')))
            = pg_catalog.lower(pg_catalog.btrim(COALESCE(NEW.requested_variant, '')))
        AND pg_catalog.lower(pg_catalog.btrim(COALESCE(r.requested_market, 'global')))
            = pg_catalog.lower(pg_catalog.btrim(COALESCE(NEW.requested_market, 'global')))
      )
    )
  ORDER BY r.updated_at DESC NULLS LAST, r.created_at DESC
  LIMIT 1;

  IF v_conflicting_run_id IS NOT NULL THEN
    RAISE EXCEPTION 'An active TractorCompare research run already exists for this identity'
      USING ERRCODE = '23505',
            DETAIL = 'Existing run_id: ' || v_conflicting_run_id::text,
            CONSTRAINT = 'tc_active_research_run_identity_guard';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tc_guard_active_research_run_insert
  ON public.ai_research_runs;

CREATE TRIGGER tc_guard_active_research_run_insert
BEFORE INSERT ON public.ai_research_runs
FOR EACH ROW
EXECUTE FUNCTION public.tc_guard_active_tractor_research_insert();

-- ---------------------------------------------------------------------------
-- 4) Atomic open-or-reuse function. The advisory lock and run insert occur in
--    one transaction. For queue jobs, last_run_id is saved before source fetch
--    or Gemini is started, so a stale queue reclaim will poll the same run.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tc_open_or_reuse_tractor_research_run(
  p_brand_id uuid,
  p_tractor_id uuid,
  p_search_query text,
  p_requested_model text,
  p_requested_year integer,
  p_requested_variant text,
  p_requested_market text,
  p_source_url text,
  p_gemini_model text,
  p_summary text,
  p_requested_by_user_id uuid,
  p_queue_id uuid
)
RETURNS TABLE(run jsonb, reused boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_lock_key text;
  v_run public.ai_research_runs%ROWTYPE;
  v_reused boolean := false;
  v_rows integer;
BEGIN
  IF p_brand_id IS NULL
     OR pg_catalog.length(pg_catalog.btrim(COALESCE(p_requested_model, ''))) = 0
     OR pg_catalog.length(pg_catalog.btrim(COALESCE(p_requested_model, ''))) > 120
  THEN
    RAISE EXCEPTION 'A valid brand_id and requested_model are required'
      USING ERRCODE = '22023';
  END IF;

  IF p_requested_year IS NOT NULL AND (p_requested_year < 1900 OR p_requested_year > 2100) THEN
    RAISE EXCEPTION 'requested_year must be between 1900 and 2100'
      USING ERRCODE = '22023';
  END IF;

  IF p_queue_id IS NOT NULL AND p_tractor_id IS NULL THEN
    RAISE EXCEPTION 'Queue-originated research requires a pinned tractor_id'
      USING ERRCODE = '22023';
  END IF;

  IF p_tractor_id IS NOT NULL THEN
    v_lock_key := 'tractor:' || p_tractor_id::text;
  ELSE
    v_lock_key := 'identity:'
      || p_brand_id::text
      || ':' || pg_catalog.lower(pg_catalog.btrim(p_requested_model))
      || ':' || COALESCE(p_requested_year::text, '')
      || ':' || pg_catalog.lower(pg_catalog.btrim(COALESCE(p_requested_variant, '')))
      || ':' || pg_catalog.lower(pg_catalog.btrim(COALESCE(p_requested_market, 'global')));
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_lock_key, 0)
  );

  SELECT r.*
    INTO v_run
  FROM public.ai_research_runs AS r
  WHERE r.status IN ('queued', 'running')
    AND (
      (p_tractor_id IS NOT NULL AND r.tractor_id = p_tractor_id)
      OR (
        p_tractor_id IS NULL
        AND r.tractor_id IS NULL
        AND r.brand_id = p_brand_id
        AND pg_catalog.lower(pg_catalog.btrim(COALESCE(r.requested_model, '')))
            = pg_catalog.lower(pg_catalog.btrim(p_requested_model))
        AND r.requested_year IS NOT DISTINCT FROM p_requested_year
        AND pg_catalog.lower(pg_catalog.btrim(COALESCE(r.requested_variant, '')))
            = pg_catalog.lower(pg_catalog.btrim(COALESCE(p_requested_variant, '')))
        AND pg_catalog.lower(pg_catalog.btrim(COALESCE(r.requested_market, 'global')))
            = pg_catalog.lower(pg_catalog.btrim(COALESCE(p_requested_market, 'global')))
      )
    )
  ORDER BY
    (r.gemini_interaction_id IS NOT NULL) DESC,
    r.updated_at DESC NULLS LAST,
    r.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    v_reused := true;

    IF p_requested_by_user_id IS NOT NULL
       AND v_run.requested_by_user_id IS NOT NULL
       AND v_run.requested_by_user_id <> p_requested_by_user_id
    THEN
      RAISE EXCEPTION 'This active research run belongs to another user'
        USING ERRCODE = '42501';
    END IF;

    IF p_requested_by_user_id IS NOT NULL
       AND v_run.requested_by_user_id IS NULL
    THEN
      UPDATE public.ai_research_runs
      SET requested_by_user_id = p_requested_by_user_id
      WHERE id = v_run.id
      RETURNING * INTO v_run;
    END IF;
  ELSE
    INSERT INTO public.ai_research_runs (
      trigger_type,
      status,
      brand_id,
      tractor_id,
      search_query,
      requested_model,
      requested_year,
      requested_variant,
      requested_market,
      source_url,
      gemini_model,
      summary,
      requested_by_user_id
    )
    VALUES (
      'manual',
      'running',
      p_brand_id,
      p_tractor_id,
      p_search_query,
      p_requested_model,
      p_requested_year,
      p_requested_variant,
      COALESCE(NULLIF(pg_catalog.btrim(p_requested_market), ''), 'global'),
      p_source_url,
      p_gemini_model,
      p_summary,
      p_requested_by_user_id
    )
    RETURNING * INTO v_run;
  END IF;

  IF p_queue_id IS NOT NULL THEN
    UPDATE public.tractor_research_queue
    SET last_run_id = v_run.id,
        updated_at = pg_catalog.clock_timestamp()
    WHERE id = p_queue_id
      AND tractor_id = p_tractor_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
      RAISE EXCEPTION 'Queue row does not match the pinned tractor_id'
        USING ERRCODE = '23503';
    END IF;
  END IF;

  RETURN QUERY SELECT pg_catalog.to_jsonb(v_run), v_reused;
END;
$function$;

REVOKE ALL ON FUNCTION public.tc_open_or_reuse_tractor_research_run(
  uuid, uuid, text, text, integer, text, text, text, text, text, uuid, uuid
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.tc_open_or_reuse_tractor_research_run(
  uuid, uuid, text, text, integer, text, text, text, text, text, uuid, uuid
) TO service_role;

-- No active-run UNIQUE index is added here: the audit found historic duplicate
-- running rows. The RPC lock + INSERT guard prevent new duplicates without
-- deleting or rewriting those historic rows. Revisit a partial UNIQUE index only
-- after every pre-existing duplicate has been manually reconciled.

-- ---------------------------------------------------------------------------
-- 5) Harden SECURITY DEFINER queue-claim RPC search_path. Their existing table
--    references are schema-qualified; service_role-only EXECUTE is retained.
-- ---------------------------------------------------------------------------

ALTER FUNCTION public.tc_claim_next_tractor_research()
  SET search_path = '';

ALTER FUNCTION public.tc_claim_tractor_research_by_id(uuid)
  SET search_path = '';

REVOKE ALL ON FUNCTION public.tc_claim_next_tractor_research()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tc_claim_next_tractor_research()
  TO service_role;

REVOKE ALL ON FUNCTION public.tc_claim_tractor_research_by_id(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tc_claim_tractor_research_by_id(uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 6) Versioned taxonomy alias resolver. Specific boost/IPM/DP/CPM rules run
--    before generic maximum-power rules. Hitch category uses the existing
--    predominant canonical key three_point_linkage_category. No rows are updated.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tc_canonical_spec_key_v22_alias(
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
    pg_catalog.regexp_replace(
      pg_catalog.lower(pg_catalog.translate(
        pg_catalog.btrim(COALESCE(p_name, '')),
        'ÇĞİÖŞÜçğıöşü',
        'CGIOSUcgiosu'
      )),
      '[^a-z0-9]+',
      ' ',
      'g'
    ) AS n,
    pg_catalog.regexp_replace(
      pg_catalog.lower(pg_catalog.translate(
        pg_catalog.btrim(COALESCE(p_evidence, '')),
        'ÇĞİÖŞÜçğıöşü',
        'CGIOSUcgiosu'
      )),
      '[^a-z0-9]+',
      ' ',
      'g'
    ) AS e
)
SELECT COALESCE(
  CASE
    WHEN (
      n LIKE '%max power%' OR n LIKE '%maximum power%' OR n LIKE '%maximum engine power%'
      OR n LIKE '%maksimum motor gucu%' OR n LIKE '%maksimum guc%'
      OR n LIKE '%azami motor gucu%' OR n LIKE '%azami guc%'
    ) AND (n LIKE '%with boost%' OR n LIKE '%ek guc%' OR n LIKE '%boost%')
      THEN 'engine_max_power_with_boost'

    WHEN (
      n LIKE '%max power%' OR n LIKE '%maximum power%' OR n LIKE '%maximum engine power%'
    ) AND n LIKE '%ipm%'
      THEN 'engine_max_power_with_ipm'

    WHEN (
      n LIKE '%max power%' OR n LIKE '%maximum power%' OR n LIKE '%maximum engine power%'
    ) AND n LIKE '%dp%'
      THEN 'engine_max_power_with_dp'

    WHEN (
      n LIKE '%max power%' OR n LIKE '%maximum power%' OR n LIKE '%maximum engine power%'
    ) AND n LIKE '%cpm%'
      THEN 'engine_max_power_with_cpm'

    WHEN n LIKE 'power at rated engine speed%'
      OR n LIKE 'maximum power at rated engine speed%'
      OR n LIKE 'maximum power at rated rpm%'
      OR n LIKE 'max power at rated engine speed%'
      THEN 'engine_rated_power'

    WHEN (
      n LIKE '%transmission%' OR n LIKE '%gearbox%' OR n LIKE '%sanziman%'
    ) AND (
      n LIKE '%oil%' OR n LIKE '%reservoir%' OR n LIKE '%yag%'
      OR e LIKE '%transmission reservoir%' OR e LIKE '%transmission oil%'
    )
      THEN 'transmission_oil_capacity'

    WHEN n LIKE '%rear hitch category%'
      OR n LIKE '%3 point hitch category%'
      OR n LIKE '%3 point linkage category%'
      OR n LIKE '%three point hitch category%'
      OR n LIKE '%three point linkage category%'
      OR n LIKE '%three point linkage%'
      OR n LIKE '%arka aski%'
      OR n LIKE '%arka aski baglanti%'
      OR e LIKE '%category i hitch%'
      OR e LIKE '%category ii hitch%'
      OR e LIKE '%category 1 hitch%'
      OR e LIKE '%category 2 hitch%'
      OR e LIKE '%3 points%category%'
      OR e LIKE '%category%3 point hitch%'
      THEN 'three_point_linkage_category'

    -- Preserve the v21.38 dimension and speed aliases.
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
      OR n LIKE 'maximum engine power%'
      OR n LIKE 'maksimum motor gucu%'
      OR n LIKE 'maksimum guc%'
      OR n LIKE 'azami motor gucu%'
      OR n LIKE 'azami guc%'
      THEN 'engine_max_power'

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

CREATE OR REPLACE FUNCTION public.tc_canonical_spec_key_v21_42_alias(
  p_name text,
  p_evidence text DEFAULT NULL::text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
  SELECT public.tc_canonical_spec_key_v22_alias(p_name, p_evidence);
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
  v_new_key := public.tc_canonical_spec_key_v22_alias(NEW.spec_name, NEW.evidence_text);

  IF TG_OP = 'UPDATE' THEN
    v_old_key := public.tc_canonical_spec_key_v22_alias(OLD.spec_name, OLD.evidence_text);

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

-- tc_set_finding_canonical_key() remains unattached; no competing trigger is added.
-- Existing stored canonical_key/comparison_class values are intentionally not bulk-updated.

NOTIFY pgrst, 'reload schema';

COMMIT;
