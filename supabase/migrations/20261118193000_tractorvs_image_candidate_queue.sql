-- TractorVS: rights-first photo research for ALL current and future tractors.
-- Includes draft/published tractors but never publishes image candidates.
-- Re-runnable, no DROP or DELETE, RLS enabled before any grants.
BEGIN;

CREATE TABLE IF NOT EXISTS public.tractorvs_image_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tractor_id uuid NOT NULL REFERENCES public.tractors(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'research_needed'
    CHECK (status IN ('research_needed','candidate','license_review',
                     'identity_review','approved','rejected')),
  source_page_url text,
  source_image_url text,
  photographer text,
  license_name text,
  license_url text,
  rights_verified_at timestamptz,
  identity_verified_at timestamptz,
  candidate_variant text,
  image_asset_url text,
  reviewed_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tc_img_candidate_source_https CHECK (
    source_page_url IS NULL OR source_page_url LIKE 'https://%'
  ),
  CONSTRAINT tc_img_candidate_image_https CHECK (
    source_image_url IS NULL OR source_image_url LIKE 'https://%'
  ),
  CONSTRAINT tc_img_candidate_license_https CHECK (
    license_url IS NULL OR license_url LIKE 'https://%'
  ),
  CONSTRAINT tc_img_candidate_approval_guard CHECK (
    status <> 'approved' OR (
      source_page_url IS NOT NULL AND source_image_url IS NOT NULL
      AND nullif(btrim(photographer),'') IS NOT NULL
      AND nullif(btrim(license_name),'') IS NOT NULL
      AND license_url IS NOT NULL AND rights_verified_at IS NOT NULL
      AND identity_verified_at IS NOT NULL AND image_asset_url IS NOT NULL
    )
  )
);
ALTER TABLE public.tractorvs_image_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tractorvs_image_candidates FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.tractorvs_image_candidates TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS tractorvs_img_placeholder_unique
  ON public.tractorvs_image_candidates(tractor_id)
  WHERE source_image_url IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tractorvs_img_source_unique
  ON public.tractorvs_image_candidates(tractor_id,source_image_url)
  WHERE source_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS tractorvs_img_status_idx
  ON public.tractorvs_image_candidates(status,tractor_id);

-- Read-only from client roles: no RLS policies grant photos from drafts.
-- Generate one backlog row per eligible tractor; never invent a photograph.
INSERT INTO public.tractorvs_image_candidates(tractor_id,status)
SELECT t.id,'research_needed'
FROM public.tractors t
WHERE t.status IN ('published','draft')
  AND NOT EXISTS (
    SELECT 1 FROM public.tractorvs_image_candidates c
    WHERE c.tractor_id=t.id AND c.source_image_url IS NULL
  )
ON CONFLICT DO NOTHING;

-- New draft or published tractor records receive a safe backlog item.
CREATE OR REPLACE FUNCTION public.tractorvs_queue_image_candidate_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $function$
BEGIN
  IF NEW.status IN ('published','draft') THEN
    INSERT INTO public.tractorvs_image_candidates(tractor_id,status)
    VALUES(NEW.id,'research_needed')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.tractorvs_queue_image_candidate_v1()
  FROM PUBLIC, anon, authenticated;

DO $guard$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.tractors'::regclass
      AND tgname='tractorvs_image_candidate_queue_v1' AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER tractorvs_image_candidate_queue_v1
      AFTER INSERT OR UPDATE OF status ON public.tractors
      FOR EACH ROW EXECUTE FUNCTION public.tractorvs_queue_image_candidate_v1();
  END IF;
END;
$guard$;
COMMIT;
