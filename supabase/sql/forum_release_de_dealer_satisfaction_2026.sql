-- TractorVS German-only forum translation release: fail-closed, fully reversible.
-- No human editor signoff claimed: independent Google Translate machine backtranslation
-- plus GPT-6 paragraph-by-paragraph editorial checking of the updated DE draft.
BEGIN;
DO $pre$
DECLARE src record; de record; num integer; urls_source text[]; urls_de text[];
BEGIN
 SELECT t.title,t.body,s.source_hash INTO src FROM public.tc_forum_topics t
 JOIN public.tc_forum_translation_sources s ON s.entity_kind='topic' AND s.entity_id=t.id
 WHERE t.id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND t.locale='tr' AND t.status='published' AND t.translation_consent IS TRUE
 AND s.source_hash='0102e8edcd864b285733fb30cad4d8f1' AND md5(t.title||chr(31)||t.body)=s.source_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: Turkish source, consent, or hash changed'; END IF;
 SELECT * INTO de FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='de' AND source_hash=src.source_hash
 AND title='Traktorhändler-Zufriedenheit 2026: Markenranking und Punktzahlen'
 AND state='needs_review' AND seo_approved=false AND reviewed_by_model IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: current reviewed German draft unavailable'; END IF;
 SELECT count(*) INTO num FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND state='ready' AND seo_approved=true AND locale='en';
 IF num<>1 THEN RAISE EXCEPTION 'STOP: previously released English translation changed'; END IF;
 SELECT count(*) INTO num FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND state='needs_review' AND seo_approved=false
 AND reviewed_by_model IS NULL AND source_hash='0102e8edcd864b285733fb30cad4d8f1';
 IF num<>8 THEN RAISE EXCEPTION 'STOP: expected exactly eight unpublished translations, found %',num; END IF;
 IF public.tc_forum_fact_tokens(src.title) IS DISTINCT FROM public.tc_forum_fact_tokens(de.title)
 OR public.tc_forum_fact_tokens(src.body) IS DISTINCT FROM public.tc_forum_fact_tokens(de.body)
 OR public.tc_forum_language_issue(src.body,de.body,'de') IS NOT NULL
 THEN RAISE EXCEPTION 'STOP: German number/title/language QA failed'; END IF;
 SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[]) INTO urls_source
 FROM regexp_matches(src.body,'(https://[^[:space:]]+)','g') m;
 SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[]) INTO urls_de
 FROM regexp_matches(de.body,'(https://[^[:space:]]+)','g') m;
 IF urls_source IS DISTINCT FROM urls_de OR coalesce(array_length(urls_source,1),0)<>4
 THEN RAISE EXCEPTION 'STOP: source URLs changed or are missing'; END IF;
 IF (SELECT count(*) FROM regexp_matches(src.body,'^#{2,3} ','gm'))<>
    (SELECT count(*) FROM regexp_matches(de.body,'^#{2,3} ','gm'))
 OR (SELECT count(*) FROM regexp_matches(src.body,'^[|]','gm'))<>
    (SELECT count(*) FROM regexp_matches(de.body,'^[|]','gm'))
 THEN RAISE EXCEPTION 'STOP: Markdown heading/table shape changed'; END IF;
 IF NOT(
 de.body LIKE '%| 🥇 1 | Same | **13,7** |%' AND
 de.body LIKE '%| 🥈 2 | Deutz-Fahr | **13,2** |%' AND
 de.body LIKE '%| 🥉 3 | CLAAS | **13,1** |%' AND
 de.body LIKE '%| 4 | John Deere | **13,0** |%' AND
 de.body LIKE '%| 5 | Case IH | **12,3** |%' AND
 de.body LIKE '%| 5 | Fendt | **12,3** |%' AND
 de.body LIKE '%| 7 | Kubota | **12,2** |%' AND
 de.body LIKE '%| 8 | New Holland | **11,8** |%' AND
 de.body LIKE '%| 9 | Massey Ferguson | **11,1** |%'
 ) THEN RAISE EXCEPTION 'STOP: nine brand/rank/score associations differ'; END IF;
 IF de.body NOT LIKE '%**Händlerzufriedenheit ist nicht dasselbe wie die Zuverlässigkeit eines Traktors.**%'
 OR de.body NOT LIKE '%**🏆 Yanmar — Dealer''s Choice**%'
 OR de.body NOT LIKE '%**🥇 TYM — Gold Level**%'
 OR de.body NOT LIKE '%2,6 % bei der Ausfallwahrscheinlichkeit%'
 OR de.body NOT LIKE '%10 teilnehmenden Ländern%'
 OR de.body NOT LIKE '%561 Antworten von Händlern aus acht europäischen Ländern%'
 THEN RAISE EXCEPTION 'STOP: German key semantic distinctions have changed'; END IF;
 IF (SELECT count(*) FROM public.tc_forum_localized_topics WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706')<>2
 THEN RAISE EXCEPTION 'STOP: public projection not EN/TR before DE'; END IF;
END $pre$;

UPDATE public.tc_forum_topic_translations tr
SET state='ready', seo_approved=true,
    reviewed_by_model='Google Translate independent DE-to-TR nine-section full-text backtranslation; GPT-6 editorial/source comparison',
    qa_notes=concat_ws(E'\n',tr.qa_notes,
    '2026-11-22 DE publication QA: independent Google Translate DE→TR full-text nine-section backtranslation (9/9); GPT-6 checked each section against the consented Turkish original, four 2026 sources, nine brand-score rows, dealer satisfaction vs reliability, NAEDA awards and Germany-appropriate language. Google backtranslation rendered Same as Turkish Aynı in one location and modified source Markdown; live German draft retained the correct brand/table. Approved German only under user-directed staged release. NOT a human expert signature.')
WHERE tr.topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND tr.locale='de' AND tr.source_hash='0102e8edcd864b285733fb30cad4d8f1'
AND tr.title='Traktorhändler-Zufriedenheit 2026: Markenranking und Punktzahlen'
AND tr.state='needs_review' AND tr.seo_approved=false AND tr.reviewed_by_model IS NULL;

DO $post$
DECLARE num integer;
BEGIN
 SELECT count(*) INTO num FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='de' AND state='ready' AND seo_approved=true
 AND reviewed_by_model LIKE 'Google Translate independent DE-to-TR%';
 IF num<>1 THEN RAISE EXCEPTION 'STOP: German publication trigger did not approve'; END IF;
 SELECT count(*) INTO num FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale NOT IN ('en','de') AND state='needs_review'
 AND seo_approved=false AND reviewed_by_model IS NULL;
 IF num<>7 THEN RAISE EXCEPTION 'STOP: any of the other seven private locales changed'; END IF;
 SELECT count(*) INTO num FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='en' AND state='ready' AND seo_approved=true;
 IF num<>1 THEN RAISE EXCEPTION 'STOP: English release was affected'; END IF;
 IF (SELECT count(*) FROM public.tc_forum_localized_topics WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706')<>3
 THEN RAISE EXCEPTION 'STOP: public projection should be exactly TR+EN+DE'; END IF;
END $post$;
COMMIT;