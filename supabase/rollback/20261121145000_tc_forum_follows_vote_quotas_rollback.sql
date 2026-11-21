-- Fail-safe rollback: preserve any existing follows or quota history.
BEGIN;
DO $guard$
BEGIN
 IF EXISTS(SELECT 1 FROM public.tc_member_topic_follows LIMIT 1) OR
    EXISTS(SELECT 1 FROM public.tc_forum_vote_daily_quotas LIMIT 1) THEN
  RAISE EXCEPTION 'Follow or vote quota data exists; export/reconcile before rollback';
 END IF;
END
$guard$;
CREATE OR REPLACE FUNCTION public.tc_helpful_vote_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO ''
AS $body$
BEGIN
 IF (SELECT count(*) FROM public.tc_forum_helpful_votes
 WHERE voter_id=NEW.voter_id AND created_at>=now()-interval '24 hours')>=20 THEN
  RAISE EXCEPTION 'Daily helpful vote limit reached';
 END IF;
 RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION public.tc_helpful_vote_rate_limit() FROM PUBLIC,anon,authenticated;
DROP TABLE IF EXISTS public.tc_member_topic_follows;
DROP TABLE IF EXISTS public.tc_forum_vote_daily_quotas;
COMMIT;
