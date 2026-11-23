-- Read-only live-check after one-language release. No release side effects.
DO $gate$
DECLARE src record; en record; n integer;
BEGIN
 SELECT t.title,t.body,s.source_hash INTO src FROM public.tc_forum_topics t
 JOIN public.tc_forum_translation_sources s ON s.entity_kind='topic' AND s.entity_id=t.id
 WHERE t.id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND t.status='published' AND t.locale='tr'
 AND t.translation_consent AND s.source_hash='0102e8edcd864b285733fb30cad4d8f1';
 IF NOT FOUND THEN RAISE EXCEPTION 'source no longer valid'; END IF;
 SELECT * INTO en FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='en' AND state='ready'
 AND seo_approved=true AND source_hash=src.source_hash AND reviewed_by_model IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'EN not approved or stale'; END IF;
 IF public.tc_forum_fact_tokens(src.body)
 IS DISTINCT FROM public.tc_forum_fact_tokens(en.body)
 OR public.tc_forum_fact_tokens(src.title)
 IS DISTINCT FROM public.tc_forum_fact_tokens(en.title)
 OR public.tc_forum_language_issue(src.body,en.body,'en') IS NOT NULL
 THEN RAISE EXCEPTION 'EN facts/locale regression'; END IF;
 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale<>'en' AND state='needs_review'
 AND seo_approved=false AND reviewed_by_model IS NULL;
 IF n<>8 THEN RAISE EXCEPTION 'Other eight should remain hidden; got %',n; END IF;
 IF (SELECT count(*) FROM public.tc_forum_localized_topics WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706')<>2
 THEN RAISE EXCEPTION 'Localized view must contain only Turkish and English'; END IF;
END $gate$;
BEGIN;
SET LOCAL ROLE anon;
SELECT locale,slug,seo_ready,machine_translated,char_length(title) title_chars,char_length(body) body_chars
FROM public.tc_forum_localized_topics
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' ORDER BY locale;
ROLLBACK;