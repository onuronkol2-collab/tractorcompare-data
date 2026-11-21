-- Follow-up to 20261121210000: ensure the filename regex matches
-- exactly a UUID with the literal ".webp" suffix under standard_conforming_strings.
BEGIN;
SET LOCAL lock_timeout='8s';
ALTER POLICY tc_forum_media_storage_owner_insert ON storage.objects TO authenticated
 WITH CHECK (
  bucket_id='tc-forum-media'
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
  AND storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]webp$'
  AND EXISTS(SELECT 1 FROM public.tc_forum_media m
   WHERE m.id::text=replace(storage.filename(name),'.webp','')
     AND name=(SELECT auth.uid())::text||'/'||m.id::text||'.webp'
     AND m.status='pending' AND m.created_at>=now()-interval '2 hours')
 );
DO $verify$
BEGIN
 IF NOT ('e00324b3-ade4-47f6-bacc-f494733a8ab2.webp'
  ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]webp$')
 OR ('e00324b3-ade4-47f6-bacc-f494733a8ab2Xwebp'
  ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]webp$')
 THEN RAISE EXCEPTION 'Invalid forum file extension regex'; END IF;
 IF has_column_privilege('authenticated','public.tc_forum_media','storage_path','SELECT')
 THEN RAISE EXCEPTION 'Private media paths must not be exposed'; END IF;
END $verify$;
COMMIT;
