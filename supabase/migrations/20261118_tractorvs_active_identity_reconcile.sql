-- TractorVS / 2026-11-18 / ADIM48
-- SAFE & ATOMIC: archive ONE proven SAME duplicate, retain history, and add
-- normalized exact-identity uniqueness for all NON-ARCHIVED tractors.
-- Does not DELETE data, move technical specs, modify RLS, or publish models.
-- DO NOT run the older 20261118_tractorvs_duplicate_identity_guard.sql:
-- that earlier index intentionally included archived records.
--
-- Precondition: backup/snapshot recommended before any DDL.
-- All checks, the one-row UPDATE and the UNIQUE INDEX share a transaction.
-- Any unexpected mismatch raises an exception and ROLLS BACK EVERYTHING.

BEGIN;
SET LOCAL lock_timeout = '8s';
SET LOCAL statement_timeout = '120s';
SELECT pg_advisory_xact_lock(2026111849);

-- Block concurrent changes while verifying the duplicate pair and creating
-- the index. This is short-lived on the current small catalogue.
LOCK TABLE public.tractors IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.tractor_specs IN SHARE ROW EXCLUSIVE MODE;

DO $tc48$
DECLARE
  v_keep CONSTANT uuid := '07c28866-aa82-4cd2-895a-bd75d6ac713a';
  v_archive CONSTANT uuid := '8a9aac06-cc03-4894-958f-d70964ddb2ff';
  v_keep_row public.tractors%ROWTYPE;
  v_archive_row public.tractors%ROWTYPE;
  v_ref record;
  v_ref_count bigint;
  v_changed integer;
