-- Emergency rollback only while zero forum media rows / objects exist.
-- This script deliberately REFUSES to erase any user-generated photo metadata.
-- Do not execute in normal deployments; approvals, URL routes and clients
-- must first be disabled before removing the feature.
BEGIN;
SET LOCAL lock_timeout='8s';
SET LOCAL statement_timeout='30s';
DO $guard$
BEGIN
 IF (SELECT count(*) FROM public.tc_forum_media)>0
 OR (SELECT count(*) FROM storage.objects WHERE bucket_id='tc-forum-media')>0
 THEN RAISE EXCEPTION 'Photo records/objects exist: export and migrate safely before rollback'; END IF;
 IF EXISTS(SELECT 1 FROM public.tc_forum_media WHERE status='published')
 THEN RAISE EXCEPTION 'Published forum images cannot be destroyed'; END IF;
END $guard$;
DROP VIEW IF EXISTS public.tc_forum_public_media;
DROP POLICY IF EXISTS tc_forum_media_storage_owner_insert ON storage.objects;
DROP POLICY IF EXISTS tc_forum_media_storage_owner_read ON storage.objects;
DROP TABLE IF EXISTS public.tc_forum_media;
DROP FUNCTION IF EXISTS public.tc_forum_media_daily_limit();
DROP FUNCTION IF EXISTS public.tc_forum_media_approval_guard();
-- Do not revoke the reply UUID INSERT grant: later migrations or features may
-- depend on it. Authorization ownership remains enforced by forum RLS.
DELETE FROM storage.buckets WHERE id='tc-forum-media';
COMMIT;
