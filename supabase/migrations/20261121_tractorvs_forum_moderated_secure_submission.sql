-- TractorVS community: allow controlled, moderated UGC submission.
-- Existing RLS SELECT and public catalogue access remain unchanged.
-- No public schema definer function, no user_data metadata privilege escalation.
BEGIN;
GRANT INSERT (id, locale, category, tractor_id, title, body, slug, status, translation_consent)
ON public.tc_forum_topics TO authenticated;
GRANT INSERT (topic_id, body, status, translation_consent, source_locale)
ON public.tc_forum_replies TO authenticated;

ALTER POLICY tc_topic_submit ON public.tc_forum_topics TO authenticated
WITH CHECK (
 status = 'pending'
 AND author_id = (SELECT auth.uid())
 AND (tractor_id IS NULL OR EXISTS (
  SELECT 1 FROM public.tractors t WHERE t.id=tc_forum_topics.tractor_id AND t.status='published'
 ))
);
ALTER POLICY tc_reply_submit ON public.tc_forum_replies TO authenticated
WITH CHECK (
 status = 'pending' AND author_id = (SELECT auth.uid())
 AND EXISTS (SELECT 1 FROM public.tc_forum_topics t WHERE t.id=tc_forum_replies.topic_id AND t.status='published')
);

-- Machine translation requires opt-in; original text remains readable without consent.
CREATE OR REPLACE VIEW public.tc_forum_translation_sources
WITH (security_invoker=true) AS
SELECT 'topic'::text AS entity_kind,t.id AS entity_id,t.locale AS source_locale,
       t.title,t.body,md5(t.title||chr(31)||t.body) AS source_hash
FROM public.tc_forum_topics t
WHERE t.status='published' AND t.translation_consent IS TRUE
UNION ALL
SELECT 'reply'::text,r.id,COALESCE(r.source_locale,t.locale),
       NULL::text,r.body,md5(r.body)
FROM public.tc_forum_replies r JOIN public.tc_forum_topics t ON t.id=r.topic_id
WHERE r.status='published' AND r.translation_consent IS TRUE AND t.status='published';

CREATE OR REPLACE VIEW public.tc_forum_localized_topics
WITH (security_invoker=true) AS
SELECT t.id,t.id AS topic_id,l.locale,t.locale AS original_locale,t.slug,t.category,
       t.tractor_id,t.created_at,t.updated_at,t.status,
       CASE WHEN l.locale=t.locale THEN t.title ELSE tr.title END AS title,
       CASE WHEN l.locale=t.locale THEN t.body ELSE tr.body END AS body,
       CASE WHEN l.locale=t.locale THEN char_length(btrim(t.body))>=150
            ELSE COALESCE(tr.seo_approved,FALSE) END AS seo_ready,
       l.locale<>t.locale AS machine_translated
FROM public.tc_forum_topics t
CROSS JOIN (VALUES ('en'::text),('tr'::text),('zh'::text),('hi'::text),
 ('pt-br'::text),('fr'::text),('de'::text),('ru'::text),('ja'::text),('es'::text)) l(locale)
LEFT JOIN public.tc_forum_topic_translations tr
 ON tr.topic_id=t.id AND tr.locale=l.locale AND tr.state='ready'
 AND tr.source_hash=md5(t.title||chr(31)||t.body)
 AND t.translation_consent IS TRUE
WHERE t.status='published' AND (l.locale=t.locale OR tr.topic_id IS NOT NULL);

CREATE OR REPLACE VIEW public.tc_forum_localized_replies
WITH (security_invoker=true) AS
SELECT r.id,r.topic_id,l.locale,COALESCE(r.source_locale,t.locale) AS original_locale,
       r.created_at,r.status,
       CASE WHEN l.locale=COALESCE(r.source_locale,t.locale) THEN r.body ELSE tr.body END AS body,
       l.locale<>COALESCE(r.source_locale,t.locale) AS machine_translated
