-- Only after confirming no later change to these objects.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='30s';
DROP TRIGGER tc_forum_00_server_insert_guard ON public.tc_forum_topics;
DROP TRIGGER tc_forum_00_server_insert_guard ON public.tc_forum_replies;
DROP FUNCTION public.tc_forum_server_insert_guard();
COMMIT;
