\set ON_ERROR_STOP on
-- Run before applying, after applying, and after rollback, inside disposable DB only.
DO $guard$
BEGIN
 IF has_schema_privilege('anon','tc_assisted_private','USAGE')
 OR has_schema_privilege('authenticated','tc_assisted_private','USAGE')
 OR has_schema_privilege('anon','tc_forum_reporting_private','USAGE')
 OR has_schema_privilege('authenticated','tc_forum_reporting_private','USAGE')
 THEN RAISE EXCEPTION 'Private schema exposed'; END IF;
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tc_forum_accepted_solutions'::regclass)
 THEN RAISE EXCEPTION 'Solution RLS disabled'; END IF;
 IF has_table_privilege('anon','public.tc_forum_accepted_solutions','INSERT,UPDATE,DELETE')
 THEN RAISE EXCEPTION 'Anonymous write grant'; END IF;
END
$guard$;
