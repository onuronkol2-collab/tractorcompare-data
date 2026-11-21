-- SAFETY-ONLY ROLLBACK REVIEW - THIS IS NOT AN EXECUTABLE RESTORE.
-- Never delete public models without mapping SEO, links, forum, images, reviews, FK dependencies.
BEGIN;
SET LOCAL statement_timeout='15s';
DO $checks$
DECLARE n int;
BEGIN
 SELECT COUNT(*) INTO n FROM tc_backup.tractor_publication_patches
 WHERE batch_id IN('20261121_sonalika_di42p_india_v1',
 '20261121_sonalika_mahabali_rx42_verified_2wd_4wd_v1',
 '20261121_tym_t3048_f50c_variants_v1');
 IF n<>50 THEN RAISE EXCEPTION 'Required 50 original backup rows; found %',n; END IF;
 SELECT COUNT(*) INTO n FROM public.tractorvs_public_specs
 WHERE tractor_id IN('2d79ca05-3378-47dc-9d68-a368434d0dbe',
 'a0e16b7d-3b48-41c8-b4d9-5945b542b3c2',
 'dd65e38b-8268-48f4-a9ac-1308e2decb86',
 '5d1360a7-1494-44b9-9728-93de291ab082',
 '458be7b8-f6b8-4319-b264-dc6c7cc36ae7') AND spec_id IS NOT NULL;
 IF n<>75 THEN RAISE EXCEPTION 'New evidence has changed (% rows); stop and review',n; END IF;
 SELECT COUNT(*) INTO n FROM public.tc_forum_topics
 WHERE tractor_id IN('2d79ca05-3378-47dc-9d68-a368434d0dbe',
 'a0e16b7d-3b48-41c8-b4d9-5945b542b3c2',
 'dd65e38b-8268-48f4-a9ac-1308e2decb86',
 '5d1360a7-1494-44b9-9728-93de291ab082',
 '458be7b8-f6b8-4319-b264-dc6c7cc36ae7');
 IF n>0 THEN RAISE EXCEPTION 'User forum content references release; do not cascade',n; END IF;
END $checks$;
ROLLBACK;
-- If a real regression requires reversal:
-- 1. Review all other FKs, public sitemap, canonical URLs and user-linked content.
-- 2. Obtain authorized, dependency-aware exact ID restoration transaction from protected JSONB snapshots.
-- 3. Verify public evidence gate and RLS before rebuilding/removing live HTML routes.
