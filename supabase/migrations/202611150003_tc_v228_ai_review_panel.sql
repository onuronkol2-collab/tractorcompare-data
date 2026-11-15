-- TractorCompare AI v22.8 — evidence-gated auto approval and simple admin review panel
-- Candidate branch only. Apply only after reviewing the migration and deploying indexim-v22.8.ts.
-- Existing research findings and tractor specifications are preserved.

BEGIN;

ALTER TABLE public.ai_research_findings
  ADD COLUMN IF NOT EXISTS quality_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.ai_research_findings.quality_meta IS
  'Deterministic AI quality-gate results, semantic risk flags and human-review metadata. Does not replace evidence_text/source_url/page_number.';

CREATE TABLE IF NOT EXISTS public.ai_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id uuid REFERENCES public.ai_research_findings(id) ON DELETE SET NULL,
  tractor_id uuid REFERENCES public.tractors(id) ON DELETE SET NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('ai', 'admin')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('auto_approve', 'approve', 'edit_approve', 'reject', 'undo')),
  previous_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_research_findings_review_status_created_idx
  ON public.ai_research_findings (review_status, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_review_events_finding_created_idx
  ON public.ai_review_events (finding_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_review_events_tractor_created_idx
  ON public.ai_review_events (tractor_id, created_at DESC);

ALTER TABLE public.ai_review_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_review_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_review_events TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
