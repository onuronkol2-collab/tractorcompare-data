-- TractorVS forum RLS performance (2026-11-21): preserve exact read authorization.
-- Current SELECT policy pairs are OR-combined by PostgreSQL; combine them
-- into one per table to avoid multiple permissive policies per role/action.
-- User ownership is *never* granted to anon; auth.uid() is NULL for anon.
-- Never touch UPDATE/DELETE permissions, public views or moderation.
DO $pre$
BEGIN
 IF EXISTS (
   SELECT 1 FROM (VALUES
    ('tc_forum_topics','tc_topic_public'),('tc_forum_topics','tc_topic_own'),
    ('tc_forum_replies','tc_reply_public'),('tc_forum_replies','tc_reply_own'),
    ('tc_forum_media','tc_forum_media_published_read'),('tc_forum_media','tc_forum_media_owner_read'),
    ('tc_forum_topics','tc_topic_submit'),('tc_forum_replies','tc_reply_submit')
   ) p(tab,policy)
   WHERE NOT EXISTS (
     SELECT 1 FROM pg_policies x
      WHERE x.schemaname='public' AND x.tablename=p.tab AND x.policyname=p.policy
   )
 ) THEN RAISE EXCEPTION 'Expected forum RLS baseline policy missing; refusing patch'; END IF;
 IF (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN
       ('tc_forum_topics','tc_forum_replies','tc_forum_media') AND c.relrowsecurity)=3
    IS NOT TRUE THEN RAISE EXCEPTION 'Forum RLS not enabled'; END IF;
END $pre$;

-- Only change the formatting of JWT reads: cached subselect result per query.
-- Other predicates, text length rules, known tractors, pending/published checks
-- and author identity requirements remain identical.
ALTER POLICY tc_topic_submit ON public.tc_forum_topics TO authenticated
WITH CHECK (
 author_id=(SELECT auth.uid()) AND
 status IN ('pending','published') AND
 (tractor_id IS NULL OR EXISTS (
  SELECT 1 FROM public.tractors t
  WHERE t.id=tc_forum_topics.tractor_id AND t.status='published'
 )) AND
 (status='pending' OR (
  nullif((SELECT auth.jwt())->>'email','') IS NOT NULL
  AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
  AND char_length(btrim(title)) BETWEEN 12 AND 160
  AND title !~* '(https?://|www\.)'
  AND char_length(btrim(body)) BETWEEN 40 AND 12000
 ))
);

ALTER POLICY tc_reply_submit ON public.tc_forum_replies TO authenticated
WITH CHECK (
 author_id=(SELECT auth.uid()) AND status IN ('pending','published')
 AND EXISTS (
  SELECT 1 FROM public.tc_forum_topics t
  WHERE t.id=tc_forum_replies.topic_id AND t.status='published'
 )
 AND (status='pending' OR (
  nullif((SELECT auth.jwt())->>'email','') IS NOT NULL
  AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
  AND char_length(btrim(body)) BETWEEN 10 AND 6000
 ))
);

-- Before: SELECT published to {anon,authenticated}; own row to authenticated.
-- After: SAME OR predicate, one policy. Anon has no user-id claim.
ALTER POLICY tc_topic_public ON public.tc_forum_topics TO anon,authenticated
USING ((status='published') OR (author_id=(SELECT auth.uid())));
DROP POLICY tc_topic_own ON public.tc_forum_topics;

ALTER POLICY tc_reply_public ON public.tc_forum_replies TO anon,authenticated
USING (
 ((status='published') AND EXISTS (
  SELECT 1 FROM public.tc_forum_topics t
  WHERE t.id=tc_forum_replies.topic_id AND t.status='published'
 ))
 OR (author_id=(SELECT auth.uid()))
);
DROP POLICY tc_reply_own ON public.tc_forum_replies;

ALTER POLICY tc_forum_media_published_read ON public.tc_forum_media TO anon,authenticated
USING (
 ((status='published') AND (
  (topic_id IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.tc_forum_topics t
   WHERE t.id=tc_forum_media.topic_id AND t.status='published'
  ))
  OR
  (reply_id IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.tc_forum_replies r
   JOIN public.tc_forum_topics t ON t.id=r.topic_id
   WHERE r.id=tc_forum_media.reply_id AND r.status='published'
     AND t.status='published'
  ))
 ))
 OR (author_id=(SELECT auth.uid()))
);
DROP POLICY tc_forum_media_owner_read ON public.tc_forum_media;

DO $post$
DECLARE n integer;
BEGIN
 SELECT COUNT(*) INTO n FROM pg_policies
 WHERE schemaname='public' AND cmd='SELECT' AND tablename IN
 ('tc_forum_topics','tc_forum_replies','tc_forum_media');
 IF n<>3 THEN RAISE EXCEPTION 'Expected exactly three read policies, got %',n; END IF;
 IF has_table_privilege('anon','public.tc_forum_topics','INSERT') OR
    has_table_privilege('anon','public.tc_forum_replies','INSERT') OR
    has_table_privilege('authenticated','public.tc_forum_topics','UPDATE') OR
    has_table_privilege('authenticated','public.tc_forum_replies','UPDATE')
 THEN RAISE EXCEPTION 'Forum privilege guard failed'; END IF;
 IF (SELECT reloptions @> ARRAY['security_invoker=true']
        FROM pg_class WHERE oid='public.tc_forum_localized_topics'::regclass)
        IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'Forum invoker view guard failed'; END IF;
END $post$;
