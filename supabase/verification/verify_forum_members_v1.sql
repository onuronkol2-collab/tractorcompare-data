-- Read-only release gate: forum member privacy, score and avatar coverage.
SELECT c.relname table_name,c.relrowsecurity rls_enabled,
 has_table_privilege('anon',c.oid,'SELECT') anon_can_read,
 has_table_privilege('authenticated',c.oid,'SELECT') member_can_read
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN
 ('tc_member_profiles','tc_member_bookmarks','tc_forum_helpful_votes','tc_forum_reply_helpful_totals')
ORDER BY c.relname;
SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets
WHERE id='tc-forum-avatars';
SELECT count(*) profiles FROM public.tc_member_profiles;
SELECT count(*) helpful_votes FROM public.tc_forum_helpful_votes;
SELECT count(*) bookmarks FROM public.tc_member_bookmarks;
SELECT count(*) scores FROM public.tc_member_scores;
SELECT (SELECT count(*) FROM public.tc_forum_topics WHERE status='published') published_topics,
 (SELECT count(*) FROM public.tc_forum_replies WHERE status='published') published_replies;
