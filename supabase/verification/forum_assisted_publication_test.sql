\set ON_ERROR_STOP on
-- Run ONLY against fixture DB after candidate SQL. Mock JWTs are confined to this disposable test.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"00000000-0000-4000-8000-000000000011","email":"a@example.invalid","is_anonymous":false}',false);
INSERT INTO public.tc_forum_assisted_grants(owner_id) VALUES ('00000000-0000-4000-8000-000000000001');
DO $$ BEGIN
 IF (SELECT count(id) FROM public.tc_forum_assisted_grants)<>1 THEN RAISE EXCEPTION 'Owner cannot read grant'; END IF;
 BEGIN
  INSERT INTO public.tc_forum_assisted_grants(owner_id,expires_at) VALUES ('00000000-0000-4000-8000-000000000001',now()+interval '100 days');
  RAISE EXCEPTION 'unexpected grant manipulation';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(NULL,NULL,NULL,NULL,NULL,NULL,NULL);
  RAISE EXCEPTION 'authenticated may call publisher';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","session_id":"00000000-0000-4000-8000-000000000022","email":"b@example.invalid","is_anonymous":false}',false);
DO $$ BEGIN
 IF (SELECT count(id) FROM public.tc_forum_assisted_grants)<>0 THEN RAISE EXCEPTION 'Other owner can read grants'; END IF;
 BEGIN
  INSERT INTO public.tc_forum_assisted_grants(owner_id) VALUES ('00000000-0000-4000-8000-000000000001');
  RAISE EXCEPTION 'Other owner can create grant';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.tc_forum_assisted_grants SET revoked=true;
 IF FOUND THEN RAISE EXCEPTION 'Other owner can revoke grant'; END IF;
 BEGIN
  INSERT INTO public.tc_forum_topics(author_id,locale,category,title,body,slug,status) VALUES ('00000000-0000-4000-8000-000000000001','tr','questions','Valid title here','This is sufficiently long fixture topic body for a test.','stub','published');
  RAISE EXCEPTION 'Other author insert accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Authentication required' THEN RAISE; END IF; END;
END $$;
INSERT INTO public.tc_forum_topics(locale,category,title,body,slug,status) VALUES ('tr','questions','Ordinary signed-in topic','This ordinary account post should use the existing authentication.','stub','published');
RESET ROLE;
SELECT set_config('request.jwt.claims','{}',false);
DO $$ DECLARE g uuid; topic uuid; same_topic uuid; n integer;
BEGIN
 SELECT id INTO g FROM public.tc_forum_assisted_grants WHERE NOT revoked;
 BEGIN
  INSERT INTO public.tc_forum_topics(author_id,locale,category,title,body,slug,status) VALUES ('00000000-0000-4000-8000-000000000001','tr','questions','Direct unapproved insert','This direct admin insert must be rejected by the existing trigger.','stub','published');
  RAISE EXCEPTION 'Unapproved insert accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Authentication required' THEN RAISE; END IF; END;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'tr','questions','https://example.invalid bad title','This fixture contains a sufficiently long topic body.');
  RAISE EXCEPTION 'Invalid title accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Invalid content' THEN RAISE; END IF; END;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'tr','questions','Valid example title','This fixture contains a sufficiently long topic body.','00000000-0000-4000-8000-000000000099');
  RAISE EXCEPTION 'Draft tractor accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Invalid tractor' THEN RAISE; END IF; END;
 SELECT topic_id INTO topic FROM tc_assisted_private.publish_topic(g,'00000000-0000-4000-8000-000000000031','tr','questions','Valid example title','This fixture contains a sufficiently long topic body.');
 SELECT topic_id INTO same_topic FROM tc_assisted_private.publish_topic(g,'00000000-0000-4000-8000-000000000031','tr','questions','Valid example title','This fixture contains a sufficiently long topic body.');
 IF topic IS NULL OR topic IS DISTINCT FROM same_topic THEN RAISE EXCEPTION 'Retry duplicated topic'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic AND t.author_id='00000000-0000-4000-8000-000000000001' AND t.status='published' AND NOT t.translation_consent AND t.body LIKE 'Bu konu,%' AND t.slug LIKE 'topic-%') THEN RAISE EXCEPTION 'Incorrect delegated publication'; END IF;
 IF (SELECT count(*) FROM tc_assisted_private.publication_audit)<>1 THEN RAISE EXCEPTION 'Incorrect audit count'; END IF;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,'00000000-0000-4000-8000-000000000031','tr','questions','Different example title','This fixture contains a sufficiently long topic body.');
  RAISE EXCEPTION 'Conflicting request accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Request conflict' THEN RAISE; END IF; END;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'tr','questions','Valid second title','This fixture contains a sufficiently long topic body.');
  RAISE EXCEPTION 'Cooldown ignored';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Please wait before creating another topic' THEN RAISE; END IF; END;
 UPDATE public.tc_forum_topics SET created_at=now()-interval '2 minutes' WHERE id=topic;
 PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'en','general','Second valid title','Another sufficiently long fixture body for testing quotas.');
 UPDATE public.tc_forum_topics SET created_at=now()-interval '3 minutes' WHERE author_id='00000000-0000-4000-8000-000000000001';
 PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'de','maintenance','Third valid title','Another sufficiently long fixture body for testing quotas.');
 UPDATE public.tc_forum_topics SET created_at=now()-interval '4 minutes' WHERE author_id='00000000-0000-4000-8000-000000000001';
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'tr','questions','Fourth valid title','Another sufficiently long fixture body for testing quotas.');
  RAISE EXCEPTION 'Daily limit ignored';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Daily forum topic limit reached' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM tc_assisted_private.publication_audit)<>3 THEN RAISE EXCEPTION 'Failed attempts left audit rows'; END IF;