BEGIN
  IF to_regclass('public.tractorvs_tractors_identity_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'ADIM48: old all-status unique index exists. Stop and inspect its definition before proceeding.';
  END IF;
  IF to_regclass('public.tractorvs_tractors_active_identity_v1') IS NOT NULL THEN
    RAISE EXCEPTION 'ADIM48: active identity index already exists. Do not reapply the migration.';
  END IF;

  SELECT * INTO v_keep_row FROM public.tractors WHERE id = v_keep;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ADIM48: intended SAME primary record is missing; no changes made.';
  END IF;
  SELECT * INTO v_archive_row FROM public.tractors WHERE id = v_archive;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ADIM48: intended SAME duplicate record is missing; no changes made.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.brands b
    WHERE b.id = v_keep_row.brand_id AND lower(btrim(b.name)) = 'same'
  ) OR v_keep_row.brand_id IS DISTINCT FROM v_archive_row.brand_id
    OR lower(btrim(v_keep_row.model_name)) <> 'frutteto s/v'
    OR lower(btrim(v_archive_row.model_name)) <> 'frutteto s/v'
    OR v_keep_row.status <> 'draft' OR v_archive_row.status <> 'draft'
    OR lower(btrim(coalesce(v_keep_row.variant,''))) <> '2026 product range'
    OR lower(btrim(coalesce(v_archive_row.variant,''))) <> '2026 product range'
    OR lower(btrim(coalesce(v_keep_row.market,''))) <> 'global'
    OR lower(btrim(coalesce(v_archive_row.market,''))) <> 'global'
    OR v_keep_row.model_year IS NOT NULL OR v_archive_row.model_year IS NOT NULL
  THEN
    RAISE EXCEPTION 'ADIM48: SAME identity/status/market changed; abort without updates.';
  END IF;

  -- Every non-identity, non-audit field of both tractor records must be equal.
  IF (to_jsonb(v_keep_row) - ARRAY['id','created_at','updated_at']::text[])
     IS DISTINCT FROM
     (to_jsonb(v_archive_row) - ARRAY['id','created_at','updated_at']::text[]) THEN
    RAISE EXCEPTION 'ADIM48: SAME rows differ in fields not shown in the earlier audit; manual review required.';
  END IF;

  IF (SELECT count(*) FROM public.tractor_specs WHERE tractor_id = v_keep) <> 2
     OR (SELECT count(*) FROM public.tractor_specs WHERE tractor_id = v_archive) <> 2 THEN
    RAISE EXCEPTION 'ADIM48: SAME spec count changed; expected exactly 2+2; rolled back.';
  END IF;

  -- EXCEPT ALL checks the *multiset*, so even repeated specs cannot disappear.
  -- Preserve independent data_source IDs, but compare their original citation
  -- details rather than requiring IDs to be identical.
  -- Include all current spec fields other than row IDs and audit timestamps.
  IF EXISTS (
    SELECT
      (to_jsonb(s) - ARRAY['id','tractor_id','source_id','created_at','updated_at']::text[])
      || jsonb_build_object('source', jsonb_build_object(
        'publisher',d.publisher,'url',d.source_url,'type',d.source_type))
    FROM public.tractor_specs s
    LEFT JOIN public.data_sources d ON d.id = s.source_id
    WHERE s.tractor_id = v_keep
    EXCEPT ALL
    SELECT
      (to_jsonb(s) - ARRAY['id','tractor_id','source_id','created_at','updated_at']::text[])
      || jsonb_build_object('source', jsonb_build_object(
        'publisher',d.publisher,'url',d.source_url,'type',d.source_type))
    FROM public.tractor_specs s
    LEFT JOIN public.data_sources d ON d.id = s.source_id
    WHERE s.tractor_id = v_archive
  ) OR EXISTS (
    SELECT
      (to_jsonb(s) - ARRAY['id','tractor_id','source_id','created_at','updated_at']::text[])
      || jsonb_build_object('source', jsonb_build_object(
        'publisher',d.publisher,'url',d.source_url,'type',d.source_type))
    FROM public.tractor_specs s
    LEFT JOIN public.data_sources d ON d.id = s.source_id
    WHERE s.tractor_id = v_archive
    EXCEPT ALL
    SELECT
      (to_jsonb(s) - ARRAY['id','tractor_id','source_id','created_at','updated_at']::text[])
      || jsonb_build_object('source', jsonb_build_object(
        'publisher',d.publisher,'url',d.source_url,'type',d.source_type))
    FROM public.tractor_specs s
    LEFT JOIN public.data_sources d ON d.id = s.source_id
    WHERE s.tractor_id = v_keep
  ) THEN
    RAISE EXCEPTION 'ADIM48: SAME spec evidence/source metadata differs; preserved both draft records; review needed.';
  END IF;

  -- Protect research/forum/AI workflows: if any other table has an FK pointing
  -- at the duplicate, stop rather than silently archiving an in-use record.
  -- tractor_specs is explicitly excluded because its two rows remain intact.
  FOR v_ref IN
    SELECT ns.nspname AS schema_name, cls.relname AS table_name,
           att.attname AS column_name, con.conname AS constraint_name,
           cardinality(con.conkey) AS nkeys
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    LEFT JOIN pg_attribute att
      ON att.attrelid = cls.oid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND con.confrelid = 'public.tractors'::regclass
      AND con.conrelid <> 'public.tractor_specs'::regclass
  LOOP
    IF v_ref.nkeys <> 1 OR v_ref.column_name IS NULL THEN
      RAISE EXCEPTION 'ADIM48: composite/unknown tractor FK %.%; manual review needed',
        v_ref.schema_name, v_ref.constraint_name;
    END IF;
    EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I = $1',
      v_ref.schema_name, v_ref.table_name, v_ref.column_name)
      INTO v_ref_count USING v_archive;
    IF v_ref_count > 0 THEN
      RAISE EXCEPTION 'ADIM48: duplicate has % references in %.% (%). No changes.',
        v_ref_count, v_ref.schema_name, v_ref.table_name, v_ref.constraint_name;
    END IF;
  END LOOP;

  -- TIGRE 3800's archived empty record should be preserved as-is.
  IF NOT EXISTS (
    SELECT 1 FROM public.tractors t JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = '6df3eccb-8753-4af2-8d89-df55bf44cbab'::uuid
      AND b.name = 'Antonio Carraro' AND t.status = 'archived'
      AND NOT EXISTS (SELECT 1 FROM public.tractor_specs s WHERE s.tractor_id = t.id)
  ) THEN
    RAISE EXCEPTION 'ADIM48: historical TIGRE 3800 row no longer matches audit; stop.';
  END IF;

  -- No silent changes to any other model/brand. The whole UPDATE affects one
  -- explicitly identified duplicate and retains all its specs and references.
  UPDATE public.tractors SET status = 'archived'
  WHERE id = v_archive AND status = 'draft';

  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> 1 THEN
    RAISE EXCEPTION 'ADIM48: expected one archived SAME record, changed %; rolled back.', v_changed;
  END IF;

  -- After this one archive operation no *active* exact identity may repeat.
  IF EXISTS (
    SELECT 1 FROM public.tractors t
    WHERE t.status IS DISTINCT FROM 'archived'
    GROUP BY t.brand_id, lower(btrim(t.model_name)),
      lower(btrim(coalesce(t.variant,''))),
      lower(btrim(coalesce(t.market,''))), coalesce(t.model_year,-1)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'ADIM48: more active exact-identity duplicates exist; transaction rolled back.';
  END IF;
END $tc48$;

-- Partial unique index: archived records may coexist as history; non-archived
-- models must have distinct brand/model/variant/market/year identities.
CREATE UNIQUE INDEX tractorvs_tractors_active_identity_v1
ON public.tractors (
  brand_id,
  lower(btrim(model_name)),
  lower(btrim(coalesce(variant,''))),
  lower(btrim(coalesce(market,''))),
  coalesce(model_year,-1)
)
WHERE status IS DISTINCT FROM 'archived';

COMMIT;

-- Expected: 1 SAME draft + 1 SAME archived; one TIGRE draft + one archived;
-- active_duplicate_groups = 0; index_exists = true.
SELECT
  (SELECT count(*) FROM public.tractors WHERE id IN (
    '07c28866-aa82-4cd2-895a-bd75d6ac713a'::uuid,
    '8a9aac06-cc03-4894-958f-d70964ddb2ff'::uuid
  ) AND status = 'draft') AS same_draft_count,
  (SELECT count(*) FROM public.tractors WHERE id IN (
    '07c28866-aa82-4cd2-895a-bd75d6ac713a'::uuid,
    '8a9aac06-cc03-4894-958f-d70964ddb2ff'::uuid
  ) AND status = 'archived') AS same_archived_count,
  (SELECT count(*) FROM (
     SELECT 1 FROM public.tractors t
     WHERE t.status IS DISTINCT FROM 'archived'
     GROUP BY t.brand_id, lower(btrim(t.model_name)),
        lower(btrim(coalesce(t.variant,''))),
        lower(btrim(coalesce(t.market,''))), coalesce(t.model_year,-1)
     HAVING count(*) > 1
  ) duplicated) AS active_duplicate_groups,
  (to_regclass('public.tractorvs_tractors_active_identity_v1') IS NOT NULL) AS index_exists;