FROM public.tc_forum_replies r JOIN public.tc_forum_topics t ON t.id=r.topic_id
CROSS JOIN (VALUES ('en'::text),('tr'::text),('zh'::text),('hi'::text),
 ('pt-br'::text),('fr'::text),('de'::text),('ru'::text),('ja'::text),('es'::text)) l(locale)
LEFT JOIN public.tc_forum_reply_translations tr
 ON tr.reply_id=r.id AND tr.locale=l.locale AND tr.state='ready'
 AND tr.source_hash=md5(r.body)
 AND r.translation_consent IS TRUE
WHERE t.status='published' AND r.status='published'
AND (l.locale=COALESCE(r.source_locale,t.locale) OR tr.reply_id IS NOT NULL);

-- Prevent direct API reads of previously produced translations after opt-out.
ALTER POLICY tc_topic_translation_public ON public.tc_forum_topic_translations
USING (
 state='ready' AND EXISTS (
 SELECT 1 FROM public.tc_forum_topics t
 WHERE t.id=tc_forum_topic_translations.topic_id
  AND t.status='published' AND t.translation_consent IS TRUE
  AND t.locale <> tc_forum_topic_translations.locale
  AND tc_forum_topic_translations.source_hash=md5(t.title||chr(31)||t.body)
 )
);
ALTER POLICY tc_reply_translation_public ON public.tc_forum_reply_translations
USING (
 state='ready' AND EXISTS (
 SELECT 1 FROM public.tc_forum_replies r JOIN public.tc_forum_topics t ON t.id=r.topic_id
 WHERE r.id=tc_forum_reply_translations.reply_id
  AND r.status='published' AND r.translation_consent IS TRUE
  AND t.status='published'
  AND COALESCE(r.source_locale,t.locale) <> tc_forum_reply_translations.locale
  AND tc_forum_reply_translations.source_hash=md5(r.body)
 )
);

CREATE INDEX IF NOT EXISTS tc_forum_topics_author_created_idx
 ON public.tc_forum_topics(author_id,created_at DESC);
CREATE INDEX IF NOT EXISTS tc_forum_replies_author_created_idx
 ON public.tc_forum_replies(author_id,created_at DESC);

-- Invoker trigger sees only the signed-in author's existing posts under RLS.
CREATE OR REPLACE FUNCTION public.tc_forum_rate_limit_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog,public
AS $fn$
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
REVOKE ALL ON FUNCTION public.tc_forum_rate_limit_insert() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS tc_forum_topics_rate_limit ON public.tc_forum_topics;
CREATE TRIGGER tc_forum_topics_rate_limit BEFORE INSERT ON public.tc_forum_topics
FOR EACH ROW EXECUTE FUNCTION public.tc_forum_rate_limit_insert();
DROP TRIGGER IF EXISTS tc_forum_replies_rate_limit ON public.tc_forum_replies;
CREATE TRIGGER tc_forum_replies_rate_limit BEFORE INSERT ON public.tc_forum_replies
FOR EACH ROW EXECUTE FUNCTION public.tc_forum_rate_limit_insert();

DO $qa$
BEGIN
 IF NOT has_column_privilege('authenticated','public.tc_forum_topics','title','INSERT')
  OR NOT has_column_privilege('authenticated','public.tc_forum_replies','body','INSERT')
  OR has_column_privilege('anon','public.tc_forum_topics','title','INSERT')
  OR has_table_privilege('authenticated','public.tc_forum_topics','UPDATE')
  OR (SELECT count(*) FROM public.tc_forum_topics WHERE status='published') <> 0
 THEN RAISE EXCEPTION 'Forum least privilege / staging regression'; END IF;
 IF (SELECT reloptions @> ARRAY['security_invoker=true'] FROM pg_class WHERE oid='public.tc_forum_localized_topics'::regclass) IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'Forum view RLS invoker unexpectedly disabled'; END IF;
END $qa$;
COMMIT;