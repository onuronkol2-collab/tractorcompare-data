-- TractorVS: moderated topic engagement without visitor fingerprinting.
-- Published topics only; one account may like and read each topic once.
-- Reads count signed-in MEMBERS, never anonymous page views or bot requests.
-- Counts are database-maintained. No client may write aggregate totals.
BEGIN;

CREATE TABLE IF NOT EXISTS public.tc_forum_topic_likes (
 topic_id uuid NOT NULL REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 member_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(topic_id,member_id)
);
CREATE INDEX IF NOT EXISTS tc_forum_topic_likes_member ON public.tc_forum_topic_likes(member_id,created_at DESC);
ALTER TABLE public.tc_forum_topic_likes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_topic_likes FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.tc_forum_topic_likes TO authenticated;
CREATE POLICY tc_topic_likes_owner_read ON public.tc_forum_topic_likes
 FOR SELECT TO authenticated USING (member_id=(select auth.uid()));
CREATE POLICY tc_topic_likes_owner_add ON public.tc_forum_topic_likes
 FOR INSERT TO authenticated WITH CHECK (
  member_id=(select auth.uid()) AND
  EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id
   AND t.status='published' AND t.author_id<>(select auth.uid()))
 );
CREATE POLICY tc_topic_likes_owner_remove ON public.tc_forum_topic_likes
 FOR DELETE TO authenticated USING(member_id=(select auth.uid()));

CREATE TABLE IF NOT EXISTS public.tc_forum_topic_member_reads (
 topic_id uuid NOT NULL REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 member_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 first_read_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(topic_id,member_id)
);
CREATE INDEX IF NOT EXISTS tc_forum_topic_reads_member ON public.tc_forum_topic_member_reads(member_id,first_read_at DESC);
ALTER TABLE public.tc_forum_topic_member_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_topic_member_reads FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.tc_forum_topic_member_reads TO authenticated;
CREATE POLICY tc_topic_reads_owner_read ON public.tc_forum_topic_member_reads
 FOR SELECT TO authenticated USING(member_id=(select auth.uid()));
CREATE POLICY tc_topic_reads_owner_add ON public.tc_forum_topic_member_reads
 FOR INSERT TO authenticated WITH CHECK(
  member_id=(select auth.uid()) AND
  EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published')
 );

-- Private account quota: 20 NEW topic likes per UTC day, removal does not refund.
CREATE TABLE IF NOT EXISTS public.tc_forum_topic_like_quotas (
 member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 vote_day date NOT NULL,
 votes_cast integer NOT NULL DEFAULT 0 CHECK (votes_cast BETWEEN 0 AND 20),
 PRIMARY KEY(member_id,vote_day)
);
ALTER TABLE public.tc_forum_topic_like_quotas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_topic_like_quotas FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.tc_forum_topic_like_quotas TO service_role;

CREATE OR REPLACE FUNCTION public.tc_topic_like_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE counted integer;
BEGIN
 IF (select auth.uid()) IS NULL OR NEW.member_id IS DISTINCT FROM (select auth.uid()) THEN
  RAISE EXCEPTION 'Topic likes require a signed-in member';
 END IF;
 INSERT INTO public.tc_forum_topic_like_quotas(member_id,vote_day,votes_cast)
 VALUES(NEW.member_id,(now() AT TIME ZONE 'UTC')::date,1)
 ON CONFLICT(member_id,vote_day) DO UPDATE
  SET votes_cast=public.tc_forum_topic_like_quotas.votes_cast+1
  WHERE public.tc_forum_topic_like_quotas.votes_cast<20
 RETURNING votes_cast INTO counted;
 IF counted IS NULL THEN RAISE EXCEPTION 'Daily topic like limit reached'; END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tc_topic_like_rate_limit() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tc_topic_like_limit BEFORE INSERT ON public.tc_forum_topic_likes
 FOR EACH ROW EXECUTE FUNCTION public.tc_topic_like_rate_limit();

CREATE TABLE IF NOT EXISTS public.tc_forum_topic_engagement_totals (
 topic_id uuid PRIMARY KEY REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 likes integer NOT NULL DEFAULT 0 CHECK (likes>=0),
 member_reads integer NOT NULL DEFAULT 0 CHECK (member_reads>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tc_forum_topic_engagement_totals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_topic_engagement_totals FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tc_forum_topic_engagement_totals TO anon,authenticated;
CREATE POLICY tc_topic_totals_published_read ON public.tc_forum_topic_engagement_totals
 FOR SELECT TO anon,authenticated USING(
  EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published')
 );

CREATE OR REPLACE FUNCTION public.tc_topic_engagement_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE target_id uuid; change integer;
BEGIN
 target_id:=CASE WHEN TG_OP='DELETE' THEN OLD.topic_id ELSE NEW.topic_id END;
 change:=CASE WHEN TG_OP='INSERT' THEN 1 ELSE -1 END;
 IF TG_TABLE_NAME='tc_forum_topic_likes' THEN
  INSERT INTO public.tc_forum_topic_engagement_totals(topic_id,likes)
  VALUES(target_id,GREATEST(0,change))
  ON CONFLICT(topic_id) DO UPDATE SET
   likes=GREATEST(0,public.tc_forum_topic_engagement_totals.likes+change),
   updated_at=now();
 ELSIF TG_TABLE_NAME='tc_forum_topic_member_reads' THEN
  INSERT INTO public.tc_forum_topic_engagement_totals(topic_id,member_reads)
  VALUES(target_id,GREATEST(0,change))
  ON CONFLICT(topic_id) DO UPDATE SET
   member_reads=GREATEST(0,public.tc_forum_topic_engagement_totals.member_reads+change),
   updated_at=now();
 ELSE
  RAISE EXCEPTION 'Unsupported topic engagement source';
 END IF;
 RETURN NULL;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tc_topic_engagement_count() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tc_topic_likes_totals_add AFTER INSERT ON public.tc_forum_topic_likes
 FOR EACH ROW EXECUTE FUNCTION public.tc_topic_engagement_count();
CREATE TRIGGER tc_topic_likes_totals_remove AFTER DELETE ON public.tc_forum_topic_likes
 FOR EACH ROW EXECUTE FUNCTION public.tc_topic_engagement_count();
CREATE TRIGGER tc_topic_reads_totals_add AFTER INSERT ON public.tc_forum_topic_member_reads
 FOR EACH ROW EXECUTE FUNCTION public.tc_topic_engagement_count();
CREATE TRIGGER tc_topic_reads_totals_remove AFTER DELETE ON public.tc_forum_topic_member_reads
 FOR EACH ROW EXECUTE FUNCTION public.tc_topic_engagement_count();

COMMENT ON TABLE public.tc_forum_topic_member_reads IS
 'One per signed-in member per published topic. Not an anonymous view counter.';
COMMENT ON COLUMN public.tc_forum_topic_engagement_totals.member_reads IS
 'Unique authenticated member readers, not page views, visits or bots.';
COMMIT;
