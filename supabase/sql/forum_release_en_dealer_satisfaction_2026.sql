-- English-only TractorVS forum release. Never change the other eight private translations.
-- Requires a separately observed Google Translate full-text EN→TR backtranslation
-- and GPT-6's complete source/translation editorial adjudication. Not a human review.
BEGIN;
DO $gate$
DECLARE n integer; source_row record; en_row record; source_urls text[]; en_urls text[];
BEGIN
 SELECT t.title,t.body,s.source_hash INTO source_row
 FROM public.tc_forum_topics t JOIN public.tc_forum_translation_sources s
 ON s.entity_id=t.id AND s.entity_kind='topic'
 WHERE t.id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND t.status='published' AND t.locale='tr'
 AND t.translation_consent IS TRUE AND s.source_hash='0102e8edcd864b285733fb30cad4d8f1'
 AND md5(t.title||chr(31)||t.body)=s.source_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: source changed, missing or consent revoked'; END IF;

 SELECT * INTO en_row FROM public.tc_forum_topic_translations tr
 WHERE tr.topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND tr.locale='en'
 AND tr.state='needs_review' AND tr.seo_approved=false
 AND tr.reviewed_by_model IS NULL AND tr.source_hash=source_row.source_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: English draft changed unexpectedly'; END IF;

 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND state='needs_review' AND seo_approved=false
 AND source_hash='0102e8edcd864b285733fb30cad4d8f1' AND reviewed_by_model IS NULL;
 IF n<>9 THEN RAISE EXCEPTION 'STOP: expected nine private drafts, found %',n; END IF;

 IF public.tc_forum_fact_tokens(source_row.body)
     IS DISTINCT FROM public.tc_forum_fact_tokens(en_row.body)
    OR public.tc_forum_fact_tokens(source_row.title)
     IS DISTINCT FROM public.tc_forum_fact_tokens(en_row.title)
    OR public.tc_forum_language_issue(source_row.body,en_row.body,'en') IS NOT NULL
 THEN RAISE EXCEPTION 'STOP: factual or language quality failure'; END IF;

 SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[]) INTO source_urls
 FROM regexp_matches(source_row.body,'(https://[^[:space:]]+)','g') m;
 SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[]) INTO en_urls
 FROM regexp_matches(en_row.body,'(https://[^[:space:]]+)','g') m;
 IF source_urls IS DISTINCT FROM en_urls OR array_length(source_urls,1)<>4
 THEN RAISE EXCEPTION 'STOP: 2026 research source links have changed'; END IF;

 IF (SELECT count(*) FROM regexp_matches(source_row.body,'^#{2,3} ','gm')) <>
    (SELECT count(*) FROM regexp_matches(en_row.body,'^#{2,3} ','gm'))
 OR (SELECT count(*) FROM regexp_matches(source_row.body,'^[|]','gm')) <>
    (SELECT count(*) FROM regexp_matches(en_row.body,'^[|]','gm'))
 THEN RAISE EXCEPTION 'STOP: headings or table shape differ'; END IF;

 IF NOT(
   en_row.body LIKE '%| 🥇 1 | Same | **13.7** |%' AND
   en_row.body LIKE '%| 🥈 2 | Deutz-Fahr | **13.2** |%' AND
   en_row.body LIKE '%| 🥉 3 | CLAAS | **13.1** |%' AND
   en_row.body LIKE '%| 4 | John Deere | **13.0** |%' AND
   en_row.body LIKE '%| 5 | Case IH | **12.3** |%' AND
   en_row.body LIKE '%| 5 | Fendt | **12.3** |%' AND
   en_row.body LIKE '%| 7 | Kubota | **12.2** |%' AND
   en_row.body LIKE '%| 8 | New Holland | **11.8** |%' AND
   en_row.body LIKE '%| 9 | Massey Ferguson | **11.1** |%'
 ) THEN RAISE EXCEPTION 'STOP: brand/rank/score association differs'; END IF;
END $gate$;

UPDATE public.tc_forum_topic_translations tr
SET state='ready',
    seo_approved=true,
    reviewed_by_model='Google Translate independent EN-to-TR full-text backtranslation; GPT-6 complete editorial/source review',
    qa_notes=concat_ws(E'\n',tr.qa_notes,
    '2026-11-22 EN release: Google Translate independent second engine 9/9 complete EN-to-TR backtranslations; GPT-6 compared to Turkish source paragraph by paragraph, verified 2026 CLIMMAR/Mechaman/FADA/NAEDA evidence, nine rank-score pairs, four sources, technical terms, reverse translation and wording. Explicit user approval to launch English first. Machine+assistant review; NOT a human editor signoff. Other eight remain private.')
WHERE tr.topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND tr.locale='en'
AND tr.source_hash='0102e8edcd864b285733fb30cad4d8f1' AND tr.state='needs_review'
AND tr.seo_approved=false AND tr.reviewed_by_model IS NULL;

DO $post$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='en' AND state='ready' AND seo_approved=true
 AND reviewed_by_model LIKE 'Google Translate independent%';
 IF n<>1 THEN RAISE EXCEPTION 'STOP: English publication trigger did not approve'; END IF;
 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale<>'en' AND state='needs_review'
 AND seo_approved=false AND reviewed_by_model IS NULL;
 IF n<>8 THEN RAISE EXCEPTION 'STOP: another locale changed unexpectedly'; END IF;
END $post$;
COMMIT;