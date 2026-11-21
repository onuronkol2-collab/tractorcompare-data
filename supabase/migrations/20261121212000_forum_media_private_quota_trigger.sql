-- Safe private quota count. Members cannot SELECT author_id or storage_path
-- on tc_forum_media, so the anti-abuse trigger must count as its database owner.
-- This is an uncallable trigger-only function with explicit invoker identity
-- and operation checks, fixed search_path, and no exposed grants.
BEGIN;
SET LOCAL lock_timeout='8s';
CREATE OR REPLACE FUNCTION public.tc_forum_media_daily_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO '' AS $limit$
DECLARE n integer;
BEGIN
 IF TG_TABLE_SCHEMA<>'public' OR TG_TABLE_NAME<>'tc_forum_media'
  OR TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Invalid forum media trigger context'; END IF;
 IF (SELECT auth.uid()) IS NULL OR NEW.author_id IS DISTINCT FROM (SELECT auth.uid()) THEN
  RAISE EXCEPTION 'Forum media requires a valid authenticated member'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(NEW.author_id::text),20261121);
 SELECT count(*) INTO n FROM public.tc_forum_media
  WHERE author_id=NEW.author_id AND created_at>=now()-interval '24 hours';
 IF n>=12 THEN RAISE EXCEPTION 'Daily forum photo limit reached'; END IF;
 RETURN NEW;
END $limit$;
REVOKE ALL ON FUNCTION public.tc_forum_media_daily_limit() FROM PUBLIC,anon,authenticated;
DO $verify$
BEGIN
 IF (SELECT prosecdef FROM pg_proc WHERE oid='public.tc_forum_media_daily_limit()'::regprocedure) IS DISTINCT FROM true
 OR has_function_privilege('anon','public.tc_forum_media_daily_limit()','EXECUTE')
 OR has_function_privilege('authenticated','public.tc_forum_media_daily_limit()','EXECUTE')
 OR has_column_privilege('authenticated','public.tc_forum_media','author_id','SELECT')
 THEN RAISE EXCEPTION 'Media quota auth/privacy guard failed'; END IF;
END $verify$;
COMMIT;
