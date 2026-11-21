-- TractorVS forum media v1: genuinely private uploads, owner-only reservations,
-- explicit two-stage moderation, safe public projection for static SEO builds.
-- No unreviewed image is made public by upload or by approval of a text post.
BEGIN;
SET LOCAL lock_timeout='8s';
SET LOCAL statement_timeout='60s';

-- Keep photos private even when the path is known. The existing public avatar
-- bucket is intentionally untouched.
DO $setup$
BEGIN
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='tc-forum-media') THEN
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='tc-forum-media'
    AND public=false AND file_size_limit=400000
    AND allowed_mime_types=ARRAY['image/webp']::text[]) THEN
    RAISE EXCEPTION 'Unexpected forum media bucket configuration';
  END IF;
 ELSE
  INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
   VALUES ('tc-forum-media','tc-forum-media',false,400000,ARRAY['image/webp']);
 END IF;
END $setup$;

CREATE TABLE IF NOT EXISTS public.tc_forum_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 topic_id uuid REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 reply_id uuid REFERENCES public.tc_forum_replies(id) ON DELETE CASCADE,
 position smallint NOT NULL,
 alt_text text NOT NULL,
 license_confirmed boolean NOT NULL DEFAULT false,
 storage_path text GENERATED ALWAYS AS (author_id::text||'/'||id::text||'.webp') STORED,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tc_forum_media_parent_exactly_one CHECK (num_nonnulls(topic_id,reply_id)=1),
 CONSTRAINT tc_forum_media_position CHECK (position BETWEEN 1 AND 3),
 CONSTRAINT tc_forum_media_alt CHECK (
  length(btrim(alt_text)) BETWEEN 10 AND 160 AND
  alt_text = btrim(alt_text) AND
  alt_text !~* '(https?://|www[.])'),
 CONSTRAINT tc_forum_media_rights CHECK (license_confirmed=true)
);
CREATE UNIQUE INDEX IF NOT EXISTS tc_forum_media_topic_position ON public.tc_forum_media(topic_id,position);
CREATE UNIQUE INDEX IF NOT EXISTS tc_forum_media_reply_position ON public.tc_forum_media(reply_id,position);
CREATE INDEX IF NOT EXISTS tc_forum_media_author_created ON public.tc_forum_media(author_id,created_at DESC);
CREATE INDEX IF NOT EXISTS tc_forum_media_status_created ON public.tc_forum_media(status,created_at DESC);
ALTER TABLE public.tc_forum_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_media FROM PUBLIC,anon,authenticated;
-- Restrict browser mutations to image reservations only; status, parent owner
-- and file path cannot be changed by a member.
GRANT SELECT ON public.tc_forum_media TO authenticated;
GRANT SELECT(id,topic_id,reply_id,position,alt_text,status,created_at) ON public.tc_forum_media TO anon;
GRANT INSERT(id,topic_id,reply_id,position,alt_text,license_confirmed) ON public.tc_forum_media TO authenticated;

CREATE POLICY tc_forum_media_owner_read ON public.tc_forum_media
 FOR SELECT TO authenticated USING (author_id=(SELECT auth.uid()));
CREATE POLICY tc_forum_media_published_read ON public.tc_forum_media
 FOR SELECT TO anon,authenticated USING (
  status='published' AND (
   (topic_id IS NOT NULL AND EXISTS(
     SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published'))
   OR
   (reply_id IS NOT NULL AND EXISTS(
     SELECT 1 FROM public.tc_forum_replies r JOIN public.tc_forum_topics t ON t.id=r.topic_id
      WHERE r.id=reply_id AND r.status='published' AND t.status='published'))
  )
 );
CREATE POLICY tc_forum_media_own_reserve ON public.tc_forum_media
 FOR INSERT TO authenticated WITH CHECK (
  author_id=(SELECT auth.uid()) AND status='pending'
  AND license_confirmed=true
  AND (
   (topic_id IS NOT NULL AND EXISTS(
     SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id
       AND t.author_id=(SELECT auth.uid()) AND t.status='pending'))
   OR
   (reply_id IS NOT NULL AND EXISTS(
     SELECT 1 FROM public.tc_forum_replies r WHERE r.id=reply_id
       AND r.author_id=(SELECT auth.uid()) AND r.status='pending'))
  )
 );

-- Abuse control is enforced in the database, not only in the UI.
CREATE OR REPLACE FUNCTION public.tc_forum_media_daily_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO '' AS $limit$
DECLARE n integer;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NEW.author_id IS DISTINCT FROM (SELECT auth.uid()) THEN
  RAISE EXCEPTION 'Forum media requires a valid member session';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext(NEW.author_id::text),20261121);
 SELECT count(*) INTO n FROM public.tc_forum_media
  WHERE author_id=NEW.author_id AND created_at>=now()-interval '24 hours';
 IF n>=12 THEN RAISE EXCEPTION 'Daily forum photo limit reached'; END IF;
 RETURN NEW;
END $limit$;
REVOKE ALL ON FUNCTION public.tc_forum_media_daily_limit() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tc_forum_media_limit BEFORE INSERT ON public.tc_forum_media
 FOR EACH ROW EXECUTE FUNCTION public.tc_forum_media_daily_limit();

-- Only a moderator can change status. Even if updated by an administrator,
-- a photo cannot be approved before its object exists and its post is public.
CREATE OR REPLACE FUNCTION public.tc_forum_media_approval_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO '' AS $approve$
BEGIN
 IF NEW.status='published' AND OLD.status IS DISTINCT FROM 'published' THEN
  IF NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id='tc-forum-media'
       AND o.name=NEW.storage_path AND o.metadata->>'mimetype'='image/webp') THEN
    RAISE EXCEPTION 'Photo file missing or invalid WebP; cannot approve';
  END IF;
  IF NOT (
   (NEW.topic_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.tc_forum_topics t WHERE t.id=NEW.topic_id AND t.status='published'))
   OR
   (NEW.reply_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.tc_forum_replies r JOIN public.tc_forum_topics t ON t.id=r.topic_id
    WHERE r.id=NEW.reply_id AND r.status='published' AND t.status='published'))
  ) THEN RAISE EXCEPTION 'Moderated parent must be published before approving a photo'; END IF;
 END IF;
 NEW.updated_at:=now();
 RETURN NEW;
