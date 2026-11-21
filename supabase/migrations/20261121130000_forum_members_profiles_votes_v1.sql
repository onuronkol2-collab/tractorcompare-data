-- TractorVS Forum Members v1: public nicknames, private votes, real helpfulness and avatar security.
-- Compatible with existing forum moderation/translation and no public email/password storage.
BEGIN;

CREATE TABLE IF NOT EXISTS public.tc_member_profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 handle text NOT NULL,
 display_name text NOT NULL,
 bio text NOT NULL DEFAULT '',
 avatar_path text,
 favorite_brand text NOT NULL DEFAULT '',
 show_leaderboard boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tc_member_handle_format CHECK(handle ~ '^[a-z][a-z0-9_]{2,23}$'),
 CONSTRAINT tc_member_display_name_format CHECK(length(btrim(display_name)) BETWEEN 2 AND 40
    AND display_name = btrim(display_name)),
 CONSTRAINT tc_member_bio_length CHECK(length(bio)<=160 AND bio !~* '(https?://|www[.])'),
 CONSTRAINT tc_member_brand_length CHECK(length(favorite_brand)<=50 AND favorite_brand !~* '(https?://|www[.])'),
 CONSTRAINT tc_member_avatar_own CHECK(avatar_path IS NULL OR avatar_path=id::text||'/avatar.webp')
);
CREATE UNIQUE INDEX IF NOT EXISTS tc_member_handle_unique ON public.tc_member_profiles(lower(handle));
CREATE INDEX IF NOT EXISTS tc_member_updated ON public.tc_member_profiles(updated_at DESC);
ALTER TABLE public.tc_member_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_member_profiles FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tc_member_profiles TO anon,authenticated;
GRANT INSERT,UPDATE ON public.tc_member_profiles TO authenticated;
CREATE POLICY tc_member_profile_read ON public.tc_member_profiles
 FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY tc_member_profile_own_create ON public.tc_member_profiles
 FOR INSERT TO authenticated WITH CHECK (id=(select auth.uid()));
CREATE POLICY tc_member_profile_own_update ON public.tc_member_profiles
 FOR UPDATE TO authenticated USING(id=(select auth.uid()))
 WITH CHECK(id=(select auth.uid()));

-- Each member can upvote a published reply once; self-voting is forbidden.
-- Public tables never disclose voter identities.
CREATE TABLE IF NOT EXISTS public.tc_forum_helpful_votes (
 reply_id uuid NOT NULL REFERENCES public.tc_forum_replies(id) ON DELETE CASCADE,
 voter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(reply_id,voter_id)
);
CREATE INDEX IF NOT EXISTS tc_helpful_votes_voter_date
 ON public.tc_forum_helpful_votes(voter_id,created_at DESC);
ALTER TABLE public.tc_forum_helpful_votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_helpful_votes FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.tc_forum_helpful_votes TO authenticated;
CREATE POLICY tc_helpful_own_read ON public.tc_forum_helpful_votes
 FOR SELECT TO authenticated USING(voter_id=(select auth.uid()));
CREATE POLICY tc_helpful_own_remove ON public.tc_forum_helpful_votes
 FOR DELETE TO authenticated USING(voter_id=(select auth.uid()));
CREATE POLICY tc_helpful_own_insert ON public.tc_forum_helpful_votes
 FOR INSERT TO authenticated
 WITH CHECK (
  voter_id=(select auth.uid()) AND
  EXISTS (
   SELECT 1 FROM public.tc_forum_replies r
   JOIN public.tc_forum_topics t ON t.id=r.topic_id
   WHERE r.id=reply_id AND r.status='published' AND t.status='published'
     AND r.author_id<>(select auth.uid())
  )
 );
