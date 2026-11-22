-- TractorVS forum translations: read-only privacy and publication regression.
-- Reviewed after 22 Nov 2026 manual ChatGPT translation workflow.
-- No writes, model API requests, secret exposure, state transitions or publication.
-- Can be run directly from Supabase SQL editor with an administrator role.
DO $guard$
DECLARE
  v_policy text;
  v_view text;
  v_options text[];
  leaked_rows integer;
BEGIN
  SELECT qual INTO v_policy FROM pg_policies
   WHERE schemaname='public'
     AND tablename='tc_forum_topic_translations'
     AND policyname='tc_topic_translation_public' AND cmd='SELECT';
  IF v_policy IS NULL OR position('seo_approved IS TRUE' IN v_policy)=0
    OR position('state = ''ready''' IN v_policy)=0
    OR position('tc_forum_topic_translations.locale' IN v_policy)=0
    OR position('source_hash' IN v_policy)=0
  THEN RAISE EXCEPTION 'Forum public translation SELECT RLS is weaker than expected'; END IF;

  SELECT pg_get_viewdef('public.tc_forum_localized_topics'::regclass,true),
         reloptions
    INTO v_view,v_options
    FROM pg_class WHERE oid='public.tc_forum_localized_topics'::regclass;
  IF v_view IS NULL
    OR NOT coalesce('security_invoker=true'=ANY(v_options),FALSE)
    OR position('tr.state = ''ready''' IN v_view)=0
    OR position('tr.seo_approved IS TRUE' IN v_view)=0
    OR position('tr.source_hash' IN v_view)=0
  THEN RAISE EXCEPTION 'Forum localized view may expose untranslated/unapproved posts'; END IF;

  SELECT count(*) INTO leaked_rows
  FROM public.tc_forum_localized_topics v
  JOIN public.tc_forum_topic_translations tr
    ON tr.topic_id=v.topic_id AND tr.locale=v.locale
  WHERE tr.state <> 'ready' OR tr.seo_approved IS NOT TRUE
     OR tr.source_hash IS DISTINCT FROM md5(
       (select t.title||chr(31)||t.body from public.tc_forum_topics t where t.id=v.topic_id));
  IF leaked_rows <> 0 THEN
    RAISE EXCEPTION 'Unapproved/stale translation visible in localization view: %',leaked_rows;
  END IF;
END $guard$;

-- Read-only response. Expect 0 rows for any unpublished draft leakage.
SELECT count(*)::int AS leaked_draft_rows
FROM public.tc_forum_localized_topics v
JOIN public.tc_forum_topic_translations tr
ON tr.topic_id=v.topic_id AND tr.locale=v.locale
WHERE tr.state='needs_review' OR tr.seo_approved IS NOT TRUE;

-- Inspect just the source and consent status before any future human editorial approval.
SELECT t.id,t.locale,t.status,t.translation_consent,
       count(tr.locale) FILTER (WHERE tr.state='needs_review' AND tr.seo_approved=false)::int
         AS private_locale_count,
       count(tr.locale) FILTER (WHERE tr.state='ready' AND tr.seo_approved=true)::int
         AS publishable_locale_count
FROM public.tc_forum_topics t
LEFT JOIN public.tc_forum_topic_translations tr ON tr.topic_id=t.id
WHERE t.id='713ab252-a925-4ab7-b2c8-a30ce5b86706'
GROUP BY t.id,t.locale,t.status,t.translation_consent;
