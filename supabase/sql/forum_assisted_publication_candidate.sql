-- CANDIDATE: apply only after isolated SQL regression, review and site release plan.
-- No author impersonation, JWT minting, public admin RPC or service-role grant.
BEGIN;
CREATE SCHEMA tc_assisted_private;
REVOKE ALL ON SCHEMA tc_assisted_private FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE public.tc_forum_assisted_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL DEFAULT ((auth.jwt()->>'session_id')::uuid),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now()+interval '24 hours'),
  revoked boolean NOT NULL DEFAULT false,
  CHECK (expires_at=created_at+interval '24 hours')
);
ALTER TABLE public.tc_forum_assisted_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_assisted_grants FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT(id,owner_id,created_at,expires_at,revoked),
      INSERT(owner_id), UPDATE(revoked) ON public.tc_forum_assisted_grants TO authenticated;
CREATE UNIQUE INDEX tc_assisted_one_unrevoked ON public.tc_forum_assisted_grants(owner_id) WHERE NOT revoked;
CREATE POLICY tc_assisted_read ON public.tc_forum_assisted_grants FOR SELECT TO authenticated
 USING (owner_id=(SELECT auth.uid()));
CREATE POLICY tc_assisted_create ON public.tc_forum_assisted_grants FOR INSERT TO authenticated
 WITH CHECK (owner_id=(SELECT auth.uid()) AND NOT revoked
  AND nullif((SELECT auth.jwt())->>'email','') IS NOT NULL
  AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false');
CREATE POLICY tc_assisted_revoke ON public.tc_forum_assisted_grants FOR UPDATE TO authenticated
 USING (owner_id=(SELECT auth.uid()) AND NOT revoked)
 WITH CHECK (owner_id=(SELECT auth.uid()) AND revoked);
CREATE TABLE tc_assisted_private.publication_audit (
 request_id uuid PRIMARY KEY,
 grant_id uuid NOT NULL REFERENCES public.tc_forum_assisted_grants(id) ON DELETE CASCADE,
 topic_id uuid NOT NULL UNIQUE,
 owner_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 payload_hash bytea NOT NULL
);
ALTER TABLE tc_assisted_private.publication_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tc_assisted_private.publication_audit FROM PUBLIC, anon, authenticated, service_role;

-- The only additional topic path requires a private, transactionally written
-- authorization record. All browser/reply paths still require auth.uid().
-- Preserve the production 3/24h topic and 12/24h reply limits.
CREATE OR REPLACE FUNCTION public.tc_forum_rate_limit_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'pg_catalog','public' AS $fn$
DECLARE n integer; allowed boolean := false;
BEGIN
 IF auth.uid() IS NOT NULL AND NEW.author_id IS NOT DISTINCT FROM auth.uid() THEN
  allowed := true;
 ELSIF TG_TABLE_NAME='tc_forum_topics' AND current_user='postgres' THEN
  SELECT EXISTS(
   SELECT 1 FROM tc_assisted_private.publication_audit a
   JOIN public.tc_forum_assisted_grants g ON g.id=a.grant_id
   WHERE a.topic_id=NEW.id AND a.owner_id=NEW.author_id AND g.owner_id=NEW.author_id
    AND a.created_at=transaction_timestamp() AND NOT g.revoked AND g.expires_at>clock_timestamp()
    AND a.payload_hash=sha256(convert_to(jsonb_build_array(NEW.locale,NEW.category,NEW.tractor_id,NEW.title,NEW.body)::text,'UTF8'))
  ) INTO allowed;
 END IF;
 IF NOT allowed THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF TG_TABLE_NAME='tc_forum_topics' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.author_id::text,157231));
  SELECT count(*) INTO n FROM public.tc_forum_topics
   WHERE author_id=NEW.author_id AND created_at >= now()-interval '24 hours';
  IF n>=3 THEN RAISE EXCEPTION 'Daily forum topic limit reached'; END IF;
 ELSIF TG_TABLE_NAME='tc_forum_replies' THEN
  SELECT count(*) INTO n FROM public.tc_forum_replies
   WHERE author_id=auth.uid() AND created_at >= now()-interval '24 hours';
  IF n>=12 THEN RAISE EXCEPTION 'Daily forum reply limit reached'; END IF;
 END IF;
 RETURN NEW;
END $fn$;