CREATE OR REPLACE FUNCTION public.tc_helpful_vote_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO ''
AS $func$
BEGIN
 IF (SELECT count(*) FROM public.tc_forum_helpful_votes
     WHERE voter_id=NEW.voter_id AND created_at>=now()-interval '24 hours') >= 20 THEN
  RAISE EXCEPTION 'Daily helpful vote limit reached';
 END IF;
 RETURN NEW;
END;
$func$;
CREATE TRIGGER tc_helpful_vote_insert_limit BEFORE INSERT ON public.tc_forum_helpful_votes
 FOR EACH ROW EXECUTE FUNCTION public.tc_helpful_vote_rate_limit();
REVOKE ALL ON FUNCTION public.tc_helpful_vote_rate_limit() FROM PUBLIC,anon,authenticated;

-- Public totals expose only aggregate counts for moderated published replies.
CREATE TABLE IF NOT EXISTS public.tc_forum_reply_helpful_totals (
 reply_id uuid PRIMARY KEY REFERENCES public.tc_forum_replies(id) ON DELETE CASCADE,
 helpful_count integer NOT NULL DEFAULT 0 CHECK(helpful_count>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tc_forum_reply_helpful_totals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_reply_helpful_totals FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tc_forum_reply_helpful_totals TO anon,authenticated;
CREATE POLICY tc_helpful_total_published ON public.tc_forum_reply_helpful_totals
 FOR SELECT TO anon,authenticated USING(
  EXISTS (
   SELECT 1 FROM public.tc_forum_replies r
   JOIN public.tc_forum_topics t ON t.id=r.topic_id
   WHERE r.id=reply_id AND r.status='published' AND t.status='published'
  )
 );
CREATE OR REPLACE FUNCTION public.tc_helpful_update_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $func$
DECLARE v_id uuid;
BEGIN
 v_id := CASE WHEN TG_OP='DELETE' THEN OLD.reply_id ELSE NEW.reply_id END;
 IF TG_OP='INSERT' THEN
  INSERT INTO public.tc_forum_reply_helpful_totals(reply_id,helpful_count)
  VALUES(v_id,1)
  ON CONFLICT(reply_id) DO UPDATE SET
   helpful_count=public.tc_forum_reply_helpful_totals.helpful_count+1,updated_at=now();
 ELSE
  UPDATE public.tc_forum_reply_helpful_totals SET
   helpful_count=GREATEST(0,helpful_count-1),updated_at=now()
  WHERE reply_id=v_id;
 END IF;
 RETURN NULL;
END;
$func$;
REVOKE ALL ON FUNCTION public.tc_helpful_update_totals() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tc_helpful_vote_totals_insert AFTER INSERT ON public.tc_forum_helpful_votes
 FOR EACH ROW EXECUTE FUNCTION public.tc_helpful_update_totals();
CREATE TRIGGER tc_helpful_vote_totals_delete AFTER DELETE ON public.tc_forum_helpful_votes
 FOR EACH ROW EXECUTE FUNCTION public.tc_helpful_update_totals();

-- Bookmarking avoids artificial engagement points, and stays private.
CREATE TABLE IF NOT EXISTS public.tc_member_bookmarks (
 member_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 topic_id uuid NOT NULL REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(member_id,topic_id)
);
ALTER TABLE public.tc_member_bookmarks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_member_bookmarks FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.tc_member_bookmarks TO authenticated;
CREATE POLICY tc_bookmarks_owner_read ON public.tc_member_bookmarks
 FOR SELECT TO authenticated USING(member_id=(select auth.uid()));
CREATE POLICY tc_bookmarks_owner_delete ON public.tc_member_bookmarks
 FOR DELETE TO authenticated USING(member_id=(select auth.uid()));
CREATE POLICY tc_bookmarks_owner_insert ON public.tc_member_bookmarks
 FOR INSERT TO authenticated WITH CHECK(
 member_id=(select auth.uid()) AND
 EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published')
);

-- Rewards ONLY approved visible content; every helpful vote is capped at 10 per reply.
-- Distinct views for monthly activity and sustained lifetime contribution.
CREATE OR REPLACE VIEW public.tc_member_scores WITH (security_invoker=true) AS
WITH topics AS (
 SELECT author_id,count(*)::int topic_count,
 count(*) FILTER (WHERE created_at>=now()-interval '30 days')::int month_topics
 FROM public.tc_forum_topics WHERE status='published'
 GROUP BY author_id
), replies AS (
 SELECT r.author_id,count(*)::int reply_count,
 count(*) FILTER (WHERE r.created_at>=now()-interval '30 days')::int month_replies
 FROM public.tc_forum_replies r JOIN public.tc_forum_topics t ON t.id=r.topic_id
 WHERE r.status='published' AND t.status='published'
 GROUP BY r.author_id
), helpful AS (
 SELECT r.author_id,
 coalesce(sum(least(v.helpful_count,10)),0)::int helpful_points_count
 FROM public.tc_forum_reply_helpful_totals v
 JOIN public.tc_forum_replies r ON r.id=v.reply_id
 JOIN public.tc_forum_topics t ON t.id=r.topic_id
 WHERE r.status='published' AND t.status='published'
 GROUP BY r.author_id
)
SELECT p.id,p.handle,p.display_name,p.bio,p.avatar_path,p.favorite_brand,
 p.show_leaderboard,p.created_at,
 coalesce(t.topic_count,0) topic_count,
 coalesce(r.reply_count,0) reply_count,
 coalesce(h.helpful_points_count,0) helpful_votes,
 (3*coalesce(t.topic_count,0)+2*coalesce(r.reply_count,0)+
  2*coalesce(h.helpful_points_count,0))::int score_total,
 -- Recent activity score intentionally counts ONLY contributions dated in the
 -- last 30 days; a new vote must not back-date old helpful votes into this period.
 (3*coalesce(t.month_topics,0)+2*coalesce(r.month_replies,0))::int score_30d
FROM public.tc_member_profiles p
LEFT JOIN topics t ON t.author_id=p.id
LEFT JOIN replies r ON r.author_id=p.id
LEFT JOIN helpful h ON h.author_id=p.id
WHERE p.show_leaderboard=true OR p.id=(select auth.uid());
REVOKE ALL ON public.tc_member_scores FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tc_member_scores TO anon,authenticated;

-- Supabase Storage public images: only self-owned, one overwritten sanitized WebP.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('tc-forum-avatars','tc-forum-avatars',true,350000,ARRAY['image/webp'])
 ON CONFLICT(id) DO NOTHING;
CREATE POLICY tc_avatar_own_insert ON storage.objects
 FOR INSERT TO authenticated WITH CHECK(
  bucket_id='tc-forum-avatars'
  AND (storage.foldername(name))[1]=(select auth.uid())::text
  AND (storage.filename(name))='avatar.webp'
 );
CREATE POLICY tc_avatar_own_update ON storage.objects
 FOR UPDATE TO authenticated USING(
  bucket_id='tc-forum-avatars'
  AND (storage.foldername(name))[1]=(select auth.uid())::text
  AND (storage.filename(name))='avatar.webp'
 ) WITH CHECK(
  bucket_id='tc-forum-avatars'
  AND (storage.foldername(name))[1]=(select auth.uid())::text
  AND (storage.filename(name))='avatar.webp'
 );
CREATE POLICY tc_avatar_own_read ON storage.objects
 FOR SELECT TO authenticated USING(
  bucket_id='tc-forum-avatars'
  AND (storage.foldername(name))[1]=(select auth.uid())::text
  AND (storage.filename(name))='avatar.webp'
 );
CREATE POLICY tc_avatar_own_delete ON storage.objects
 FOR DELETE TO authenticated USING(
  bucket_id='tc-forum-avatars'
  AND (storage.foldername(name))[1]=(select auth.uid())::text
  AND (storage.filename(name))='avatar.webp'
 );
COMMIT;
