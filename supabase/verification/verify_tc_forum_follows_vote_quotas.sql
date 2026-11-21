-- Read-only forum follow and fair voting audit.
SELECT c.relname,c.relrowsecurity,
 has_table_privilege('anon',c.oid,'SELECT') anon_select,
 has_table_privilege('authenticated',c.oid,'SELECT') member_select
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN
('tc_member_topic_follows','tc_forum_vote_daily_quotas')
ORDER BY c.relname;
SELECT count(*) follows FROM public.tc_member_topic_follows;
SELECT count(*) quota_days FROM public.tc_forum_vote_daily_quotas;
SELECT position('tc_forum_vote_daily_quotas' IN
 pg_get_functiondef('public.tc_helpful_vote_rate_limit()'::regprocedure))>0 quota_guard_active;
