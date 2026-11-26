-- Reviewed maintenance candidate, NOT automatically applied by a deployment.
-- Run only after the PR and database regression gate pass.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';
set local search_path = public, pg_catalog;
do $guard$
begin
  if (select count(*) from pg_policies where schemaname='public' and tablename='tc_forum_accepted_solutions' and cmd='SELECT') <> 2
  or not exists (select 1 from pg_policies where schemaname='public' and tablename='tc_forum_accepted_solutions' and policyname='tc_solution_owner_read' and roles=array['authenticated']::name[] and cmd='SELECT' and permissive='PERMISSIVE' and md5(qual)='42692793acda2f39d6c1be7012deff32')
  or not exists (select 1 from pg_policies where schemaname='public' and tablename='tc_forum_accepted_solutions' and policyname='tc_solution_public_read' and roles=array['anon','authenticated']::name[] and cmd='SELECT' and permissive='PERMISSIVE' and md5(qual)='b7d81095426a0aea5e56d83dec49ffc1')
  then raise exception 'RLS policy drift: review before applying'; end if;
  if to_regclass('tc_assisted_private.tc_publication_audit_grant_idx') is not null or to_regclass('tc_forum_reporting_private.tc_review_audit_reviewer_idx') is not null then raise exception 'Index name collision; review before applying'; end if;
  if pg_total_relation_size('tc_assisted_private.publication_audit') > 10485760 or pg_total_relation_size('tc_forum_reporting_private.review_audit') > 10485760 then raise exception 'Table grew; review nonblocking index strategy'; end if;
end
$guard$;
create index tc_publication_audit_grant_idx on tc_assisted_private.publication_audit(grant_id);
create index tc_review_audit_reviewer_idx on tc_forum_reporting_private.review_audit(reviewer_id);
-- Same predicates, one permissive SELECT policy per role. Retain owner's
-- ability to see their own accepted solution when a reply is unpublished.
alter policy tc_solution_public_read on public.tc_forum_accepted_solutions to anon;
alter policy tc_solution_owner_read on public.tc_forum_accepted_solutions to authenticated using ((exists (select 1 from public.tc_forum_topics t where t.id=tc_forum_accepted_solutions.topic_id and t.status='published' and t.category in ('questions','maintenance')) and exists (select 1 from public.tc_forum_replies r where r.id=tc_forum_accepted_solutions.reply_id and r.topic_id=tc_forum_accepted_solutions.topic_id and r.status='published')) or ((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false' and exists (select 1 from public.tc_forum_topics t where t.id=tc_forum_accepted_solutions.topic_id and t.author_id=(select auth.uid()) and t.status='published' and t.category in ('questions','maintenance'))));
commit;
