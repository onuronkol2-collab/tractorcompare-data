-- TractorCompare AI v22.0 candidate
-- Security-definer queue RPCs: put trusted system catalog first.
-- Existing function bodies are retained; this only changes their search_path.
-- Tables referenced by these functions are already schema-qualified as public.*.

ALTER FUNCTION public.tc_claim_next_tractor_research()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.tc_claim_tractor_research_by_id(uuid)
  SET search_path = pg_catalog, public;