END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"00000000-0000-4000-8000-000000000011","email":"a@example.invalid","is_anonymous":false}',false);
UPDATE public.tc_forum_assisted_grants SET revoked=true;
DO $$ BEGIN
 BEGIN
  UPDATE public.tc_forum_assisted_grants SET revoked=false;
  IF FOUND THEN RAISE EXCEPTION 'Reactivation accepted'; END IF;
 END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{}',false);
DO $$ DECLARE g uuid; BEGIN
 SELECT id INTO g FROM public.tc_forum_assisted_grants WHERE revoked;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'tr','questions','Revoked test title','Another sufficiently long fixture body for testing revocation.');
  RAISE EXCEPTION 'Revoked grant accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'No active owner authorization' THEN RAISE; END IF; END;
END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","session_id":"00000000-0000-4000-8000-000000000011","email":"a@example.invalid","is_anonymous":false}',false);
INSERT INTO public.tc_forum_assisted_grants(owner_id) VALUES ('00000000-0000-4000-8000-000000000001');
RESET ROLE;
SELECT set_config('request.jwt.claims','{}',false);
DELETE FROM auth.sessions WHERE id='00000000-0000-4000-8000-000000000011';
DO $$ DECLARE g uuid; BEGIN
 SELECT id INTO g FROM public.tc_forum_assisted_grants WHERE NOT revoked;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'tr','questions','Invalid session title','Another sufficiently long fixture body for testing session revocation.');
  RAISE EXCEPTION 'Invalid session accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Owner session not valid' THEN RAISE; END IF; END;
 UPDATE public.tc_forum_assisted_grants SET created_at=now()-interval '25 hours',expires_at=now()-interval '1 hour' WHERE id=g;
 BEGIN
  PERFORM tc_assisted_private.publish_topic(g,gen_random_uuid(),'tr','questions','Expired grant title','Another sufficiently long fixture body for testing expiration.');
  RAISE EXCEPTION 'Expired grant accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'No active owner authorization' THEN RAISE; END IF; END;
END $$;
SELECT 'Delegated publishing fixture checks passed' AS result;
