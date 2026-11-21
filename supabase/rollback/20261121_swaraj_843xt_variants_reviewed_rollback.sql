-- MANUAL EMERGENCY ROLLBACK ONLY, NEVER AUTOMATICALLY EXECUTE.
-- Context: 21 Nov 2026 Swaraj 843 XT exact 2WD/4WD release, two public child UUIDs.
-- Run ONLY if a documented material regression requires reversing the publication,
-- after checking Cloudflare, Search Console, foreign-key dependencies and new user content.
-- Rebuild the static site/sitemap after an approved rollback; do not assume old deploy auto-restores.
BEGIN;
SET LOCAL statement_timeout='30s';
DO $review$
DECLARE n int; seed uuid;
BEGIN
  SELECT record_id INTO seed FROM tc_backup.tractor_publication_patches
  WHERE batch_id='20261121_swaraj_843xt_variants_v1' AND record_kind='tractor';
  IF seed IS NULL OR (SELECT status FROM public.tractors WHERE id=seed) IS DISTINCT FROM 'archived'
  THEN RAISE EXCEPTION 'Archived seed or backups missing'; END IF;
  SELECT count(*) INTO n FROM tc_backup.tractor_publication_patches
  WHERE batch_id='20261121_swaraj_843xt_variants_v1';
  IF n<>27 THEN RAISE EXCEPTION 'Incomplete backup %, refused',n; END IF;
  SELECT count(*) INTO n FROM public.tractors
  WHERE id IN ('d22fd896-b550-41f6-9686-d6f927e53ebc','d109cb8d-9797-4852-ad3b-5713e8f9f790')
    AND model_name='843 XT' AND variant IN ('2WD','4WD') AND market='India' AND status='published';
  IF n<>2 THEN RAISE EXCEPTION 'Published variant state changed, refused'; END IF;
  SELECT count(*) INTO n FROM public.tractor_specs
  WHERE tractor_id IN ('d22fd896-b550-41f6-9686-d6f927e53ebc','d109cb8d-9797-4852-ad3b-5713e8f9f790');
  IF n<>48 THEN RAISE EXCEPTION 'Post-release evidence modified, refused'; END IF;
  SELECT count(*) INTO n FROM public.tractorvs_image_candidates
  WHERE tractor_id IN ('d22fd896-b550-41f6-9686-d6f927e53ebc','d109cb8d-9797-4852-ad3b-5713e8f9f790')
    AND (rights_verified_at IS NOT NULL OR identity_verified_at IS NOT NULL OR
         source_image_url IS NOT NULL OR source_page_url IS NOT NULL OR image_asset_url IS NOT NULL);
  IF n>0 THEN RAISE EXCEPTION 'New photo research exists, review dependency before rollback'; END IF;
  SELECT count(*) INTO n FROM public.tc_forum_topics
  WHERE tractor_id IN ('d22fd896-b550-41f6-9686-d6f927e53ebc','d109cb8d-9797-4852-ad3b-5713e8f9f790');
  IF n>0 THEN RAISE EXCEPTION 'User forum content references new variants; refuse deletion'; END IF;
END $review$;
-- Before deleting, manually review all other FK dependencies (reviews, prices, SEO, etc.).
-- Deliberately NO DELETE/UPDATE in this file: restore via a separate reviewed,
-- dependency-aware exact-ID transaction using the protected backup snapshot.
ROLLBACK;
