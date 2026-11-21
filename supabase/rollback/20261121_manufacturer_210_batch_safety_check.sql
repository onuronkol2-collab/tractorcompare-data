-- READ-ONLY PRECONDITION AUDIT; NOT A RECOVERY SCRIPT.
-- Stop and review all external links, photo ownership, forum topics, indexes and additional FK relationships
-- before restoring a prior publication state. NO UPDATE, INSERT, DELETE OR DDL is performed here.
BEGIN;
SET LOCAL statement_timeout='15s';
DO $check$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM tc_backup.tractor_publication_patches
 WHERE batch_id IN ('20261121_sonalika_official_four_models_v1','20261121_tym_four_families_six_models_v1');
 IF n<>126 THEN RAISE EXCEPTION 'Incomplete original snapshots: %, abort restore review',n; END IF;
 SELECT count(*) INTO n FROM public.tractorvs_public_specs
 WHERE tractor_id IN (
 '821bd689-5ce1-468e-a11a-66e07c7e9051','8d846784-9459-47e4-b557-982a6d6feabb',
 '596c8706-723d-4c47-befd-b0fc47bc167a','793fe40e-d19b-471f-b940-0dc39a3d2838',
 '6b8aa469-6c20-4377-9320-bd41dade4a1a','3156002b-c2a4-428d-a63d-1853d4a89812',
 '02aa9c86-2df5-4b64-96e2-7f6a9b1df830','cff4bd2c-cb82-43dc-aabe-dc4e4a5f910e',
 '840269b7-e7c3-4e57-80db-56a55e9fbf46','82fbcc0b-d0b2-4fa2-940b-f8404c384840'
 ) AND spec_id IS NOT NULL;
 IF n<>146 THEN RAISE EXCEPTION 'Live public evidence changed: %, full manual change review required',n; END IF;
END $check$;
ROLLBACK;
-- Approved recovery must separately diff 126 original JSONB snapshots, resolve
-- downstream references and write a reversible exact-record migration.
