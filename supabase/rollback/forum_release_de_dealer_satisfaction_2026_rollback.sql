-- German-only publication reversal: does not change English or other private languages.
-- After rollback, re-run public fingerprint sync and Cloudflare static build.
BEGIN;
DO $guard$
DECLARE num integer;
BEGIN
 SELECT count(*) INTO num FROM public.tc_forum_topic_translations tr
 JOIN public.tc_forum_topics t ON t.id=tr.topic_id
 WHERE tr.topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND tr.locale='de'
 AND tr.state='ready' AND tr.seo_approved=true
 AND tr.source_hash='0102e8edcd864b285733fb30cad4d8f1' AND md5(t.title||chr(31)||t.body)=tr.source_hash;
 IF num<>1 THEN RAISE EXCEPTION 'STOP: current German/source state differs'; END IF;
END $guard$;
UPDATE public.tc_forum_topic_translations SET state='needs_review',
seo_approved=false,reviewed_by_model=NULL,
qa_notes=concat_ws(E'\n',qa_notes,'2026-11-22 German release reversed; re-review required.')
WHERE topic_id='713ab252-a925-4ab7-b2c8-a30ce5b86706' AND locale='de' AND source_hash='0102e8edcd864b285733fb30cad4d8f1'
AND state='ready' AND seo_approved=true;
COMMIT;