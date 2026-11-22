-- Read-only German-first staged publication verification (after EN).
DO $test$
DECLARE n integer; src record; de record;
BEGIN
 SELECT t.title,t.body,s.source_hash INTO src FROM public.tc_forum_topics t
 JOIN public.tc_forum_translation_sources s ON s.entity_kind='topic' AND s.entity_id=t.id
 WHERE t.id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND t.status='published' AND t.locale='tr'
 AND t.translation_consent IS TRUE AND s.source_hash='0102e8edcd864b285733fb30cad4d8f1';
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: source missing/changed'; END IF;
 SELECT * INTO de FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='de' AND state='ready'
 AND seo_approved=true AND reviewed_by_model LIKE 'Google Translate independent DE-to-TR%'
 AND source_hash=src.source_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: German release not approved or stale'; END IF;
 IF public.tc_forum_fact_tokens(src.title) IS DISTINCT FROM public.tc_forum_fact_tokens(de.title)
 OR public.tc_forum_fact_tokens(src.body) IS DISTINCT FROM public.tc_forum_fact_tokens(de.body)
 OR public.tc_forum_language_issue(src.body,de.body,'de') IS NOT NULL
 THEN RAISE EXCEPTION 'STOP: translation facts or locale regression'; END IF;
 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='en' AND state='ready' AND seo_approved=true;
 IF n<>1 THEN RAISE EXCEPTION 'STOP: English release regressed'; END IF;
 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale NOT IN ('en','de') AND state='needs_review'
 AND seo_approved=false AND reviewed_by_model IS NULL;
 IF n<>7 THEN RAISE EXCEPTION 'STOP: seven private translations unexpectedly affected'; END IF;
 IF (SELECT count(*) FROM public.tc_forum_localized_topics WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706')<>3
 THEN RAISE EXCEPTION 'STOP: forum public view not exactly 3 locales'; END IF;
END $test$;
BEGIN;
SET LOCAL ROLE anon;
SELECT locale,slug,seo_ready,machine_translated,char_length(title) title_chars,char_length(body) body_chars
FROM public.tc_forum_localized_topics
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' ORDER BY locale;
SELECT count(*)::integer AS accessible_translation_rows
FROM public.tc_forum_topic_translations WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706';
ROLLBACK;