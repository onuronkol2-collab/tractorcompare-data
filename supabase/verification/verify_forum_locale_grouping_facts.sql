-- TractorVS private forum language QA, read-only. DO NOT PUBLISH.
DO $$
DECLARE
 src text;
 fr text;
 ru text;
 n int;
BEGIN
 select body into src from public.tc_forum_topics
 where id='713ab252-a925-4ab7-b2c8-a30ce5b86706'
 and status='published' and locale='tr' and translation_consent=true
 and md5(title||chr(31)||body)='0102e8edcd864b285733fb30cad4d8f1';
 if src is null then raise exception 'Source changed';end if;
 select body into fr from public.tc_forum_topic_translations where topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' and locale='fr';
 select body into ru from public.tc_forum_topic_translations where topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' and locale='ru';
 if fr is null or ru is null
   or not public.tc_forum_locale_grouping_facts_equal(src,fr,'fr')
   or not public.tc_forum_locale_grouping_facts_equal(src,ru,'ru')
 then raise exception 'French/Russian number translation failed';end if;

 if public.tc_forum_locale_grouping_facts_equal('2.045 1.745 1.000 13,7','2 046 1 745 1 000 13,7','fr')
 or public.tc_forum_locale_grouping_facts_equal('2.045 1.745 1.000 13,7','2 045 1 745 1 000 13,8','ru')
 or public.tc_forum_locale_grouping_facts_equal('1 Eylül 2026 2.045','1er octobre 2026 2 045','fr')
 or public.tc_forum_locale_grouping_facts_equal('75 hp 2.045','75 PS 2 045','fr')
 or public.tc_forum_locale_grouping_facts_equal('75 hp 2.045','75 hp 2 045','de')
 then raise exception 'Adversarial change accepted';end if;
 if not public.tc_forum_locale_grouping_facts_equal('2.045 1.745 1.000 13,7','2 045 1 745 1 000 13,7','fr')
 or not public.tc_forum_locale_grouping_facts_equal('2.045 1.745 1.000 13,7','2 045 1 745 1 000 13,7','ru')
 then raise exception 'Legitimate grouping blocked';end if;

 if has_function_privilege('anon','public.tc_forum_locale_grouping_facts_equal(text,text,text)','EXECUTE')
 or has_function_privilege('authenticated','public.tc_forum_locale_grouping_facts_equal(text,text,text)','EXECUTE')
 then raise exception 'Public function EXECUTE unexpectedly enabled';end if;

 select count(*) into n from public.tc_forum_topic_translations
 where topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' and state='needs_review'
 and seo_approved=false and reviewed_by_model is null;
 if n<>9 then raise exception 'Expected 9 private drafts, got %',n;end if;

 if position('tc_forum_locale_grouping_facts_equal' in pg_get_functiondef('public.tc_forum_review_translation_facts'::regproc))=0
 then raise exception 'Trigger not updated';end if;
END$$;

BEGIN;
SET LOCAL ROLE anon;
SELECT locale,seo_ready FROM public.tc_forum_localized_topics
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706';
ROLLBACK;