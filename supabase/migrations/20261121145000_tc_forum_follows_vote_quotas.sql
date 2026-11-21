-- TractorVS forum follow and tamper-resistant helpful vote quota.
-- No existing member, topic, score, translation or SEO data changed.
BEGIN;
CREATE TABLE IF NOT EXISTS public.tc_member_topic_follows(
 member_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 topic_id uuid NOT NULL REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(member_id,topic_id),
 CONSTRAINT tc_follow_seen_range CHECK(last_seen_at>=created_at)
);
CREATE INDEX IF NOT EXISTS tc_member_topic_follows_recent ON
 public.tc_member_topic_follows(member_id,created_at DESC);
ALTER TABLE public.tc_member_topic_follows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_member_topic_follows FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.tc_member_topic_follows TO authenticated;
CREATE POLICY tc_follow_owner_select ON public.tc_member_topic_follows
 FOR SELECT TO authenticated USING(member_id=(select auth.uid()));
CREATE POLICY tc_follow_owner_insert ON public.tc_member_topic_follows
 FOR INSERT TO authenticated WITH CHECK(
  member_id=(select auth.uid()) AND
  EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published'));
CREATE POLICY tc_follow_owner_update ON public.tc_member_topic_follows
 FOR UPDATE TO authenticated USING(member_id=(select auth.uid()))
 WITH CHECK(member_id=(select auth.uid()) AND last_seen_at<=now()+interval '1 minute'
  AND EXISTS(SELECT 1 FROM public.tc_forum_topics t
   WHERE t.id=topic_id AND t.status='published'));
CREATE POLICY tc_follow_owner_delete ON public.tc_member_topic_follows
 FOR DELETE TO authenticated USING(member_id=(select auth.uid()));

-- Private anti-vote-farming counter: deletion of an active helpful vote
-- does NOT refund daily quota, preventing unlimited remove/revote loops.
CREATE TABLE IF NOT EXISTS public.tc_forum_vote_daily_quotas(
 voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 vote_day date NOT NULL,
 votes_cast integer NOT NULL DEFAULT 0 CHECK(votes_cast BETWEEN 0 AND 20),
 PRIMARY KEY(voter_id,vote_day)
);
ALTER TABLE public.tc_forum_vote_daily_quotas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_vote_daily_quotas FROM PUBLIC,anon,authenticated;
-- Existing vote triggers must be protected server-side; no direct client quota writes.
GRANT SELECT,INSERT,UPDATE,DELETE ON public.tc_forum_vote_daily_quotas TO service_role;
CREATE OR REPLACE FUNCTION public.tc_helpful_vote_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE counted integer;
BEGIN
 IF auth.uid() IS NULL OR NEW.voter_id IS DISTINCT FROM auth.uid() THEN
  RAISE EXCEPTION 'Vote requires the currently signed-in member';
 END IF;
 INSERT INTO public.tc_forum_vote_daily_quotas(voter_id,vote_day,votes_cast)
 VALUES(NEW.voter_id,(now() AT TIME ZONE 'UTC')::date,1)
 ON CONFLICT(voter_id,vote_day) DO UPDATE
  SET votes_cast=public.tc_forum_vote_daily_quotas.votes_cast+1
  WHERE public.tc_forum_vote_daily_quotas.votes_cast<20
 RETURNING votes_cast INTO counted;
 IF counted IS NULL THEN
  RAISE EXCEPTION 'Daily helpful vote limit reached';
 END IF;
 RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION public.tc_helpful_vote_rate_limit() FROM PUBLIC,anon,authenticated;
-- Limit does not grant any new API permission for other auth/queue functions.
COMMIT;
