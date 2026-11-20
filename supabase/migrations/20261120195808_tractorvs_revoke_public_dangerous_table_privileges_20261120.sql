-- Applied to the production Supabase project as migration 20261120195808.
-- Live audit confirmed nine postgres-owned tables had TRUNCATE/REFERENCES/TRIGGER/MAINTAIN
-- granted to anon/authenticated despite RLS (RLS does not protect TRUNCATE).
-- No row data, SELECT grants, RLS policies, service-role or publishing status changes.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE
  public.ai_research_documents, public.ai_research_findings,
  public.ai_research_runs, public.brands, public.data_sources,
  public.news, public.price_history, public.tractor_specs, public.tractors
FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES
  FROM anon, authenticated;

DO $verify$
DECLARE v_bad integer;
BEGIN
  SELECT count(*) INTO v_bad
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND (has_table_privilege('anon',c.oid,'TRUNCATE')
      OR has_table_privilege('authenticated',c.oid,'TRUNCATE')
      OR has_table_privilege('anon',c.oid,'TRIGGER')
      OR has_table_privilege('authenticated',c.oid,'TRIGGER')
      OR has_table_privilege('anon',c.oid,'REFERENCES')
      OR has_table_privilege('authenticated',c.oid,'REFERENCES')
      OR has_table_privilege('anon',c.oid,'MAINTAIN')
      OR has_table_privilege('authenticated',c.oid,'MAINTAIN'));
  IF v_bad>0 THEN
    RAISE EXCEPTION 'Unsafe public table privileges remain on % tables',v_bad;
  END IF;
  IF NOT (
    has_table_privilege('anon','public.tractors','SELECT') AND
    has_table_privilege('anon','public.tractor_specs','SELECT') AND
    has_table_privilege('anon','public.brands','SELECT') AND
    has_table_privilege('anon','public.tractorvs_public_specs','SELECT')
  ) THEN RAISE EXCEPTION 'Public catalog SELECT grant regression'; END IF;
END
$verify$;
