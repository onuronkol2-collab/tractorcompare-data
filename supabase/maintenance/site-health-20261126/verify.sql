-- Read-only after deployment. No user data returned.
select policyname,roles,cmd,qual from pg_policies where schemaname='public' and tablename='tc_forum_accepted_solutions' order by policyname;
select schemaname,tablename,indexname,indexdef from pg_indexes where (schemaname,indexname) in (('tc_assisted_private','tc_publication_audit_grant_idx'),('tc_forum_reporting_private','tc_review_audit_reviewer_idx'));
select n.nspname,c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.oid in ('public.tc_forum_accepted_solutions'::regclass,'tc_assisted_private.publication_audit'::regclass,'tc_forum_reporting_private.review_audit'::regclass);
