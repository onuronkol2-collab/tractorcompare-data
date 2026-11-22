-- READ ONLY — TractorVS locale/date QA regression and anonymous RLS guard.
-- Never mark translations ready, never call model APIs and never change rows.
DO $checks$
DECLARE
 s record;
 tr record;
 v_def text;
 v_fail integer;
 v_qual text;
BEGIN
 SELECT entity_id,source_hash,body INTO s
 FROM public.tc_forum_translation_sources
 WHERE entity_kind='topic' AND entity_id='713ab252-a925-4ab7-b2c8-a30ce5b86706';
 IF NOT FOUND OR s.source_hash <> '0102e8edcd864b285733fb30cad4d8f1'
 THEN RAISE EXCEPTION 'Source missing/changed; STOP'; END IF;

 IF NOT EXISTS(SELECT 1 FROM public.tc_forum_topics WHERE id=s.entity_id
               AND status='published' AND translation_consent is true AND locale='tr')
 THEN RAISE EXCEPTION 'Source consent/status changed'; END IF;

 SELECT count(*) INTO v_fail
 FROM public.tc_forum_topic_translations t WHERE t.topic_id=s.entity_id
 AND (t.state<>'needs_review' OR t.seo_approved IS TRUE
      OR t.reviewed_by_model IS NOT NULL OR t.source_hash<>s.source_hash);
 IF v_fail>0 THEN RAISE EXCEPTION 'Unreviewed publication-state regression'; END IF;

 IF (SELECT count(*) FROM public.tc_forum_topic_translations WHERE topic_id=s.entity_id)<>9
 THEN RAISE EXCEPTION 'Expected exactly nine private translations'; END IF;

 SELECT count(*) INTO v_fail
 FROM public.tc_forum_topic_translations t WHERE t.topic_id=s.entity_id
 AND (
  CASE WHEN t.locale IN ('fr','zh','ja')
   THEN NOT public.tc_forum_contextual_facts_equal(s.body,t.body,t.locale)
   ELSE public.tc_forum_fact_tokens(s.body)<>public.tc_forum_fact_tokens(t.body)
  END
 );
 IF v_fail<>0 THEN RAISE EXCEPTION 'Unexpected factual difference in % drafts',v_fail; END IF;

 -- Targeted adversarial cases: all of these MUST fail, despite matching most numbers.
 IF NOT public.tc_forum_contextual_facts_equal(
      '1 Eylül 2026, 75 hp, 3000 kg','1er septembre 2026, 75 hp, 3000 kg','fr')
 OR public.tc_forum_contextual_facts_equal(
      '1 Eylül 2026, 75 hp','1er octobre 2026, 75 hp','fr')
 OR public.tc_forum_contextual_facts_equal(
      '1 Eylül 2026, 75 hp','1er septembre 2027, 75 hp','fr')
 OR public.tc_forum_contextual_facts_equal(
      '1 Eylül 2026, 75 hp','1er septembre 2026, 75 PS','fr')
 THEN RAISE EXCEPTION 'French date, year or physical-unit QA is unsafe'; END IF;

 IF NOT public.tc_forum_contextual_facts_equal(
      '10 Kasım 2026. Nisan–Mayıs 2026. 75 hp. Model 5075E.',
      '2026年11月10日。2026年4月至5月。75 hp。型号5075E。','zh')
 OR public.tc_forum_contextual_facts_equal(
      '10 Kasım 2026. Nisan–Mayıs 2026. 75 hp.',
      '2026年11月11日。2026年4月至5月。75 hp。','zh')
 OR public.tc_forum_contextual_facts_equal(
      '10 Kasım 2026. Nisan–Mayıs 2026. 75 hp.',
      '2026年12月10日。2026年4月至5月。75 hp。','zh')
 OR public.tc_forum_contextual_facts_equal(
      '10 Kasım 2026. Nisan–Mayıs 2026. 75 hp.',
      '2026年11月10日。2026年4月至6月。75 hp。','zh')
 OR public.tc_forum_contextual_facts_equal(
      '10 Kasım 2026. Nisan–Mayıs 2026. 75 hp.',
      '2026年11月10日。2026年4月至5月。75 PS。','zh')
 THEN RAISE EXCEPTION 'CJK date range, day, month or unit QA is unsafe'; END IF;

 IF NOT public.tc_forum_contextual_facts_equal(
      '10 Kasım 2026. Nisan–Mayıs 2026. 75 hp.',
      '2026年11月10日。2026年4月から5月。75 hp。','ja')
 OR public.tc_forum_contextual_facts_equal(
      '10 Kasım 2026. Nisan–Mayıs 2026. 75 hp.',
      '2026年11月10日。2026年4月から6月。75 hp。','ja')
 THEN RAISE EXCEPTION 'Japanese date range QA is unsafe'; END IF;

 -- Reject arbitrary fabricated numbers outside a valid date.
 IF public.tc_forum_contextual_facts_equal('10 Kasım 2026. 75 hp.',
    '2026年11月10日。75 hp。不要な9988。','ja')
 THEN RAISE EXCEPTION 'Extra fabricated non-date number accepted'; END IF;

 SELECT pg_get_functiondef('public.tc_forum_review_translation_facts'::regproc) INTO v_def;
 IF position('source_row.source_locale=''tr''' in v_def)=0
    OR position('tc_forum_contextual_facts_equal' in v_def)=0
    OR position('public.tc_forum_fact_tokens' in v_def)=0
 THEN RAISE EXCEPTION 'Forum trigger is missing source-locale gate or legacy fallback'; END IF;

 IF has_function_privilege('anon','public.tc_forum_contextual_facts_equal(text,text,text)','EXECUTE')
 OR has_function_privilege('authenticated','public.tc_forum_contextual_facts_equal(text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'Private date comparator unexpectedly publicly executable'; END IF;

 SELECT qual INTO v_qual FROM pg_policies WHERE schemaname='public'
 AND tablename='tc_forum_topic_translations' AND policyname='tc_topic_translation_public';
 IF position('seo_approved IS TRUE' IN coalesce(v_qual,''))=0
 OR position('state = ''ready''' IN coalesce(v_qual,''))=0
 THEN RAISE EXCEPTION 'Public translation RLS gate weakened'; END IF;

 IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.tc_forum_localized_topics'::regclass
   AND 'security_invoker=true'=any(reloptions))
 THEN RAISE EXCEPTION 'Localized view lost security_invoker'; END IF;
END
$checks$;

-- Expect one original Turkish topic only; no translated topics visible.
BEGIN;
SET LOCAL ROLE anon;
SELECT locale,seo_ready FROM public.tc_forum_localized_topics
 WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' ORDER BY locale;
ROLLBACK;