-- MANUAL RECOVERY PRECHECK ONLY, NOT A DATA RESTORE.
-- This file has no UPDATE/DELETE/INSERT; it is safe to inspect before discussing rollback.
-- Never delete/cascade published models without all forum/image/review/SEO FK dependency checks.
BEGIN;
SET LOCAL statement_timeout='15s';
DO $safe$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM tc_backup.tractor_publication_patches
 WHERE batch_id='20261121_sonalika_di30_di734_gt20_v1';
 IF n<>45 THEN RAISE EXCEPTION 'Backup missing or drifted, abort recovery inspection: %',n; END IF;
 SELECT count(*) INTO n FROM public.tractorvs_public_specs
 WHERE tractor_id IN('ad248a3c-d9af-45f9-9aff-93c54d2f45e8',
 'd5d14815-e556-4485-a747-a3de3ebf2b81','15fca0db-11a6-486d-872e-fc0518d78cd0')
 AND spec_id IS NOT NULL;
 IF n<>41 THEN RAISE EXCEPTION 'Public evidence changed to %, manual review required',n; END IF;
 SELECT count(*) INTO n FROM public.tc_forum_topics WHERE tractor_id IN(
 'ad248a3c-d9af-45f9-9aff-93c54d2f45e8',
 'd5d14815-e556-4485-a747-a3de3ebf2b81',
 '15fca0db-11a6-486d-872e-fc0518d78cd0');
 IF n>0 THEN RAISE EXCEPTION 'Referenced user content exists; do not cascade %',n; END IF;
END $safe$;
ROLLBACK;
-- Only after approved dependent-object audit, prepare a separate exact-ID
-- rollback transaction using the 45 private pre-publication JSONB snapshots.