-- Invoker only: never a public SECURITY DEFINER RPC. The existing SQL-admin
-- connector can call this narrow function, but a user must first consent.
CREATE FUNCTION tc_assisted_private.publish_topic(
 p_grant_id uuid, p_request_id uuid, p_locale text, p_category text,
 p_title text, p_body text, p_tractor_id uuid DEFAULT NULL
) RETURNS TABLE(topic_id uuid, slug text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE g public.tc_forum_assisted_grants%ROWTYPE; existing tc_assisted_private.publication_audit%ROWTYPE;
 new_id uuid:=gen_random_uuid(); clean_title text:=btrim(p_title);
 clean_body text:=btrim(p_body); marker text; digest bytea;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Publisher unavailable'; END IF;
 IF p_grant_id IS NULL OR p_request_id IS NULL OR p_locale IS NULL OR p_category IS NULL
 OR clean_title IS NULL OR clean_body IS NULL THEN RAISE EXCEPTION 'Invalid content'; END IF;
 marker:=CASE p_locale
 WHEN 'tr' THEN 'Bu konu, hesap sahibinin yetkilendirmesiyle yapay zekâ desteğiyle hazırlanmıştır.'
 WHEN 'en' THEN 'This topic was prepared with AI assistance under the account holder’s authorization.'
 WHEN 'zh' THEN '本主题经账户持有人授权，在人工智能辅助下编写。'
 WHEN 'hi' THEN 'यह विषय खाताधारक की अनुमति से एआई की सहायता से तैयार किया गया है।'
 WHEN 'pt-br' THEN 'Este tópico foi preparado com auxílio de IA e autorização do titular da conta.'
 WHEN 'fr' THEN 'Ce sujet a été préparé avec une assistance IA et l’autorisation du titulaire du compte.'
 WHEN 'de' THEN 'Dieses Thema wurde mit KI-Unterstützung und Genehmigung des Kontoinhabers erstellt.'
 WHEN 'ru' THEN 'Тема подготовлена с помощью ИИ с разрешения владельца аккаунта.'
 WHEN 'ja' THEN 'このトピックはアカウント所有者の許可を得てAIの支援で作成されました。'
 WHEN 'es' THEN 'Este tema se preparó con ayuda de IA y autorización del titular de la cuenta.'
 ELSE NULL END;
 IF marker IS NULL OR p_category NOT IN ('general','questions','maintenance','reviews','news','comparison')
 OR char_length(clean_title) NOT BETWEEN 12 AND 160 OR clean_title ~* '(https?://|www\.)'
 OR clean_title ~ '[\r\n]' OR char_length(clean_body)<40 THEN RAISE EXCEPTION 'Invalid content'; END IF;
 clean_body:=marker||E'\n\n'||clean_body;
 IF char_length(clean_body)>12000 THEN RAISE EXCEPTION 'Invalid content'; END IF;
 digest:=sha256(convert_to(jsonb_build_array(p_locale,p_category,p_tractor_id,clean_title,clean_body)::text,'UTF8'));
 SELECT * INTO g FROM public.tc_forum_assisted_grants WHERE id=p_grant_id FOR UPDATE;
 IF NOT FOUND OR g.revoked OR g.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'No active owner authorization'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users u JOIN auth.sessions s ON s.user_id=u.id
   WHERE u.id=g.owner_id AND s.id=g.session_id AND u.email_confirmed_at IS NOT NULL
   AND nullif(u.email,'') IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
   AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp())
   AND (s.not_after IS NULL OR s.not_after>clock_timestamp()))
 THEN RAISE EXCEPTION 'Owner session not valid'; END IF;
 SELECT * INTO existing FROM tc_assisted_private.publication_audit WHERE request_id=p_request_id;
 IF FOUND THEN
  IF existing.grant_id<>g.id OR existing.payload_hash<>digest THEN RAISE EXCEPTION 'Request conflict'; END IF;
  RETURN QUERY SELECT t.id,t.slug FROM public.tc_forum_topics t WHERE t.id=existing.topic_id AND t.author_id=g.owner_id;
  RETURN;
 END IF;
 IF p_tractor_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.tractors WHERE id=p_tractor_id AND status='published')
 THEN RAISE EXCEPTION 'Invalid tractor'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(g.owner_id::text,157231));
 INSERT INTO tc_assisted_private.publication_audit(request_id,grant_id,topic_id,owner_id,payload_hash)
 VALUES(p_request_id,g.id,new_id,g.owner_id,digest);
 INSERT INTO public.tc_forum_topics(id,author_id,locale,category,tractor_id,title,body,slug,status,translation_consent)
 VALUES(new_id,g.owner_id,p_locale,p_category,p_tractor_id,clean_title,clean_body,'generated-by-trigger','published',false);
 RETURN QUERY SELECT t.id,t.slug FROM public.tc_forum_topics t WHERE t.id=new_id;
END $fn$;
REVOKE ALL ON FUNCTION tc_assisted_private.publish_topic(uuid,uuid,text,text,text,text,uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION tc_assisted_private.publish_topic(uuid,uuid,text,text,text,text,uuid) TO postgres;
COMMIT;
