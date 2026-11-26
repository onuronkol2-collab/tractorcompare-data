\set ON_ERROR_STOP on
-- Synthetic fixture only; never run against the live database.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","email":"a@example.invalid","is_anonymous":false}',false);
DO $test$ BEGIN
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES('10000000-0000-4000-8000-000000000001','spam');
  RAISE EXCEPTION 'Disabled ingestion accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_moderation_members(member_id) VALUES('00000000-0000-4000-8000-000000000001');
  RAISE EXCEPTION 'Self-enrollment accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.tc_forum_reporting_settings SET enabled=true;
  RAISE EXCEPTION 'Client changed release switch';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
INSERT INTO public.tc_forum_moderation_members(member_id) VALUES('00000000-0000-4000-8000-000000000002');
UPDATE public.tc_forum_reporting_settings SET enabled=true;
SET ROLE authenticated;
INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES('10000000-0000-4000-8000-000000000001','spam');
INSERT INTO public.tc_forum_content_reports(topic_id,reply_id,reason) VALUES('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','unsafe');
INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES('10000000-0000-4000-8000-000000000001','other') ON CONFLICT DO NOTHING;
DO $test$ BEGIN
 IF EXISTS(SELECT id FROM public.tc_forum_content_reports) THEN RAISE EXCEPTION 'Ordinary member sees reports'; END IF;
 UPDATE public.tc_forum_content_reports SET status='reviewed';
 IF FOUND THEN RAISE EXCEPTION 'Ordinary member reviewed report'; END IF;
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reply_id,reason) VALUES('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','spam');
  RAISE EXCEPTION 'Cross-topic report accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES('10000000-0000-4000-8000-000000000003','spam');
  RAISE EXCEPTION 'Hidden topic report accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","email":"b@example.invalid","is_anonymous":false}',false);
DO $test$ BEGIN
 IF (SELECT count(id) FROM public.tc_forum_content_reports)<>2 THEN RAISE EXCEPTION 'Moderator queue missing'; END IF;
 BEGIN
  PERFORM reporter_id FROM public.tc_forum_content_reports;
  RAISE EXCEPTION 'Reporter identity disclosed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.tc_forum_content_reports SET reason='other';
  RAISE EXCEPTION 'Moderator can alter evidence';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.tc_forum_content_reports SET status='reviewed' WHERE reason='spam';
 IF NOT FOUND THEN RAISE EXCEPTION 'Moderator review failed'; END IF;
 UPDATE public.tc_forum_content_reports SET status='dismissed' WHERE reason='spam';
 IF FOUND THEN RAISE EXCEPTION 'Final decision overwritten'; END IF;
END $test$;
RESET ROLE;
DO $test$ BEGIN
 IF (SELECT count(*) FROM tc_forum_reporting_private.review_audit)<>1 THEN RAISE EXCEPTION 'Audit missing'; END IF;
 IF (SELECT reports_submitted FROM tc_forum_reporting_private.daily_report_quota WHERE reporter_id='00000000-0000-4000-8000-000000000001')<>2 THEN RAISE EXCEPTION 'Rejected report consumed quota'; END IF;
 IF (SELECT status FROM public.tc_forum_topics WHERE id='10000000-0000-4000-8000-000000000001')<>'published' THEN RAISE EXCEPTION 'Report changed content'; END IF;
END $test$;
UPDATE public.tc_forum_moderation_members SET active=false;
SET ROLE authenticated;
DO $test$ BEGIN
 IF EXISTS(SELECT id FROM public.tc_forum_content_reports) THEN RAISE EXCEPTION 'Revoked moderator sees reports'; END IF;
END $test$;
RESET ROLE;
SET ROLE anon;
DO $test$ BEGIN
 BEGIN PERFORM id FROM public.tc_forum_content_reports; RAISE EXCEPTION 'Guest queue access'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
-- Retention: remove expired pending and resolved reports, not public posts.
UPDATE public.tc_forum_content_reports SET created_at=now()-interval '91 days' WHERE status='pending';
UPDATE tc_forum_reporting_private.review_audit SET reviewed_at=now()-interval '31 days';
DO $test$ BEGIN
 IF tc_forum_reporting_private.prune_expired_reports()<>2 THEN RAISE EXCEPTION 'Retention wrong count'; END IF;
 IF EXISTS(SELECT 1 FROM tc_forum_reporting_private.review_audit) THEN RAISE EXCEPTION 'Expired audit retained'; END IF;
 IF (SELECT count(*) FROM public.tc_forum_topics)<>4 THEN RAISE EXCEPTION 'Retention removed topics'; END IF;
END $test$;
-- Independent fresh account quota under concurrent requests.
INSERT INTO public.tc_forum_topics(id,author_id,status,category)
SELECT ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'00000000-0000-4000-8000-000000000001','published','questions' FROM generate_series(1,12) n;
SELECT 'Moderation authorization, privacy and retention checks passed' AS result;
