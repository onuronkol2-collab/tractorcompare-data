#!/usr/bin/env python3
"""Generate review-only SQL for a dedicated, already verified archive identity.
No database connection, credentials, execution or storage bucket creation.
"""
import argparse, re

BUCKET = 'tc-tractor-photo-private'
UUID = re.compile(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}')


def policy_sql(uid):
    if not isinstance(uid, str) or not UUID.fullmatch(uid):
        raise ValueError('verified dedicated archive UUID required')
    scope = f"bucket_id = '{BUCKET}'"
    # Do not depend on user-editable metadata. Nonanonymous dedicated identity only.
    allowed = f"({scope} AND (select auth.uid()) = '{uid}'::uuid AND coalesce((select auth.jwt()->>'is_anonymous'), 'true') = 'false' AND name ~ '^(originals/[0-9a-f]{{64}}[.](jpg|png|webp)|manifests/[0-9a-f]{{64}}[.]json)$')"
    outside = f"bucket_id <> '{BUCKET}'"
    return f"""-- REVIEW ONLY. Verify bucket, dedicated identity and existing RLS first.
BEGIN;
CREATE POLICY tc_photo_archive_select ON storage.objects AS PERMISSIVE
  FOR SELECT TO authenticated USING ({allowed});
CREATE POLICY tc_photo_archive_insert ON storage.objects AS PERMISSIVE
  FOR INSERT TO authenticated WITH CHECK ({allowed});
-- A later broad permissive policy must not expose this bucket.
CREATE POLICY tc_photo_archive_select_boundary ON storage.objects AS RESTRICTIVE
  FOR SELECT TO anon, authenticated USING ({outside} OR {allowed});
CREATE POLICY tc_photo_archive_insert_boundary ON storage.objects AS RESTRICTIVE
  FOR INSERT TO anon, authenticated WITH CHECK ({outside} OR {allowed});
-- No ordinary or dedicated authenticated identity may overwrite or delete.
CREATE POLICY tc_photo_archive_update_boundary ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO anon, authenticated USING ({outside}) WITH CHECK ({outside});
CREATE POLICY tc_photo_archive_delete_boundary ON storage.objects AS RESTRICTIVE
  FOR DELETE TO anon, authenticated USING ({outside});
COMMIT;
"""


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('verified_archive_uid')
    print(policy_sql(p.parse_args().verified_archive_uid),end='')
