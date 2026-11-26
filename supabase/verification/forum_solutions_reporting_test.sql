\set ON_ERROR_STOP on
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","email":"a@example.invalid","is_anonymous":false}',false);
INSERT INTO public.tc_forum_accepted_solutions(topic_id,reply_id) VALUES ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001');
UPDATE public.tc_forum_accepted_solutions SET reply_id='20000000-0000-4000-8000-000000000002' WHERE topic_id='10000000-0000-4000-8000-000000000001';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.tc_forum_accepted_solutions WHERE reply_id='20000000-0000-4000-8000-000000000002') THEN RAISE EXCEPTION 'Owner replacement failed'; END IF;
 BEGIN
  UPDATE public.tc_forum_accepted_solutions SET reply_id='20000000-0000-4000-8000-000000000003';
  RAISE EXCEPTION 'Cross-topic reply accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.tc_forum_accepted_solutions SET reply_id='20000000-0000-4000-8000-000000000004';
  RAISE EXCEPTION 'Pending reply accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_accepted_solutions(topic_id,reply_id) VALUES ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003');
  RAISE EXCEPTION 'Foreign topic modified';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_accepted_solutions(topic_id,reply_id) VALUES ('10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005');
  RAISE EXCEPTION 'News accepted as question';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.tc_forum_accepted_solutions SET topic_id='10000000-0000-4000-8000-000000000002';
  RAISE EXCEPTION 'Topic key mutable';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES ('10000000-0000-4000-8000-000000000001','spam');
INSERT INTO public.tc_forum_content_reports(topic_id,reply_id,reason) VALUES ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','unsafe');
DO $$ BEGIN
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES ('10000000-0000-4000-8000-000000000001','other');
  RAISE EXCEPTION 'Duplicate topic report accepted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reply_id,reason) VALUES ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','spam');
  RAISE EXCEPTION 'Cross-topic report accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES ('10000000-0000-4000-8000-000000000003','spam');
  RAISE EXCEPTION 'Hidden topic report accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reason,status) VALUES ('10000000-0000-4000-8000-000000000002','spam','reviewed');
  RAISE EXCEPTION 'Reporter can set moderation status';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM id FROM public.tc_forum_content_reports;
  RAISE EXCEPTION 'Report contents disclosed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reason,reporter_id) VALUES ('10000000-0000-4000-8000-000000000002','spam','00000000-0000-4000-8000-000000000002');
  RAISE EXCEPTION 'Reporter spoofing accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","email":"b@example.invalid","is_anonymous":false}',false);
DO $$ BEGIN
 UPDATE public.tc_forum_accepted_solutions SET reply_id='20000000-0000-4000-8000-000000000001';
 IF FOUND THEN RAISE EXCEPTION 'Foreign solution updated'; END IF;
 DELETE FROM public.tc_forum_accepted_solutions;
 IF FOUND THEN RAISE EXCEPTION 'Foreign solution deleted'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","email":"b@example.invalid","is_anonymous":true}',false);
DO $$ BEGIN
 BEGIN
  INSERT INTO public.tc_forum_content_reports(topic_id,reason) VALUES ('10000000-0000-4000-8000-000000000002','spam');
  RAISE EXCEPTION 'Anonymous account report accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.tc_forum_accepted_solutions(topic_id,reply_id) VALUES ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003');
  RAISE EXCEPTION 'Anonymous account solution accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{}',false);
SET ROLE anon;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.tc_forum_accepted_solutions)<>1 THEN RAISE EXCEPTION 'Public solution absent'; END IF;
 BEGIN
  PERFORM id FROM public.tc_forum_content_reports;
  RAISE EXCEPTION 'Anonymous report disclosure';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE service_role;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.tc_forum_content_reports)<>2 THEN RAISE EXCEPTION 'Moderation records missing'; END IF;
 UPDATE public.tc_forum_content_reports SET status='reviewed' WHERE reason='spam';
END $$;
RESET ROLE;
UPDATE public.tc_forum_replies SET status='pending' WHERE id='20000000-0000-4000-8000-000000000002';
SET ROLE anon;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.tc_forum_accepted_solutions) THEN RAISE EXCEPTION 'Hidden reply still visible as solution'; END IF; END $$;
RESET ROLE;
UPDATE public.tc_forum_replies SET status='published' WHERE id='20000000-0000-4000-8000-000000000002';
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","email":"a@example.invalid","is_anonymous":false}',false);
DELETE FROM public.tc_forum_accepted_solutions WHERE topic_id='10000000-0000-4000-8000-000000000001';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.tc_forum_accepted_solutions) THEN RAISE EXCEPTION 'Owner cannot remove solution'; END IF; END $$;
RESET ROLE;
SELECT 'Solution and private report security fixture passed' AS result;