END $approve$;
REVOKE ALL ON FUNCTION public.tc_forum_media_approval_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tc_forum_media_approval BEFORE UPDATE ON public.tc_forum_media
 FOR EACH ROW EXECUTE FUNCTION public.tc_forum_media_approval_guard();

-- Storage inserts work only for a member who already reserved a post-owned
-- media record. This prevents unlimited orphan uploads without a posting quota.
CREATE POLICY tc_forum_media_storage_owner_insert ON storage.objects
 FOR INSERT TO authenticated WITH CHECK (
  bucket_id='tc-forum-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  AND EXISTS(SELECT 1 FROM public.tc_forum_media m
    WHERE m.author_id=(SELECT auth.uid()) AND m.storage_path=name
      AND m.status='pending' AND m.created_at>=now()-interval '2 hours')
 );
CREATE POLICY tc_forum_media_storage_owner_read ON storage.objects
 FOR SELECT TO authenticated USING (
  bucket_id='tc-forum-media'
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
  AND EXISTS(SELECT 1 FROM public.tc_forum_media m
   WHERE m.author_id=(SELECT auth.uid()) AND m.storage_path=name)
 );
-- Deliberately no anonymous storage SELECT, member UPDATE or DELETE policies.

-- Public build sees only previously approved photos, no storage_path or
-- author_id. 'und' is a stable, non-user-facing ordering locale for the
-- existing bounded public forum-row loader.
CREATE OR REPLACE VIEW public.tc_forum_public_media WITH
 (security_invoker=true,security_barrier=true) AS
 SELECT m.id,m.topic_id,m.reply_id,m.position,m.alt_text,m.status,
        'und'::text AS locale,m.created_at
 FROM public.tc_forum_media m
 WHERE m.status='published' AND (
  (m.topic_id IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.tc_forum_topics t WHERE t.id=m.topic_id AND t.status='published'))
  OR
  (m.reply_id IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.tc_forum_replies r JOIN public.tc_forum_topics t ON t.id=r.topic_id
   WHERE r.id=m.reply_id AND r.status='published' AND t.status='published'))
 );
REVOKE ALL ON public.tc_forum_public_media FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tc_forum_public_media TO anon,authenticated;

-- Browser-generated reply UUIDs are needed to reserve photos after the
-- existing moderated reply row is created. Existing RLS/trigger rules remain.
GRANT INSERT(id) ON public.tc_forum_replies TO authenticated;

DO $verify$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='tc-forum-media' AND public=false
   AND file_size_limit=400000) THEN RAISE EXCEPTION 'Private WebP storage config invalid'; END IF;
 IF (SELECT relrowsecurity FROM pg_class WHERE oid='public.tc_forum_media'::regclass) IS DISTINCT FROM true
   OR (SELECT reloptions @> ARRAY['security_invoker=true'] FROM pg_class
       WHERE oid='public.tc_forum_public_media'::regclass) IS DISTINCT FROM true THEN
   RAISE EXCEPTION 'Media RLS/invoker missing'; END IF;
 IF has_column_privilege('anon','public.tc_forum_media','storage_path','SELECT')
 OR has_column_privilege('authenticated','public.tc_forum_media','status','UPDATE')
 OR has_table_privilege('anon','storage.objects','INSERT') THEN
  RAISE EXCEPTION 'Media privilege escalation detected'; END IF;
END $verify$;
COMMIT;
