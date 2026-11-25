-- Disposable PostgreSQL only. No production URLs, keys or user records.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (auth.jwt()->>'sub')::uuid$$;
GRANT USAGE ON SCHEMA auth TO authenticated,anon;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,is_anonymous boolean,banned_until timestamptz,deleted_at timestamptz);
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id),not_after timestamptz);
INSERT INTO auth.users(id,email,email_confirmed_at,is_anonymous) VALUES
 ('00000000-0000-4000-8000-000000000001','a@example.invalid',now(),false),
 ('00000000-0000-4000-8000-000000000002','b@example.invalid',now(),false);
INSERT INTO auth.sessions(id,user_id) VALUES
 ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000002');
CREATE TABLE public.tractors(id uuid PRIMARY KEY,status text NOT NULL);
INSERT INTO public.tractors VALUES ('00000000-0000-4000-8000-000000000099','draft');
CREATE TABLE public.tc_forum_topics(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
 locale text NOT NULL,category text NOT NULL,tractor_id uuid REFERENCES public.tractors(id),
 title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 12 AND 160),
 body text NOT NULL CHECK(char_length(btrim(body)) BETWEEN 40 AND 12000),
 slug text NOT NULL,status text NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now(),translation_consent boolean NOT NULL DEFAULT false
);
CREATE TABLE public.tc_forum_replies(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),author_id uuid DEFAULT auth.uid(),created_at timestamptz DEFAULT now());
ALTER TABLE public.tc_forum_topics ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.tc_forum_topics,public.tc_forum_replies TO authenticated;
CREATE POLICY topic_read ON public.tc_forum_topics FOR SELECT TO authenticated USING(status='published' OR author_id=auth.uid());
CREATE POLICY topic_insert ON public.tc_forum_topics FOR INSERT TO authenticated WITH CHECK(author_id=auth.uid());
CREATE FUNCTION public.tc_forum_rate_limit_insert() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF auth.uid() IS NULL OR NEW.author_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Authentication required'; END IF; RETURN NEW; END$$;
CREATE TRIGGER tc_forum_topics_rate_limit BEFORE INSERT ON public.tc_forum_topics FOR EACH ROW EXECUTE FUNCTION public.tc_forum_rate_limit_insert();
CREATE TRIGGER tc_forum_replies_rate_limit BEFORE INSERT ON public.tc_forum_replies FOR EACH ROW EXECUTE FUNCTION public.tc_forum_rate_limit_insert();
CREATE FUNCTION public.tc_topic_rate_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$BEGIN
 IF EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.author_id=NEW.author_id AND t.created_at>now()-interval '60 seconds') THEN RAISE EXCEPTION 'Please wait before creating another topic'; END IF;
 IF (SELECT count(*) FROM public.tc_forum_topics t WHERE t.author_id=NEW.author_id AND t.created_at>now()-interval '1 day')>=8 THEN RAISE EXCEPTION 'Daily topic limit reached'; END IF; RETURN NEW; END$$;
CREATE TRIGGER tc_topic_rate BEFORE INSERT ON public.tc_forum_topics FOR EACH ROW EXECUTE FUNCTION public.tc_topic_rate_guard();
CREATE FUNCTION public.tc_forum_make_slug() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN NEW.slug:='topic-'||replace(NEW.id::text,'-','');RETURN NEW;END$$;
CREATE TRIGGER tc_topic_slug BEFORE INSERT ON public.tc_forum_topics FOR EACH ROW EXECUTE FUNCTION public.tc_forum_make_slug();
