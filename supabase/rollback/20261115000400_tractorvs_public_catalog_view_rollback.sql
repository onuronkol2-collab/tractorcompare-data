-- Rollback for 20261115000400_tractorvs_public_catalog_view.sql
-- Removes the public view and restores the original source policy.
-- No tractor, specification, AI finding or research row is changed.

BEGIN;

DROP VIEW IF EXISTS public.tractorvs_public_specs;

DROP POLICY IF EXISTS "Public read sources for published tractor specs"
ON public.data_sources;

REVOKE SELECT (id, publisher, source_url, source_type, accessed_at)
ON TABLE public.data_sources
FROM anon, authenticated;

CREATE POLICY "Public read sources"
ON public.data_sources
FOR SELECT
TO anon, authenticated
USING (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
