-- Feature rollback protects member data: refuses to delete nonempty tables or avatars.
BEGIN;
DO $guard$
BEGIN
 IF EXISTS(SELECT 1 FROM public.tc_member_profiles LIMIT 1)
 OR EXISTS(SELECT 1 FROM public.tc_forum_helpful_votes LIMIT 1)
 OR EXISTS(SELECT 1 FROM public.tc_member_bookmarks LIMIT 1)
 OR EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='tc-forum-avatars')
 THEN RAISE EXCEPTION 'Member data exists: export and reconcile before destructive rollback'; END IF;
END $guard$;
DROP VIEW IF EXISTS public.tc_member_scores;
DROP TRIGGER IF EXISTS tc_helpful_vote_totals_insert ON public.tc_forum_helpful_votes;
DROP TRIGGER IF EXISTS tc_helpful_vote_totals_delete ON public.tc_forum_helpful_votes;
DROP TRIGGER IF EXISTS tc_helpful_vote_insert_limit ON public.tc_forum_helpful_votes;
DROP FUNCTION IF EXISTS public.tc_helpful_update_totals();
DROP FUNCTION IF EXISTS public.tc_helpful_vote_rate_limit();
DROP TABLE IF EXISTS public.tc_member_bookmarks;
DROP TABLE IF EXISTS public.tc_forum_reply_helpful_totals;
DROP TABLE IF EXISTS public.tc_forum_helpful_votes;
DROP TABLE IF EXISTS public.tc_member_profiles;
DELETE FROM storage.buckets WHERE id='tc-forum-avatars';
COMMIT;
