-- READ ONLY: run after installing the guarded topic engagement migration.
DO $verify$
DECLARE tbl text; policy_count int;
BEGIN
 FOREACH tbl IN ARRAY ARRAY[
  'tc_forum_topic_likes','tc_forum_topic_member_reads',
  'tc_forum_topic_like_quotas','tc_forum_topic_engagement_totals'
 ] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_tables
   WHERE schemaname='public' AND tablename=tbl AND rowsecurity=true) THEN
   RAISE EXCEPTION 'Engagement RLS missing on %',tbl;
  END IF;
 END LOOP;
 SELECT count(*) INTO policy_count FROM pg_policies
 WHERE schemaname='public' AND tablename='tc_forum_topic_engagement_totals'
  AND cmd='SELECT' AND qual LIKE '%published%';
 IF policy_count<>1 THEN RAISE EXCEPTION 'Published-only totals guard missing'; END IF;
 IF has_table_privilege('anon','public.tc_forum_topic_likes','SELECT') OR
    has_table_privilege('anon','public.tc_forum_topic_member_reads','SELECT') OR
    has_table_privilege('anon','public.tc_forum_topic_like_quotas','SELECT') OR
    has_table_privilege('authenticated','public.tc_forum_topic_engagement_totals','INSERT') OR
    has_table_privilege('authenticated','public.tc_forum_topic_engagement_totals','UPDATE') THEN
  RAISE EXCEPTION 'Topic engagement roles exceed allowed access';
 END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.tc_forum_topic_likes'::regclass
      AND NOT tgisinternal)<>3 THEN RAISE EXCEPTION 'Topic like triggers missing'; END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.tc_forum_topic_member_reads'::regclass
      AND NOT tgisinternal)<>2 THEN RAISE EXCEPTION 'Topic reads triggers missing'; END IF;
END;
$verify$;
SELECT 'topic_engagement_guarded' result,
 (SELECT count(*) FROM public.tc_forum_topic_likes) likes,
 (SELECT count(*) FROM public.tc_forum_topic_member_reads) unique_member_reads,
 (SELECT count(*) FROM public.tc_forum_topic_engagement_totals) aggregate_rows;
