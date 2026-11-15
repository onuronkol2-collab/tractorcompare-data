-- TractorCompare AI v22.0 candidate — canonical taxonomy audit
-- READ ONLY: no data or schema changes are performed.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

WITH target_functions AS (
  SELECT
    p.oid,
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS identity_arguments,
    p.prosecdef AS security_definer,
    p.proconfig AS configuration
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'tc_canonical_spec_key_v21_42_alias',
      'tc_canonical_spec_class',
      'tc_apply_spec_taxonomy',
      'tc_set_finding_canonical_key'
    )
),
reports AS (
  SELECT
    'FUNCTION_DEFINITION'::text AS report_section,
    jsonb_build_object(
      'function_name', proname,
      'identity_arguments', identity_arguments,
      'security_definer', security_definer,
      'configuration', configuration,
      'definition', pg_get_functiondef(oid)
    ) AS details
  FROM target_functions

  UNION ALL

  SELECT
    'TAXONOMY_TRIGGER'::text,
    jsonb_build_object(
      'table_schema', n.nspname,
      'table_name', c.relname,
      'trigger_name', t.tgname,
      'enabled_state', t.tgenabled,
      'trigger_definition', pg_get_triggerdef(t.oid, true),
      'function_name', p.proname,
      'function_arguments', pg_get_function_identity_arguments(p.oid)
    )
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
  WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND c.relname IN ('tractor_specs', 'ai_research_findings')

  UNION ALL

  SELECT
    'TAXONOMY_USAGE'::text,
    jsonb_build_object(
      'table_name', x.table_name,
      'canonical_key', x.canonical_key,
      'comparison_class', x.comparison_class,
      'spec_name', x.spec_name,
      'row_count', x.row_count
    )
  FROM (
    SELECT
      'tractor_specs'::text AS table_name,
      canonical_key,
      comparison_class,
      spec_name,
      count(*) AS row_count
    FROM public.tractor_specs
    WHERE lower(coalesce(spec_name, '')) ~
      '(max(imum)?[[:space:]_-]*power|transmission.*oil|oil.*capacity|hitch|3[[:space:]_-]?point|three[[:space:]_-]?point)'
      OR canonical_key IN (
        'engine_max_power',
        'engine_max_power_with_boost',
        'engine_max_power_with_ipm',
        'engine_max_power_with_dp',
        'transmission_oil_capacity',
        'rear_hitch_category',
        'three_point_linkage_category'
      )
    GROUP BY canonical_key, comparison_class, spec_name

    UNION ALL

    SELECT
      'ai_research_findings'::text,
      canonical_key,
      comparison_class,
      spec_name,
      count(*) AS row_count
    FROM public.ai_research_findings
    WHERE lower(coalesce(spec_name, '')) ~
      '(max(imum)?[[:space:]_-]*power|transmission.*oil|oil.*capacity|hitch|3[[:space:]_-]?point|three[[:space:]_-]?point)'
      OR canonical_key IN (
        'engine_max_power',
        'engine_max_power_with_boost',
        'engine_max_power_with_ipm',
        'engine_max_power_with_dp',
        'transmission_oil_capacity',
        'rear_hitch_category',
        'three_point_linkage_category'
      )
    GROUP BY canonical_key, comparison_class, spec_name
  ) x

  UNION ALL

  SELECT
    'TAXONOMY_SAMPLE_TRACTOR_SPEC'::text,
    jsonb_build_object(
      'id', s.id,
      'tractor_id', s.tractor_id,
      'spec_name', s.spec_name,
      'spec_value', s.spec_value,
      'unit', s.unit,
      'canonical_key', s.canonical_key,
      'comparison_class', s.comparison_class,
      'measurement_standard', s.measurement_standard,
      'rated_rpm', s.rated_rpm,
      'managed_by_ai', s.managed_by_ai,
      'source_document_id', s.source_document_id
    )
  FROM public.tractor_specs s
  WHERE lower(coalesce(s.spec_name, '')) ~
    '(max(imum)?[[:space:]_-]*power|transmission.*oil|oil.*capacity|hitch|3[[:space:]_-]?point|three[[:space:]_-]?point)'
    OR s.canonical_key IN (
      'engine_max_power',
      'engine_max_power_with_boost',
      'engine_max_power_with_ipm',
      'engine_max_power_with_dp',
      'transmission_oil_capacity',
      'rear_hitch_category',
      'three_point_linkage_category'
    )
  ORDER BY s.spec_name, s.created_at DESC
  LIMIT 40

  UNION ALL

  SELECT
    'TAXONOMY_SAMPLE_FINDING'::text,
    jsonb_build_object(
      'id', f.id,
      'run_id', f.run_id,
      'tractor_id', f.tractor_id,
      'spec_name', f.spec_name,
      'spec_value', f.spec_value,
      'unit', f.unit,
      'canonical_key', f.canonical_key,
      'comparison_class', f.comparison_class,
      'measurement_standard', f.measurement_standard,
      'rated_rpm', f.rated_rpm,
      'review_status', f.review_status,
      'evidence_text', left(f.evidence_text, 500),
      'source_url', f.source_url
    )
  FROM public.ai_research_findings f
  WHERE lower(coalesce(f.spec_name, '')) ~
    '(max(imum)?[[:space:]_-]*power|transmission.*oil|oil.*capacity|hitch|3[[:space:]_-]?point|three[[:space:]_-]?point)'
    OR f.canonical_key IN (
      'engine_max_power',
      'engine_max_power_with_boost',
      'engine_max_power_with_ipm',
      'engine_max_power_with_dp',
      'transmission_oil_capacity',
      'rear_hitch_category',
      'three_point_linkage_category'
    )
  ORDER BY f.created_at DESC
  LIMIT 60
)
SELECT report_section, details
FROM reports
ORDER BY report_section, details->>'function_name', details->>'spec_name';

COMMIT;
