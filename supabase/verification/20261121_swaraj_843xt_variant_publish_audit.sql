-- TractorVS 2026-11-21, read-only exact-variant publication verification.
-- Only public published IDs: no private draft model identity in CI output.
SELECT t.model_name,t.variant,t.market,t.status,
  count(s.id) AS specs,
  count(s.id) FILTER (WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL
                     AND nullif(btrim(s.evidence_text),'') IS NOT NULL) evidence_complete,
  count(DISTINCT s.canonical_key) AS distinct_keys
FROM public.tractors t LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
WHERE t.id IN ('d22fd896-b550-41f6-9686-d6f927e53ebc','d109cb8d-9797-4852-ad3b-5713e8f9f790')
GROUP BY t.id,t.model_name,t.variant,t.market,t.status ORDER BY t.variant;

-- Expected: both India published, 24/24 fully evidenced and 24 distinct keys each.
SELECT count(DISTINCT tractor_id) published_variants,
 count(*) FILTER(WHERE spec_id IS NOT NULL) visible_verified_spec_rows,
 count(*) FILTER(WHERE source_url='https://www.swarajtractors.com/swaraj-843-xt-tractor' AND spec_id IS NOT NULL) manufacturer_source_rows
FROM public.tractorvs_public_specs
WHERE tractor_id IN ('d22fd896-b550-41f6-9686-d6f927e53ebc','d109cb8d-9797-4852-ad3b-5713e8f9f790');
-- Expected 2 / 48 / 48. View must remain security_invoker=true and security_barrier=true.

SELECT reloptions FROM pg_class WHERE oid='public.tractorvs_public_specs'::regclass;
SELECT has_table_privilege('anon','public.tractorvs_image_candidates','SELECT') AS anon_can_read_private_image_queue;
-- Expected false.
