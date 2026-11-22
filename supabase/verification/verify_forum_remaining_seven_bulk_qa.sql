-- TractorVS 2026: seven-language bulk editorial QA across staged releases, READ ONLY.
-- Validates approved and pending translations without changing status or exposing drafts.
-- Historical pre-release audit PR #421; staged release PR #424. Revalidate source hash upon original edit.
DO $qa$
DECLARE
 target_topic constant uuid := '713ab252-a925-4ab7-b2c8-a30ce5b86706';
 expected_hash constant text := '0102e8edcd864b285733fb30cad4d8f1';
 source_row record; draft record;
 n integer; source_links text[]; translated_links text[];
 source_pairs text[]; translated_pairs text[];
BEGIN
 SELECT t.title,t.body,t.locale,t.status,t.translation_consent,
        s.source_hash INTO source_row
 FROM public.tc_forum_topics t
 JOIN public.tc_forum_translation_sources s
 ON s.entity_id=t.id AND s.entity_kind='topic'
 WHERE t.id=target_topic AND t.locale='tr' AND t.status='published'
 AND t.translation_consent IS TRUE AND s.source_hash=expected_hash
 AND md5(t.title||chr(31)||t.body)=s.source_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: Source changed or consent unavailable'; END IF;

 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id=target_topic AND locale IN ('es','fr','hi','ja','pt-br','ru','zh');
 IF n<>7 THEN RAISE EXCEPTION 'STOP: expected exactly seven target drafts, found %',n; END IF;
 SELECT count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id=target_topic AND locale IN ('en','de')
 AND state='ready' AND seo_approved=true AND source_hash=expected_hash
 AND nullif(btrim(reviewed_by_model),'') IS NOT NULL;
 IF n<>2 THEN RAISE EXCEPTION 'STOP: EN/DE release state differs'; END IF;

 SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[])
 INTO source_links FROM regexp_matches(source_row.body,'(https://[^[:space:]]+)','g') m;
 IF cardinality(source_links)<>4 THEN RAISE EXCEPTION 'STOP: source URLs not four'; END IF;

 SELECT coalesce(array_agg(
   (regexp_match(split_part(line,'|',2),'[0-9]+'))[1] || ':' ||
   btrim(split_part(line,'|',3)) || ':' ||
   replace(regexp_replace(split_part(line,'|',4),'[^0-9,.]','','g'),',','.')
   ORDER BY btrim(split_part(line,'|',3))
  ),ARRAY[]::text[]) INTO source_pairs
 FROM regexp_split_to_table(source_row.body,E'\n') line
 WHERE btrim(split_part(line,'|',3))=ANY(ARRAY[
 'Same','Deutz-Fahr','CLAAS','John Deere','Case IH','Fendt','Kubota',
 'New Holland','Massey Ferguson']);
 IF cardinality(source_pairs)<>9 THEN
  RAISE EXCEPTION 'STOP: Source brand rankings count changed %',cardinality(source_pairs);
 END IF;

 FOR draft IN SELECT locale,title,body,source_hash,state,seo_approved,reviewed_by_model
   FROM public.tc_forum_topic_translations
   WHERE topic_id=target_topic AND locale IN ('es','fr','hi','ja','pt-br','ru','zh')
   ORDER BY locale
 LOOP
  IF draft.source_hash IS DISTINCT FROM expected_hash
  THEN RAISE EXCEPTION 'STOP: Source hash changed for %',draft.locale; END IF;
  IF draft.state='ready' THEN
    IF draft.seo_approved IS DISTINCT FROM true
     OR nullif(btrim(draft.reviewed_by_model),'') IS NULL
    THEN RAISE EXCEPTION 'STOP: Approved locale missing SEO/review provenance %',draft.locale; END IF;
  ELSIF draft.state='needs_review' THEN
    IF draft.seo_approved IS DISTINCT FROM false OR draft.reviewed_by_model IS NOT NULL
    THEN RAISE EXCEPTION 'STOP: Pending locale leaked review/SEO approval %',draft.locale; END IF;
  ELSE RAISE EXCEPTION 'STOP: Unknown translation state %',draft.locale;
  END IF;

  IF public.tc_forum_fact_tokens(source_row.title)
    IS DISTINCT FROM public.tc_forum_fact_tokens(draft.title)
   OR public.tc_forum_language_issue(source_row.body,draft.body,draft.locale) IS NOT NULL
  THEN RAISE EXCEPTION 'STOP: title facts or language guard failed for %',draft.locale; END IF;

  IF (CASE WHEN draft.locale IN ('fr','ru')
       THEN public.tc_forum_locale_grouping_facts_equal(source_row.body,draft.body,draft.locale)
       WHEN draft.locale IN ('zh','ja')
       THEN public.tc_forum_contextual_facts_equal(source_row.body,draft.body,draft.locale)
       ELSE public.tc_forum_fact_tokens(source_row.body)=public.tc_forum_fact_tokens(draft.body)
       END) IS NOT TRUE
  THEN RAISE EXCEPTION 'STOP: factual numbers, date, or units differ for %',draft.locale; END IF;

  SELECT coalesce(array_agg(m[1] ORDER BY m[1]),ARRAY[]::text[])
  INTO translated_links FROM regexp_matches(draft.body,'(https://[^[:space:]]+)','g') m;
  IF translated_links IS DISTINCT FROM source_links
  THEN RAISE EXCEPTION 'STOP: source URLs changed in %',draft.locale; END IF;

  IF (SELECT count(*) FROM regexp_matches(source_row.body,'^#{2,3}[[:space:]]','gm'))<>
     (SELECT count(*) FROM regexp_matches(draft.body,'^#{2,3}[[:space:]]','gm'))
   OR (SELECT count(*) FROM regexp_matches(source_row.body,'^[|]','gm'))<>
     (SELECT count(*) FROM regexp_matches(draft.body,'^[|]','gm'))
   OR cardinality(regexp_split_to_array(draft.body,E'\n\n'))<>96
  THEN RAISE EXCEPTION 'STOP: heading, table, or paragraph structure differs in %',draft.locale; END IF;

  SELECT coalesce(array_agg(
   (regexp_match(split_part(line,'|',2),'[0-9]+'))[1] || ':' ||
   btrim(split_part(line,'|',3)) || ':' ||
   replace(regexp_replace(split_part(line,'|',4),'[^0-9,.]','','g'),',','.')
   ORDER BY btrim(split_part(line,'|',3))
  ),ARRAY[]::text[]) INTO translated_pairs
  FROM regexp_split_to_table(draft.body,E'\n') line
  WHERE btrim(split_part(line,'|',3))=ANY(ARRAY[
  'Same','Deutz-Fahr','CLAAS','John Deere','Case IH','Fendt','Kubota',
  'New Holland','Massey Ferguson']);
  IF translated_pairs IS DISTINCT FROM source_pairs
  THEN RAISE EXCEPTION 'STOP: Wrong brand/rank/score mapping in %',draft.locale; END IF;

  IF draft.body ~* '<[[:space:]]*(script|iframe|object)|javascript:|data:[[:space:]]*text/html'
   OR position('Dealer''s Choice' in draft.body)=0 OR position('Gold Level' in draft.body)=0
   OR position('Yanmar' in draft.body)=0 OR position('TYM' in draft.body)=0
  THEN RAISE EXCEPTION 'STOP: unsafe markup or award identity in %',draft.locale; END IF;
 END LOOP;
 -- Public projection must equal the original plus source-hash-matched approved translations.
 SELECT 1+count(*) INTO n FROM public.tc_forum_topic_translations
 WHERE topic_id=target_topic AND locale IN ('en','de','es','fr','hi','ja','pt-br','ru','zh')
 AND source_hash=expected_hash AND state='ready' AND seo_approved IS TRUE
 AND nullif(btrim(reviewed_by_model),'') IS NOT NULL;
 IF (SELECT count(*) FROM public.tc_forum_localized_topics WHERE topic_id=target_topic)<>n
 THEN RAISE EXCEPTION 'STOP: public locale count differs from approved review states'; END IF;
END $qa$;

-- Anon must see source plus approved locales, never pending drafts.
BEGIN;
SET LOCAL ROLE anon;
SELECT locale,seo_ready,slug
FROM public.tc_forum_localized_topics
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706'
ORDER BY locale;
ROLLBACK;