-- TractorVS forum media hardening after initial private storage deployment.
-- Removes owner identifiers and private object keys from general member SELECT.
-- Storage RLS now derives the reserved file key from caller UID + safe media ID.
BEGIN;
SET LOCAL lock_timeout='8s';
SET LOCAL statement_timeout='30s';

REVOKE SELECT ON public.tc_forum_media FROM authenticated;
GRANT SELECT(id,topic_id,reply_id,position,alt_text,status,created_at)
 ON public.tc_forum_media TO authenticated;

ALTER POLICY tc_forum_media_storage_owner_insert ON storage.objects TO authenticated
 WITH CHECK (
  bucket_id='tc-forum-media'
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
  AND storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.webp$'
  AND EXISTS(SELECT 1 FROM public.tc_forum_media m
   WHERE m.id::text=replace(storage.filename(name),'.webp','')
     AND name=(SELECT auth.uid())::text||'/'||m.id::text||'.webp'
     AND m.status='pending' AND m.created_at>=now()-interval '2 hours')
 );
ALTER POLICY tc_forum_media_storage_owner_read ON storage.objects TO authenticated
 USING (
  bucket_id='tc-forum-media'
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
  AND EXISTS(SELECT 1 FROM public.tc_forum_media m
   WHERE m.id::text=replace(storage.filename(name),'.webp','')
     AND name=(SELECT auth.uid())::text||'/'||m.id::text||'.webp')
 );

DO $verify$
BEGIN
 IF has_column_privilege('authenticated','public.tc_forum_media','storage_path','SELECT')
 OR has_column_privilege('authenticated','public.tc_forum_media','author_id','SELECT')
 OR has_column_privilege('anon','public.tc_forum_media','storage_path','SELECT') THEN
  RAISE EXCEPTION 'Member private file path/owner ID remains exposed';
 END IF;
 IF NOT has_column_privilege('authenticated','public.tc_forum_media','id','SELECT')
 OR NOT has_column_privilege('authenticated','public.tc_forum_media','status','SELECT')
 OR NOT has_column_privilege('authenticated','public.tc_forum_media','id','INSERT') THEN
  RAISE EXCEPTION 'Media reservation or member access regressed';
 END IF;
END $verify$;
COMMIT;
