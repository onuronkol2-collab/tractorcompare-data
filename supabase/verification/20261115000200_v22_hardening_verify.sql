-- TractorCompare AI v22.0 post-migration verification
-- READ ONLY: safe to run after the hardening migration has been applied.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '30s';

WITH reports AS (
  SELECT
    'SCHEMA_COLUMN'::text AS report_section,
    pg_catalog.jsonb_build_object(
      'table_name', 'ai_research_runs',
      'column_name', 'requested_by_user_id',
      'exists', EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='ai_research_runs'
          AND column_name='requested_by_user_id' AND data_type='uuid'
      )
    ) AS details

  UNION ALL
  SELECT
    'SCHEMA_COLUMN',
    pg_catalog.jsonb_build_object(
      'table_name', 'ai_research_documents',
      'identity_evidence_columns_exist',
      (
        SELECT pg_catalog.count(*) = 4
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='ai_research_documents'
          AND column_name IN (
            'identity_evidence_model_key',
            'identity_evidence_variant_key',
            'identity_evidence_verified',
            'identity_evidence_method'
          )
      )
    )

  UNION ALL
  SELECT
    'FUNCTION_SECURITY',
    pg_catalog.jsonb_build_object(
      'function_name', p.proname,
      'identity_arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef,
      'configuration', p.proconfig,
      'anon_can_execute', pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE'),
      'authenticated_can_execute', pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE'),
      'service_role_can_execute', pg_catalog.has_function_privilege('service_role', p.oid, 'EXECUTE')
    )
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN (
      'tc_consume_edge_rate_limit',
      'tc_open_or_reuse_tractor_research_run',
      'tc_claim_next_tractor_research',
      'tc_claim_tractor_research_by_id'
    )

  UNION ALL
  SELECT
    'RATE_LIMIT_TABLE',
    pg_catalog.jsonb_build_object(
      'rls_enabled', c.relrowsecurity,
      'anon_select', pg_catalog.has_table_privilege('anon', c.oid, 'SELECT'),
      'authenticated_select', pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT'),
      'service_role_select', pg_catalog.has_table_privilege('service_role', c.oid, 'SELECT'),
      'service_role_insert', pg_catalog.has_table_privilege('service_role', c.oid, 'INSERT'),
      'service_role_update', pg_catalog.has_table_privilege('service_role', c.oid, 'UPDATE'),
      'service_role_delete', pg_catalog.has_table_privilege('service_role', c.oid, 'DELETE')
    )
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='tc_edge_rate_limits'

  UNION ALL
  SELECT
    'TRIGGER',
    pg_catalog.jsonb_build_object(
      'table_name', 'ai_research_runs',
      'trigger_name', t.tgname,
      'enabled', t.tgenabled,
      'definition', pg_catalog.pg_get_triggerdef(t.oid)
    )
  FROM pg_catalog.pg_trigger AS t
  JOIN pg_catalog.pg_class AS c ON c.oid=t.tgrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relname='ai_research_runs'
    AND t.tgname='tc_guard_active_research_run_insert'
    AND NOT t.tgisinternal

  UNION ALL
  SELECT
    'TAXONOMY_TEST',
    pg_catalog.jsonb_build_object(
      'case', v.case_name,
      'actual', public.tc_canonical_spec_key_v22_alias(v.spec_name, v.evidence_text),
      'actual_class', public.tc_canonical_spec_class(public.tc_canonical_spec_key_v22_alias(v.spec_name, v.evidence_text)),
      'expected', v.expected_key,
      'expected_class', v.expected_class,
      'pass', public.tc_canonical_spec_key_v22_alias(v.spec_name, v.evidence_text) = v.expected_key
        AND public.tc_canonical_spec_class(public.tc_canonical_spec_key_v22_alias(v.spec_name, v.evidence_text)) = v.expected_class
    )
  FROM (VALUES
    ('base max power', 'Maximum engine power', NULL::text, 'engine_max_power', 'engine'),
    ('boosted power', 'Maximum power with boost', NULL::text, 'engine_max_power_with_boost', 'engine'),
    ('Turkish boosted power', 'Maksimum Motor Gücü (Ek Güç Üretimi İle)', NULL::text, 'engine_max_power_with_boost', 'engine'),
    ('IPM power', 'Maximum power with IPM', NULL::text, 'engine_max_power_with_ipm', 'engine'),
    ('DP power', 'Maximum power with DP', NULL::text, 'engine_max_power_with_dp', 'engine'),
    ('CPM power', 'Maximum power with CPM', NULL::text, 'engine_max_power_with_cpm', 'engine'),
    ('rated-speed power', 'Maximum power at rated engine speed', NULL::text, 'engine_rated_power', 'engine'),
    ('transmission oil', 'Transmission oil capacity', NULL::text, 'transmission_oil_capacity', 'capacities'),
    ('rear hitch category', 'Arka askı bağlantısı', '3 Points - Category I Hitch', 'three_point_linkage_category', 'implements'),
    ('three point category', '3-point hitch category', 'Category, 3-point hitch I', 'three_point_linkage_category', 'implements')
  ) AS v(case_name, spec_name, evidence_text, expected_key, expected_class)

  UNION ALL
  SELECT
    'LEGACY_IDENTITY_FLAGS',
    pg_catalog.jsonb_build_object(
      'total_documents', pg_catalog.count(*),
      'verified_true', pg_catalog.count(*) FILTER (WHERE identity_evidence_verified),
      'unverified_false', pg_catalog.count(*) FILTER (WHERE NOT identity_evidence_verified),
      'note', 'Existing documents should remain unverified unless a new v22 document-specific proof was written; no legacy note backfill is expected.'
    )
  FROM public.ai_research_documents

  UNION ALL
  SELECT
    'PRE_EXISTING_ACTIVE_DUPLICATES',
    pg_catalog.jsonb_build_object(
      'tractor_id', tractor_id,
      'active_run_count', pg_catalog.count(*),
      'run_ids', pg_catalog.jsonb_agg(id ORDER BY created_at),
      'note', 'Report only. Migration intentionally does not delete, cancel or rewrite existing active runs.'
    )
  FROM public.ai_research_runs
  WHERE status IN ('queued','running')
    AND tractor_id IS NOT NULL
  GROUP BY tractor_id
  HAVING pg_catalog.count(*) > 1
)
SELECT report_section, details
FROM reports
ORDER BY report_section, details::text;

COMMIT;
