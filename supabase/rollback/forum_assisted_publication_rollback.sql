-- Revoke all delegated publication first. Preserve historical audit and topics.
BEGIN;
REVOKE EXECUTE ON FUNCTION tc_assisted_private.publish_topic(uuid,uuid,text,text,text,text,uuid) FROM postgres;
DROP FUNCTION tc_assisted_private.publish_topic(uuid,uuid,text,text,text,text,uuid);
UPDATE public.tc_forum_assisted_grants SET revoked=true WHERE NOT revoked;
REVOKE INSERT(owner_id) ON public.tc_forum_assisted_grants FROM authenticated;
CREATE OR REPLACE FUNCTION public.tc_forum_rate_limit_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'pg_catalog','public' AS $fn$
DECLARE n integer;
BEGIN
 IF auth.uid() IS NULL OR NEW.author_id IS DISTINCT FROM auth.uid() THEN
  RAISE EXCEPTION 'Authentication required';
 END IF;
 IF TG_TABLE_NAME='tc_forum_topics' THEN
  SELECT count(*) INTO n FROM public.tc_forum_topics
  WHERE author_id=auth.uid() AND created_at >= now()-interval '24 hours';
  IF n>=3 THEN RAISE EXCEPTION 'Daily forum topic limit reached'; END IF;
 ELSIF TG_TABLE_NAME='tc_forum_replies' THEN
  SELECT count(*) INTO n FROM public.tc_forum_replies
  WHERE author_id=auth.uid() AND created_at >= now()-interval '24 hours';
  IF n>=12 THEN RAISE EXCEPTION 'Daily forum reply limit reached'; END IF;
 END IF;
 RETURN NEW;
END $fn$;
COMMIT;
