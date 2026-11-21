-- Emergency rollback: revert site PR before running this SQL to avoid blocked posts.
-- Existing published posts are not deleted or changed.
BEGIN;
ALTER POLICY tc_topic_submit ON public.tc_forum_topics TO authenticated
WITH CHECK (
 status='pending' AND author_id=(SELECT auth.uid())
 AND (tractor_id IS NULL OR EXISTS (
  SELECT 1 FROM public.tractors t WHERE t.id=tc_forum_topics.tractor_id AND t.status='published'
 ))
);
ALTER POLICY tc_reply_submit ON public.tc_forum_replies TO authenticated
WITH CHECK (
 status='pending' AND author_id=(SELECT auth.uid())
 AND EXISTS (
  SELECT 1 FROM public.tc_forum_topics t
  WHERE t.id=tc_forum_replies.topic_id AND t.status='published'
 )
);
ALTER POLICY tc_forum_media_own_reserve ON public.tc_forum_media TO authenticated
WITH CHECK (
 author_id=(SELECT auth.uid()) AND status='pending' AND license_confirmed=true
 AND (
  (topic_id IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.tc_forum_topics t WHERE t.id=tc_forum_media.topic_id
    AND t.author_id=(SELECT auth.uid()) AND t.status='pending'
  ))
  OR (reply_id IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.tc_forum_replies r WHERE r.id=tc_forum_media.reply_id
    AND r.author_id=(SELECT auth.uid()) AND r.status='pending'
  ))
 )
);
COMMIT;
