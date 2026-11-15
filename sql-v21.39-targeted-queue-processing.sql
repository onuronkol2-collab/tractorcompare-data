-- TractorCompare AI v21.39 — exact-ID queue claim function
-- Purpose: let the Edge Function process explicitly selected tractor IDs without
-- consuming unrelated global queue jobs.
-- This migration does not alter any queue row or run research by itself.

BEGIN;

CREATE OR REPLACE FUNCTION public.tc_claim_tractor_research_by_id(
    p_tractor_id uuid
)
RETURNS SETOF public.tractor_research_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    selected_id uuid;
BEGIN
    IF p_tractor_id IS NULL THEN
        RAISE EXCEPTION 'p_tractor_id is required';
    END IF;

    SELECT q.id
    INTO selected_id
    FROM public.tractor_research_queue q
    WHERE q.tractor_id = p_tractor_id
      AND (
            (
                q.status IN ('queued', 'retry')
                AND q.next_attempt_at <= NOW()
            )
            OR
            (
                q.status = 'running'
                AND q.updated_at < NOW() - INTERVAL '20 minutes'
            )
      )
      AND q.attempt_count < q.max_attempts
    ORDER BY
        q.priority ASC,
        q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF selected_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    UPDATE public.tractor_research_queue q
    SET
        status = 'running',
        attempt_count = q.attempt_count + 1,
        updated_at = NOW()
    WHERE q.id = selected_id
      AND q.tractor_id = p_tractor_id
    RETURNING q.*;
END;
$function$;

-- Only the Edge Function's service-role database client may invoke this RPC.
REVOKE ALL ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) TO service_role;

COMMENT ON FUNCTION public.tc_claim_tractor_research_by_id(uuid) IS
'Atomically claims the next eligible research queue row for one exact tractor ID. Does not consume jobs belonging to other tractor IDs. Intended for the authenticated Edge Function service role.';

COMMIT;

-- Read-only verification: confirms function signature, security mode and SQL body.
SELECT
    p.oid::regprocedure AS function_signature,
    p.prosecdef AS security_definer,
    pg_get_userbyid(p.proowner) AS function_owner,
    pg_get_functiondef(p.oid) AS function_definition,
    has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'tc_claim_tractor_research_by_id';
