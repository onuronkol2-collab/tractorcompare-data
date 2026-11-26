\set ON_ERROR_STOP on
-- Isolated fixture only. Use distinct fixture users and roll back all data.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","email":"fixture@example.invalid","is_anonymous":false}',true);
INSERT INTO public.tc_forum_topics(locale,category,title,body,slug,status,created_at,updated_at)
VALUES ('tr','questions','Fixture clock guard title','This synthetic forum body is sufficiently long for a database fixture.','stub','published',now()-interval '2 days',now()+interval '2 days');
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.tc_forum_topics WHERE author_id=auth.uid() AND created_at=transaction_timestamp() AND updated_at=transaction_timestamp())<>1
 THEN RAISE EXCEPTION 'Topic clock not server controlled'; END IF;
 BEGIN
  INSERT INTO public.tc_forum_topics(locale,category,title,body,slug,status,created_at)
  VALUES ('tr','questions','Fixture clock second topic','This synthetic forum body is sufficiently long for a database fixture.','stub','published',now()-interval '3 days');
  RAISE EXCEPTION 'Topic cooldown bypass';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'Please wait before creating another topic' THEN RAISE; END IF;
 END;
END
$test$;
INSERT INTO public.tc_forum_replies(created_at) VALUES(now()-interval '2 days');
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.tc_forum_replies WHERE author_id=auth.uid() AND created_at=transaction_timestamp())<>1
 THEN RAISE EXCEPTION 'Reply clock not server controlled'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory' AND pid=pg_backend_pid() AND granted AND classid=((hashtextextended(auth.uid()::text,157232)>>32)&4294967295)::oid AND objid=(hashtextextended(auth.uid()::text,157232)&4294967295)::oid AND objsubid=1)
 THEN RAISE EXCEPTION 'Reply serialization lock missing'; END IF;
 IF has_function_privilege('authenticated','public.tc_forum_server_insert_guard()','EXECUTE') THEN RAISE EXCEPTION 'Direct invocation granted'; END IF;
END
$test$;
RESET ROLE;
ROLLBACK;
SELECT 'Server timestamp and reply serialization fixture passed' AS result;
