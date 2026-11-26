\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 fixture only. Never use on production.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(auth.jwt()->>'sub','')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
CREATE TABLE public.tc_forum_topics(id uuid PRIMARY KEY,author_id uuid NOT NULL REFERENCES auth.users(id),status text NOT NULL,category text NOT NULL);
CREATE TABLE public.tc_forum_replies(id uuid PRIMARY KEY,topic_id uuid NOT NULL REFERENCES public.tc_forum_topics(id),author_id uuid NOT NULL REFERENCES auth.users(id),status text NOT NULL);
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
INSERT INTO public.tc_forum_topics VALUES
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','published','questions'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','published','maintenance'),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','pending','questions'),
 ('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','published','news');
INSERT INTO public.tc_forum_replies VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','published'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','published'),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','published'),
 ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','pending'),
 ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','published');
ALTER TABLE public.tc_forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_forum_replies ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.tc_forum_topics,public.tc_forum_replies TO anon,authenticated;
CREATE POLICY fixture_topic_read ON public.tc_forum_topics FOR SELECT TO anon,authenticated USING(status='published' OR author_id=(SELECT auth.uid()));
CREATE POLICY fixture_reply_read ON public.tc_forum_replies FOR SELECT TO anon,authenticated USING((status='published' AND EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published')) OR author_id=(SELECT auth.uid()));
