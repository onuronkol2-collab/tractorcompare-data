-- Revert only approved EN, without touching TR or other eight.
-- A static Cloudflare build already deployed must also be refreshed after rollback.
BEGIN;
DO $pre$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.tc_forum_topic_translations tr
 JOIN public.tc_forum_topics t ON t.id=tr.topic_id
 WHERE tr.topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND tr.locale='en'
 AND tr.state='ready' AND tr.seo_approved=true
 AND tr.source_hash='0102e8edcd864b285733fb30cad4d8f1'
 AND t.locale='tr' AND md5(t.title||chr(31)||t.body)=tr.source_hash;
 IF n<>1 THEN RAISE EXCEPTION 'STOP: EN release/source no longer matches'; END IF;
END $pre$;
UPDATE public.tc_forum_topic_translations
SET state='needs_review',seo_approved=false,reviewed_by_model=NULL,
qa_notes=concat_ws(E'\n',qa_notes,'EN publication rolled back; re-review required before returning to ready.')
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='en' AND source_hash='0102e8edcd864b285733fb30cad4d8f1'
 AND state='ready' AND seo_approved=true;
COMMIT;