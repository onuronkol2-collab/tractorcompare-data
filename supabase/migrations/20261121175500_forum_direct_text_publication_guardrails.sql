-- TractorVS: verified signed-in members can publish TEXT immediately.
-- Approved photos keep their existing independent moderation gate.
-- Public views, ownership ACL, daily/hourly limits, RLS and opt-in translations remain.
BEGIN;
ALTER POLICY tc_topic_submit ON public.tc_forum_topics TO authenticated
WITH CHECK (
 author_id=(SELECT auth.uid()) AND
 status IN ('pending','published') AND
 (tractor_id IS NULL OR EXISTS (
  SELECT 1 FROM public.tractors t
  WHERE t.id=tc_forum_topics.tractor_id AND t.status='published'
 )) AND
 (status='pending' OR (
  nullif((SELECT auth.jwt()->>'email'),'') IS NOT NULL
  AND coalesce((SELECT auth.jwt()->>'is_anonymous'),'false')='false'
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
  nullif((SELECT auth.jwt()->>'email'),'') IS NOT NULL
  AND coalesce((SELECT auth.jwt()->>'is_anonymous'),'false')='false'
  AND char_length(btrim(body)) BETWEEN 10 AND 6000
 ))
);
-- Pending images can attach to a freshly published text post, but remain
-- private pending photo-specific rights and moderator approval.
ALTER POLICY tc_forum_media_own_reserve ON public.tc_forum_media TO authenticated
WITH CHECK (
 author_id=(SELECT auth.uid()) AND status='pending' AND license_confirmed=true
 AND (
  (topic_id IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.tc_forum_topics t WHERE t.id=tc_forum_media.topic_id
    AND t.author_id=(SELECT auth.uid()) AND t.status IN ('pending','published')
  ))
  OR (reply_id IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.tc_forum_replies r WHERE r.id=tc_forum_media.reply_id
    AND r.author_id=(SELECT auth.uid()) AND r.status IN ('pending','published')
  ))
 )
);
DO $qa$
BEGIN
 IF has_table_privilege('anon','public.tc_forum_topics','INSERT')
    OR has_table_privilege('anon','public.tc_forum_replies','INSERT')
    OR has_table_privilege('authenticated','public.tc_forum_topics','UPDATE')
    OR has_table_privilege('authenticated','public.tc_forum_replies','UPDATE')
    OR (SELECT reloptions @> ARRAY['security_invoker=true']
         FROM pg_class WHERE oid='public.tc_forum_localized_topics'::regclass)
       IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'Forum direct publication security guard failed'; END IF;
END $qa$;
COMMIT;
