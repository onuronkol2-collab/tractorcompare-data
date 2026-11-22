-- TractorVS read-only prepublication verification, 22 Nov 2026.
-- Requires no translation model, writes nothing, preserves RLS and private review.
-- A passing test is NOT independent linguistic editorial approval.
DO $audit$
DECLARE
  target_topic uuid := '713ab252-a925-4ab7-b2c8-a30ce5b86706';
  source_hash text := '0102e8edcd864b285733fb30cad4d8f1';
  src record; trg record;
  src_scores text[];
  target_scores text[];
  src_urls text[];
  target_urls text[];
  wrong integer;
  bad text[];
BEGIN
  SELECT title,body,locale,status,translation_consent,md5(title||chr(31)||body) AS hash
    INTO src FROM public.tc_forum_topics WHERE id=target_topic;
  IF NOT FOUND OR src.locale<>'tr' OR src.status<>'published'
     OR src.translation_consent IS NOT TRUE OR src.hash<>source_hash
  THEN RAISE EXCEPTION 'SOURCE changed or consent removed'; END IF;
  SELECT coalesce(array_agg(
     lower(btrim(split_part(l,'|',3)))||':'||
     (regexp_match(split_part(l,'|',2),'[0-9]+'))[1]||':'||
     replace(regexp_replace(btrim(split_part(l,'|',4)),'[*[:space:]]','','g'),',','.')
     ORDER BY lower(btrim(split_part(l,'|',3)))
   ),ARRAY[]::text[]) INTO src_scores
  FROM regexp_split_to_table(src.body,E'\n') l
  WHERE btrim(split_part(l,'|',3)) IN
    ('Same','Deutz-Fahr','CLAAS','John Deere','Case IH','Fendt',
     'Kubota','New Holland','Massey Ferguson')
  AND l like '|%|%|%|';
  IF coalesce(array_length(src_scores,1),0)<>9
  THEN RAISE EXCEPTION 'Expected 9 unique source score rows, got %',src_scores;END IF;

  SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[]) INTO src_urls
  FROM regexp_matches(src.body,'(https://[^[:space:]]+)','g') m;
  IF coalesce(array_length(src_urls,1),0)<>4 THEN
   RAISE EXCEPTION 'Source URL inventory changed';END IF;

  SELECT count(*) INTO wrong FROM public.tc_forum_topic_translations
  WHERE topic_id=target_topic;
  IF wrong<>9 THEN RAISE EXCEPTION 'Nine target drafts expected; got %',wrong;END IF;

  FOR trg IN SELECT locale,title,body,source_hash,state,seo_approved,reviewed_by_model,provider
    FROM public.tc_forum_topic_translations WHERE topic_id=target_topic ORDER BY locale
  LOOP
   IF trg.source_hash<>source_hash OR trg.state<>'needs_review'
      OR trg.seo_approved IS NOT FALSE OR trg.reviewed_by_model IS NOT NULL
      OR trg.provider<>'ChatGPT conversation (manual)'
   THEN RAISE EXCEPTION 'Unsafe draft metadata for %',trg.locale; END IF;
   SELECT coalesce(array_agg(
     lower(btrim(split_part(l,'|',3)))||':'||
     (regexp_match(split_part(l,'|',2),'[0-9]+'))[1]||':'||
     replace(regexp_replace(btrim(split_part(l,'|',4)),'[*[:space:]]','','g'),',','.')
     ORDER BY lower(btrim(split_part(l,'|',3)))
   ),ARRAY[]::text[]) INTO target_scores
   FROM regexp_split_to_table(trg.body,E'\n') l
   WHERE btrim(split_part(l,'|',3)) IN
    ('Same','Deutz-Fahr','CLAAS','John Deere','Case IH','Fendt',
     'Kubota','New Holland','Massey Ferguson')
   AND l like '|%|%|%|';
   IF src_scores IS DISTINCT FROM target_scores
   THEN RAISE EXCEPTION 'Brand/RANK/SCORE mismatch in %',trg.locale;END IF;

   SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[]) INTO target_urls
   FROM regexp_matches(trg.body,'(https://[^[:space:]]+)','g') m;
   IF target_urls IS DISTINCT FROM src_urls
   THEN RAISE EXCEPTION 'Source URLs changed in %',trg.locale;END IF;
   IF trg.locale IN ('fr','zh','ja') THEN
     IF public.tc_forum_contextual_facts_equal(src.body,trg.body,trg.locale) IS NOT TRUE
     THEN RAISE EXCEPTION 'Calendar facts differ in %',trg.locale;END IF;
   ELSE
     IF public.tc_forum_fact_tokens(src.body) IS DISTINCT FROM
        public.tc_forum_fact_tokens(trg.body)
     THEN RAISE EXCEPTION 'Source facts differ in %',trg.locale;END IF;
   END IF;
  END LOOP;
  -- No publish step. The linguistic review prerequisite remains unfulfilled.
END $audit$;

BEGIN;
SET LOCAL ROLE anon;
SELECT count(*)::int AS publicly_visible_translated_drafts
FROM public.tc_forum_topic_translations
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706';
SELECT locale,seo_ready FROM public.tc_forum_localized_topics
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' ORDER BY locale;
ROLLBACK;