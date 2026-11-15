-- Rollback for 20261115000400_tractorvs_public_catalog_view.sql
-- Removes only the dedicated public catalogue view. No underlying data is changed.

BEGIN;

DROP VIEW IF EXISTS public.tractorvs_public_specs;

NOTIFY pgrst, 'reload schema';

COMMIT;
