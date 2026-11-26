-- Only after verifying the applied policy and index definitions still match this package.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
alter policy tc_solution_owner_read on public.tc_forum_accepted_solutions to authenticated using (((select auth.uid()) is not null and coalesce((select auth.jwt())->>'is_anonymous','false')='false' and exists (select 1 from public.tc_forum_topics t where t.id=tc_forum_accepted_solutions.topic_id and t.author_id=(select auth.uid()) and t.status='published' and t.category in ('questions','maintenance'))));
alter policy tc_solution_public_read on public.tc_forum_accepted_solutions to anon, authenticated;
drop index tc_assisted_private.tc_publication_audit_grant_idx;
drop index tc_forum_reporting_private.tc_review_audit_reviewer_idx;
commit;
