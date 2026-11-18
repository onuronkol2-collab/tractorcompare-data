-- TractorVS additive exact-identity duplicate protection.
-- Run the READ-ONLY audit first. Existing duplicate groups abort the transaction.
-- Different markets, years or equipment variants remain distinct.
-- Never automatically delete, merge or publish tractors.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';
SELECT pg_advisory_xact_lock(2026111848);
DO $guard$
BEGIN
  IF to_regclass('public.tractors') IS NULL THEN
    RAISE EXCEPTION 'TractorVS duplicate guard: public.tractors missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.tractors t
    GROUP BY t.brand_id, lower(btrim(t.model_name)),
      lower(btrim(coalesce(t.variant,''))),
      lower(btrim(coalesce(t.market,''))), t.model_year
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'TractorVS duplicate guard: existing exact identity duplicates. Rolled back; use read-only audit, do NOT auto-merge.';
  END IF;
END
$guard$;
CREATE UNIQUE INDEX IF NOT EXISTS tractorvs_tractors_identity_v1
ON public.tractors (
  brand_id,
  lower(btrim(model_name)),
  lower(btrim(coalesce(variant,''))),
  lower(btrim(coalesce(market,''))),
  coalesce(model_year,-1)
);
COMMIT;
