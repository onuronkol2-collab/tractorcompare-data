-- Apply only after isolated regression and current production preflight.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='30s';
DO $guard$
BEGIN
 IF md5(pg_get_functiondef('public.tc_forum_rate_limit_insert()'::regprocedure)) IS DISTINCT FROM 'b25cd14f9d439e2c0978f9e496d01952'
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.tc_forum_topics'::regclass AND tgname='tc_forum_topics_rate_limit' AND tgenabled='O' AND tgfoid='public.tc_forum_rate_limit_insert()'::regprocedure)
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.tc_forum_replies'::regclass AND tgname='tc_forum_replies_rate_limit' AND tgenabled='O' AND tgfoid='public.tc_forum_rate_limit_insert()'::regprocedure)
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tc_forum_topics'::regclass)
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tc_forum_replies'::regclass)
 OR to_regprocedure('public.tc_forum_server_insert_guard()') IS NOT NULL
 THEN RAISE EXCEPTION 'Forum clock guard drift: review before applying'; END IF;
END
$guard$;
-- Invoker only. Existing authorization, moderation, content checks and
-- assisted publication remain unchanged. Trusted imports retain their dates.
CREATE FUNCTION public.tc_forum_server_insert_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $fn$
BEGIN
 IF TG_OP<>'INSERT' OR TG_TABLE_SCHEMA<>'public'
 OR TG_TABLE_NAME NOT IN ('tc_forum_topics','tc_forum_replies')
 THEN RAISE EXCEPTION 'Invalid forum clock trigger context'; END IF;
 IF current_user IN ('anon','authenticated') THEN
  IF auth.uid() IS NULL OR NEW.author_id IS DISTINCT FROM auth.uid() THEN
   RETURN NEW; -- Existing authorization trigger rejects the request.
  END IF;
  NEW.created_at := transaction_timestamp();
  IF TG_TABLE_NAME='tc_forum_topics' THEN
   NEW.updated_at := NEW.created_at;
  END IF;
 END IF;
 -- Serialize reply inserts for the same author before existing rate checks.
 IF TG_TABLE_NAME='tc_forum_replies' AND NEW.author_id IS NOT NULL THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.author_id::text,157232));
 END IF;
 RETURN NEW;
END
$fn$;
REVOKE ALL ON FUNCTION public.tc_forum_server_insert_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tc_forum_00_server_insert_guard BEFORE INSERT ON public.tc_forum_topics
 FOR EACH ROW EXECUTE FUNCTION public.tc_forum_server_insert_guard();
CREATE TRIGGER tc_forum_00_server_insert_guard BEFORE INSERT ON public.tc_forum_replies
 FOR EACH ROW EXECUTE FUNCTION public.tc_forum_server_insert_guard();
COMMIT;
