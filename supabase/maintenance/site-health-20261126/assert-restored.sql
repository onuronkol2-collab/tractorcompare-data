\set ON_ERROR_STOP on
DO $guard$
BEGIN
 IF to_regclass('tc_assisted_private.tc_publication_audit_grant_idx') IS NOT NULL
 OR to_regclass('tc_forum_reporting_private.tc_review_audit_reviewer_idx') IS NOT NULL
 OR NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tc_forum_accepted_solutions' AND policyname='tc_solution_owner_read' AND md5(qual)='42692793acda2f39d6c1be7012deff32')
 OR NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tc_forum_accepted_solutions' AND policyname='tc_solution_public_read' AND roles=array['anon','authenticated']::name[] AND md5(qual)='b7d81095426a0aea5e56d83dec49ffc1')
 THEN RAISE EXCEPTION 'Rollback did not restore original definitions'; END IF;
END
$guard$;
