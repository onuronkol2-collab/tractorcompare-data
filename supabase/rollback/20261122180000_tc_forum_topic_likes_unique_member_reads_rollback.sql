-- MANUAL ROLLBACK ONLY. Refuse any loss of user engagement data.
BEGIN;
DO $safe$
BEGIN
 IF (SELECT count(*) FROM public.tc_forum_topic_likes)>0 OR
    (SELECT count(*) FROM public.tc_forum_topic_member_reads)>0 OR
    (SELECT count(*) FROM public.tc_forum_topic_like_quotas)>0 OR
    (SELECT count(*) FROM public.tc_forum_topic_engagement_totals)>0 THEN
  RAISE EXCEPTION 'Topic engagement data exists: refusing destructive rollback';
 END IF;
END;
$safe$;
DROP TABLE IF EXISTS public.tc_forum_topic_member_reads;
DROP TABLE IF EXISTS public.tc_forum_topic_likes;
DROP TABLE IF EXISTS public.tc_forum_topic_like_quotas;
DROP TABLE IF EXISTS public.tc_forum_topic_engagement_totals;
DROP FUNCTION IF EXISTS public.tc_topic_engagement_count();
DROP FUNCTION IF EXISTS public.tc_topic_like_rate_limit();
COMMIT;
