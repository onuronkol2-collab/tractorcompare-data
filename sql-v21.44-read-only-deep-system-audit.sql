-- TractorCompare AI v21.44 — READ-ONLY DEEP SYSTEM AUDIT
-- Purpose:
--   One consolidated, non-mutating inspection of schema, security, AI research,
--   source provenance, queues, catalog identity, canonicalization and duplicates.
--
-- SAFETY:
--   * This script is read-only. It starts a READ ONLY transaction.
--   * It does not create tables/functions, alter data, approve findings, publish
--     tractors, change queue records, or read/display secret values.
--   * It reads only PostgreSQL metadata and the known TractorCompare core tables.
--   * Run once in Supabase SQL Editor. Each SELECT produces a separate result set.
--
-- Expected core tables (based on the project's previously shared code):
--   brands, tractors, tractor_specs, data_sources, ai_research_runs,
--   ai_research_documents, ai_research_findings, tractor_research_queue.
--
-- IMPORTANT:
--   This audit intentionally reports what is actually present. It does not assume
--   a security policy, status, column, index, or AI rule exists merely because
--   an earlier code version expected it.

BEGIN READ ONLY;
SET LOCAL statement_timeout = '90s';
SET LOCAL lock_timeout = '2s';

-- 0. Safe environment/context check. No credentials or secret values are selected.
SELECT
  current_database() AS database_name,
  current_user AS executing_role,
  current_setting('server_version') AS postgres_version,
  current_setting('pgrst.db_schemas', true) AS postgrest_exposed_schemas,
  now() AS audit_timestamp,
  'READ ONLY — no database rows or schema objects changed' AS audit_mode;

-- 1. Every table/view/materialized view/sequence in public, with RLS and size.
SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'p' THEN 'partitioned_table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized_view'
    WHEN 'f' THEN 'foreign_table'
    WHEN 'S' THEN 'sequence'
    ELSE c.relkind::text
  END AS object_type,
  pg_get_userbyid(c.relowner) AS owner_name,
  c.relpersistence AS persistence,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  COALESCE(st.n_live_tup, 0) AS estimated_live_rows,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  c.reloptions AS relation_options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables st ON st.relid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind IN ('r','p','v','m','f','S')
ORDER BY
  CASE c.relkind WHEN 'r' THEN 1 WHEN 'p' THEN 2 WHEN 'v' THEN 3 WHEN 'm' THEN 4 ELSE 5 END,
  c.relname;

-- 2. Full public-schema column inventory, including defaults and descriptions.
SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  a.attnum AS ordinal_position,
  a.attname AS column_name,
  format_type(a.atttypid, a.atttypmod) AS data_type,
  NOT a.attnotnull AS is_nullable,
  pg_get_expr(ad.adbin, ad.adrelid) AS column_default,
  a.attidentity AS identity_kind,
  a.attgenerated AS generated_kind,
  col_description(c.oid, a.attnum) AS column_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relkind IN ('r','p','v','m','f')
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- 3. Constraints: primary keys, foreign keys, unique rules, checks and exclusions.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  con.conname AS constraint_name,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    WHEN 'x' THEN 'EXCLUSION'
    ELSE con.contype::text
  END AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS definition,
  con.convalidated AS validated,
  rn.nspname AS referenced_schema,
  rc.relname AS referenced_table
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_class rc ON rc.oid = con.confrelid
LEFT JOIN pg_namespace rn ON rn.oid = rc.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, con.contype, con.conname;

-- 4. Index inventory and validity (including partial/unique indexes).
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_definition,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_indexes
LEFT JOIN pg_stat_user_indexes
  ON schemaname = (SELECT nspname FROM pg_namespace WHERE oid = (SELECT relnamespace FROM pg_class WHERE relname = pg_indexes.indexname LIMIT 1))
 AND indexname = pg_indexes.indexname
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Row-level security policies. An enabled RLS table with no applicable policy
--    can intentionally deny access; policies must be reviewed together with grants.
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Effective table privileges for public-facing and backend roles.
--    This reports privileges, not credentials. It helps detect tables exposed
--    to anon/authenticated without an appropriate RLS policy.
SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  r.rolname AS role_name,
  has_table_privilege(r.oid, c.oid, 'SELECT') AS can_select,
  has_table_privilege(r.oid, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(r.oid, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(r.oid, c.oid, 'DELETE') AS can_delete,
  has_table_privilege(r.oid, c.oid, 'TRUNCATE') AS can_truncate,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND c.relkind IN ('r','p','v','m','f')
  AND r.rolname IN ('anon','authenticated','service_role','postgres','supabase_admin')
ORDER BY c.relname, r.rolname;

-- 7. Security-definer functions/RPCs and execute exposure. Function bodies are
--    deliberately not printed to avoid accidentally disclosing hard-coded secrets.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  l.lanname AS language,
  p.prokind AS routine_kind,
  p.prosecdef AS security_definer,
  p.provolatile AS volatility,
  p.proconfig AS function_settings,
  CASE
    WHEN p.prosecdef
      AND NOT COALESCE(array_to_string(p.proconfig, ',') ILIKE '%search_path=%', false)
      THEN 'REVIEW: SECURITY DEFINER without pinned search_path'
    WHEN p.prosecdef THEN 'SECURITY DEFINER — inspect owner, grants and pinned search_path'
    ELSE 'Invoker context'
  END AS security_review,
  ARRAY(
    SELECT r.rolname
    FROM pg_roles r
    WHERE r.rolname IN ('anon','authenticated','service_role','public','postgres')
      AND has_function_privilege(r.oid, p.oid, 'EXECUTE')
    ORDER BY r.rolname
  ) AS roles_with_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
ORDER BY p.prosecdef DESC, p.proname, identity_arguments;

-- 8. Non-internal triggers and their target functions.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_state,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  pn.nspname AS function_schema,
  p.proname AS function_name,
  p.prosecdef AS trigger_function_security_definer
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace pn ON pn.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 9. Exact row counts for the known core tables.
SELECT 'brands' AS table_name, count(*) AS exact_rows FROM public.brands
UNION ALL SELECT 'tractors', count(*) FROM public.tractors
UNION ALL SELECT 'tractor_specs', count(*) FROM public.tractor_specs
UNION ALL SELECT 'data_sources', count(*) FROM public.data_sources
UNION ALL SELECT 'ai_research_runs', count(*) FROM public.ai_research_runs
UNION ALL SELECT 'ai_research_documents', count(*) FROM public.ai_research_documents
UNION ALL SELECT 'ai_research_findings', count(*) FROM public.ai_research_findings
UNION ALL SELECT 'tractor_research_queue', count(*) FROM public.tractor_research_queue
ORDER BY table_name;

-- 10. Catalog identity and publication-state summary.
SELECT
  COALESCE(to_jsonb(t)->>'status', '<NULL>') AS tractor_status,
  COALESCE(to_jsonb(t)->>'market', '<NULL>') AS market,
  count(*) AS tractor_count,
  count(*) FILTER (WHERE to_jsonb(t)->>'brand_id' IS NULL) AS missing_brand_id,
  count(*) FILTER (WHERE NULLIF(btrim(to_jsonb(t)->>'model_name'), '') IS NULL) AS missing_model_name
FROM public.tractors t
GROUP BY 1,2
ORDER BY 1,2;

-- 11. Duplicate/ambiguous tractor identities.
--     Same brand + normalized model + year + variant + market is a candidate
--     duplicate; NULL/blank identity fields are intentionally kept visible.
SELECT
  to_jsonb(t)->>'brand_id' AS brand_id,
  lower(regexp_replace(COALESCE(to_jsonb(t)->>'model_name',''), '[^a-z0-9]+', '', 'g')) AS normalized_model,
  COALESCE(NULLIF(to_jsonb(t)->>'model_year',''), '<NULL>') AS model_year,
  lower(COALESCE(NULLIF(btrim(to_jsonb(t)->>'variant'), ''), '<NULL>')) AS variant,
  lower(COALESCE(NULLIF(btrim(to_jsonb(t)->>'market'), ''), 'global')) AS market,
  count(*) AS matching_rows,
  array_agg(to_jsonb(t)->>'id' ORDER BY to_jsonb(t)->>'id') AS tractor_ids,
  array_agg(COALESCE(to_jsonb(t)->>'status','<NULL>') ORDER BY to_jsonb(t)->>'id') AS statuses
FROM public.tractors t
GROUP BY 1,2,3,4,5
HAVING count(*) > 1
ORDER BY matching_rows DESC, normalized_model
LIMIT 500;

-- 12. Queue health by status, including overdue retries and linked-run states.
SELECT
  COALESCE(to_jsonb(q)->>'status','<NULL>') AS queue_status,
  count(*) AS queue_rows,
  count(*) FILTER (
    WHERE NULLIF(to_jsonb(q)->>'next_attempt_at','') IS NOT NULL
      AND (to_jsonb(q)->>'next_attempt_at')::timestamptz <= now()
  ) AS due_or_overdue_rows,
  count(*) FILTER (WHERE NULLIF(to_jsonb(q)->>'last_error','') IS NOT NULL) AS rows_with_last_error,
  count(*) FILTER (WHERE NULLIF(to_jsonb(q)->>'last_run_id','') IS NOT NULL) AS rows_with_last_run
FROM public.tractor_research_queue q
GROUP BY 1
ORDER BY 1;

SELECT
  COALESCE(to_jsonb(q)->>'status','<NULL>') AS queue_status,
  to_jsonb(q)->>'id' AS queue_id,
  to_jsonb(q)->>'tractor_id' AS tractor_id,
  to_jsonb(q)->>'last_run_id' AS last_run_id,
  to_jsonb(q)->>'attempt_count' AS attempt_count,
  to_jsonb(q)->>'next_attempt_at' AS next_attempt_at,
  to_jsonb(q)->>'last_error' AS last_error,
  to_jsonb(r)->>'status' AS linked_run_status,
  to_jsonb(r)->>'error_message' AS linked_run_error
FROM public.tractor_research_queue q
LEFT JOIN public.ai_research_runs r
  ON r.id::text = to_jsonb(q)->>'last_run_id'
WHERE COALESCE(to_jsonb(q)->>'status','') IN ('running','retry','failed','needs_source')
   OR (NULLIF(to_jsonb(q)->>'next_attempt_at','') IS NOT NULL
       AND (to_jsonb(q)->>'next_attempt_at')::timestamptz <= now())
ORDER BY to_jsonb(q)->>'next_attempt_at' NULLS FIRST
LIMIT 1000;

-- 13. Research-run health. Shows stale/nonterminal runs and error rates without
--     dumping raw provider payloads or model/API credentials.
SELECT
  COALESCE(to_jsonb(r)->>'status','<NULL>') AS run_status,
  count(*) AS run_count,
  count(*) FILTER (WHERE NULLIF(to_jsonb(r)->>'error_message','') IS NOT NULL) AS rows_with_error,
  min(to_jsonb(r)->>'created_at') AS first_created_at,
  max(to_jsonb(r)->>'created_at') AS last_created_at
FROM public.ai_research_runs r
GROUP BY 1
ORDER BY 1;

SELECT
  to_jsonb(r)->>'id' AS run_id,
  to_jsonb(r)->>'tractor_id' AS tractor_id,
  to_jsonb(r)->>'requested_brand' AS requested_brand,
  to_jsonb(r)->>'requested_model' AS requested_model,
  to_jsonb(r)->>'status' AS run_status,
  to_jsonb(r)->>'created_at' AS created_at,
  to_jsonb(r)->>'completed_at' AS completed_at,
  to_jsonb(r)->>'error_message' AS error_message,
  to_jsonb(r)->>'gemini_model' AS gemini_model
FROM public.ai_research_runs r
WHERE COALESCE(to_jsonb(r)->>'status','') NOT IN ('completed','failed')
   OR NULLIF(to_jsonb(r)->>'error_message','') IS NOT NULL
ORDER BY to_jsonb(r)->>'created_at' DESC NULLS LAST
LIMIT 1000;

-- 14. Research findings: counts and missing-provenance/quality indicators.
--     Confidence is a model-reported score and is NOT treated as calibrated truth.
SELECT
  COALESCE(to_jsonb(f)->>'proposed_brand_name','<NULL>') AS proposed_brand,
  COALESCE(to_jsonb(f)->>'proposed_model_name','<NULL>') AS proposed_model,
  COALESCE(to_jsonb(f)->>'run_id','<NULL>') AS run_id,
  COALESCE(to_jsonb(f)->>'review_status','<NULL>') AS review_status,
  COALESCE(to_jsonb(f)->>'comparison_class','<NULL>') AS comparison_class,
  count(*) AS findings,
  count(*) FILTER (WHERE NULLIF(btrim(to_jsonb(f)->>'canonical_key'),'') IS NULL) AS missing_canonical_key,
  count(*) FILTER (WHERE COALESCE(to_jsonb(f)->>'comparison_class','') = 'other') AS class_other,
  count(*) FILTER (WHERE NULLIF(btrim(to_jsonb(f)->>'source_url'),'') IS NULL) AS missing_source_url,
  count(*) FILTER (WHERE NULLIF(btrim(to_jsonb(f)->>'document_id'),'') IS NULL) AS missing_document_id,
  count(*) FILTER (WHERE NULLIF(btrim(to_jsonb(f)->>'evidence_text'),'') IS NULL) AS missing_evidence,
  count(*) FILTER (WHERE NULLIF(to_jsonb(f)->>'page_number','') IS NULL) AS missing_page_number,
  count(*) FILTER (WHERE NULLIF(to_jsonb(f)->>'inserted_spec_id','') IS NOT NULL) AS linked_to_spec
FROM public.ai_research_findings f
GROUP BY 1,2,3,4,5
ORDER BY proposed_brand, proposed_model, run_id, review_status, comparison_class;

-- 15. Findings with source/document integrity problems or PDF page gaps.
SELECT
  to_jsonb(f)->>'id' AS finding_id,
  to_jsonb(f)->>'run_id' AS run_id,
  to_jsonb(f)->>'tractor_id' AS tractor_id,
  to_jsonb(f)->>'proposed_model_name' AS model_name,
  to_jsonb(f)->>'spec_name' AS spec_name,
  to_jsonb(f)->>'spec_value' AS spec_value,
  to_jsonb(f)->>'unit' AS unit,
  to_jsonb(f)->>'source_url' AS finding_source_url,
  to_jsonb(d)->>'source_url' AS document_source_url,
  to_jsonb(d)->>'source_type' AS source_type,
  to_jsonb(f)->>'page_number' AS page_number,
  to_jsonb(f)->>'evidence_text' AS evidence_text,
  to_jsonb(f)->>'review_status' AS review_status,
  CASE
    WHEN NULLIF(to_jsonb(f)->>'document_id','') IS NULL THEN 'MISSING_DOCUMENT_ID'
    WHEN d.id IS NULL THEN 'ORPHAN_DOCUMENT_ID'
    WHEN NULLIF(to_jsonb(f)->>'source_url','') IS NULL THEN 'MISSING_FINDING_SOURCE_URL'
    WHEN to_jsonb(f)->>'source_url' IS DISTINCT FROM to_jsonb(d)->>'source_url' THEN 'SOURCE_URL_MISMATCH'
    WHEN lower(COALESCE(to_jsonb(d)->>'source_type','')) LIKE '%pdf%'
         AND NULLIF(to_jsonb(f)->>'page_number','') IS NULL THEN 'PDF_PAGE_MISSING'
    WHEN NULLIF(to_jsonb(f)->>'evidence_text','') IS NULL THEN 'EVIDENCE_MISSING'
    ELSE 'REVIEW'
  END AS issue
FROM public.ai_research_findings f
LEFT JOIN public.ai_research_documents d
  ON d.id::text = to_jsonb(f)->>'document_id'
WHERE NULLIF(to_jsonb(f)->>'document_id','') IS NULL
   OR d.id IS NULL
   OR NULLIF(to_jsonb(f)->>'source_url','') IS NULL
   OR (to_jsonb(f)->>'source_url') IS DISTINCT FROM (to_jsonb(d)->>'source_url')
   OR (lower(COALESCE(to_jsonb(d)->>'source_type','')) LIKE '%pdf%'
       AND NULLIF(to_jsonb(f)->>'page_number','') IS NULL)
   OR NULLIF(to_jsonb(f)->>'evidence_text','') IS NULL
ORDER BY to_jsonb(f)->>'proposed_model_name', to_jsonb(f)->>'spec_name'
LIMIT 2000;

-- 16. Finding fingerprint duplicates within the same research run.
--     A duplicate here is a candidate for manual deduplication, not an instruction
--     to delete: some specs legitimately repeat by transmission/tyre/package context.
SELECT
  to_jsonb(f)->>'run_id' AS run_id,
  to_jsonb(f)->>'tractor_id' AS tractor_id,
  COALESCE(to_jsonb(f)->>'canonical_key','<NULL>') AS canonical_key,
  lower(regexp_replace(COALESCE(to_jsonb(f)->>'spec_value',''), '[^a-z0-9]+', '', 'g')) AS normalized_value,
  lower(COALESCE(to_jsonb(f)->>'unit','')) AS normalized_unit,
  COALESCE(to_jsonb(f)->>'measurement_standard','') AS measurement_scope,
  COALESCE(to_jsonb(f)->>'rated_rpm','') AS rated_rpm,
  count(*) AS duplicate_count,
  array_agg(to_jsonb(f)->>'id' ORDER BY to_jsonb(f)->>'id') AS finding_ids,
  array_agg(COALESCE(to_jsonb(f)->>'spec_name','') || ' = ' || COALESCE(to_jsonb(f)->>'spec_value','')) AS labels_and_values
FROM public.ai_research_findings f
GROUP BY 1,2,3,4,5,6,7
HAVING count(*) > 1
ORDER BY duplicate_count DESC, canonical_key
LIMIT 2000;

-- 17. Current tractor_specs ownership, provenance and duplicate/conflict indicators.
SELECT
  COALESCE(to_jsonb(s)->>'managed_by_ai','<NULL>') AS managed_by_ai,
  COALESCE(to_jsonb(s)->>'canonical_key','<NULL>') AS canonical_key,
  count(*) AS spec_rows,
  count(*) FILTER (WHERE NULLIF(to_jsonb(s)->>'source_id','') IS NULL) AS missing_source_id,
  count(*) FILTER (WHERE NULLIF(to_jsonb(s)->>'source_document_id','') IS NULL) AS missing_source_document_id,
  count(*) FILTER (WHERE NULLIF(to_jsonb(s)->>'evidence_text','') IS NULL) AS missing_evidence,
  count(*) FILTER (WHERE NULLIF(to_jsonb(s)->>'verified_at','') IS NULL) AS missing_verified_at,
  count(*) FILTER (WHERE NULLIF(to_jsonb(s)->>'last_verified_at','') IS NULL) AS missing_last_verified_at
FROM public.tractor_specs s
GROUP BY 1,2
ORDER BY 1,2;

SELECT
  to_jsonb(t)->>'model_name' AS model_name,
  to_jsonb(s)->>'tractor_id' AS tractor_id,
  to_jsonb(s)->>'canonical_key' AS canonical_key,
  to_jsonb(s)->>'unit' AS unit,
  to_jsonb(s)->>'measurement_standard' AS measurement_scope,
  to_jsonb(s)->>'rated_rpm' AS rated_rpm,
  count(*) AS rows_in_same_scope,
  array_agg(to_jsonb(s)->>'spec_value' ORDER BY to_jsonb(s)->>'spec_value') AS values_in_scope,
  array_agg(to_jsonb(s)->>'id' ORDER BY to_jsonb(s)->>'id') AS spec_ids,
  array_agg(COALESCE(to_jsonb(s)->>'managed_by_ai','<NULL>') ORDER BY to_jsonb(s)->>'id') AS ownership_flags
FROM public.tractor_specs s
LEFT JOIN public.tractors t ON t.id::text = to_jsonb(s)->>'tractor_id'
WHERE NULLIF(to_jsonb(s)->>'canonical_key','') IS NOT NULL
GROUP BY 1,2,3,4,5,6
HAVING count(*) > 1
ORDER BY rows_in_same_scope DESC, model_name, canonical_key
LIMIT 2000;

-- 18. Source-document provenance and source-family duplication signals.
SELECT
  COALESCE(to_jsonb(d)->>'source_type','<NULL>') AS source_type,
  COALESCE(to_jsonb(d)->>'model_specific','<NULL>') AS model_specific,
  COALESCE(to_jsonb(d)->>'is_preferred_technical_source','<NULL>') AS preferred_technical_source,
  count(*) AS document_count,
  count(DISTINCT to_jsonb(d)->>'source_url') AS distinct_urls,
  count(*) FILTER (WHERE NULLIF(to_jsonb(d)->>'content_hash','') IS NULL) AS missing_content_hash,
  count(*) FILTER (WHERE NULLIF(to_jsonb(d)->>'source_priority','') IS NULL) AS missing_source_priority,
  count(*) FILTER (WHERE NULLIF(to_jsonb(d)->>'http_status','') IS NULL) AS missing_http_status,
  count(*) FILTER (WHERE NULLIF(to_jsonb(d)->>'final_url','') IS NULL) AS missing_final_url,
  count(*) FILTER (WHERE NULLIF(to_jsonb(d)->>'source_relevance_score','') IS NULL) AS missing_relevance_score
FROM public.ai_research_documents d
GROUP BY 1,2,3
ORDER BY 1,2,3;

SELECT
  to_jsonb(d)->>'run_id' AS run_id,
  to_jsonb(d)->>'source_url' AS source_url,
  count(*) AS repeated_document_rows,
  array_agg(to_jsonb(d)->>'id' ORDER BY to_jsonb(d)->>'id') AS document_ids,
  array_agg(to_jsonb(d)->>'content_hash' ORDER BY to_jsonb(d)->>'id') AS content_hashes,
  array_agg(to_jsonb(d)->>'source_priority' ORDER BY to_jsonb(d)->>'id') AS source_priorities
FROM public.ai_research_documents d
GROUP BY 1,2
HAVING count(*) > 1
ORDER BY repeated_document_rows DESC
LIMIT 1000;

-- 19. Data-source registry: URL and publisher diversity. Same-host URL copies
--     must not be counted as independent evidence by an AI consensus engine.
SELECT
  COALESCE(to_jsonb(ds)->>'publisher','<NULL>') AS publisher,
  COALESCE(to_jsonb(ds)->>'source_type','<NULL>') AS source_type,
  COALESCE(to_jsonb(ds)->>'source_priority','<NULL>') AS source_priority,
  count(*) AS source_rows,
  count(DISTINCT to_jsonb(ds)->>'source_url') AS distinct_urls
FROM public.data_sources ds
GROUP BY 1,2,3
ORDER BY source_rows DESC, publisher
LIMIT 2000;

-- 20. Default privileges for public schema objects (future tables/functions may
--     be exposed differently from current objects).
SELECT
  pg_get_userbyid(d.defaclrole) AS grantor_role,
  COALESCE(n.nspname, '<GLOBAL>') AS schema_name,
  d.defaclobjtype AS object_type_code,
  d.defaclacl AS default_acl
FROM pg_default_acl d
LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
WHERE d.defaclnamespace = 0
   OR n.nspname = 'public'
ORDER BY schema_name, object_type_code;

COMMIT;

-- End v21.44 read-only audit. No remediation or approval is executed here.
