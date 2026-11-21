-- MANUAL, SAFE PREVIEW ONLY: do not undo publications without dependency audit, backups and approval.
-- Dedicated batch snapshots preserve original tractor/spec records.
-- This script contains NO UPDATE/DELETE and cannot roll back live data by itself.
BEGIN;
SET LOCAL statement_timeout='20s';
DO $audit$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM tc_backup.tractor_publication_patches
   WHERE batch_id='20261121_iseki_txgs24_sonalika_fp18_v1';
  IF n<>69 THEN RAISE EXCEPTION 'Backup mismatch: %, abort rollback review',n; END IF;
  SELECT count(*) INTO n FROM public.tractor_specs WHERE tractor_id IN
  ('1d67a7d0-00bd-4898-a510-98735b28b9b4','c2488a63-9d6c-434e-983e-ebcb87e224c9');
  IF n<>67 THEN RAISE EXCEPTION 'Live specs mutated since publication; do not restore blindly: %',n; END IF;
  SELECT count(*) INTO n FROM public.tractors WHERE id IN
  ('1d67a7d0-00bd-4898-a510-98735b28b9b4','c2488a63-9d6c-434e-983e-ebcb87e224c9')
  AND status='published';
  IF n<>2 THEN RAISE EXCEPTION 'Publication status changed; manual review needed'; END IF;
END $audit$;
ROLLBACK;
-- Recovery plan: inspect all FK dependencies (photos, forum, reviews, prices);
-- create separate reviewed exact-ID transaction restoring 69 original JSONB snapshots,
-- verify public-view counts and RLS, rebuild and independently verify Cloudflare/SEO.
