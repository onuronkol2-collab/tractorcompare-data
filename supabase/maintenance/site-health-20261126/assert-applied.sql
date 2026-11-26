\set ON_ERROR_STOP on
DO $guard$
BEGIN
 IF to_regclass('tc_assisted_private.tc_publication_audit_grant_idx') IS NULL
 OR to_regclass('tc_forum_reporting_private.tc_review_audit_reviewer_idx') IS NULL
 THEN RAISE EXCEPTION 'Expected FK indexes missing'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='tc_forum_accepted_solutions' AND cmd='SELECT' AND 'authenticated'=ANY(roles))<>1
 OR (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='tc_forum_accepted_solutions' AND cmd='SELECT' AND 'anon'=ANY(roles))<>1
 THEN RAISE EXCEPTION 'SELECT policies not separated by role'; END IF;
END
$guard$;
