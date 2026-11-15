-- TractorVS public catalogue migration preflight.
-- READ ONLY: this script does not alter tables, policies, grants or data.
-- Run this before 20261115000400_tractorvs_public_catalog_view.sql.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

-- The invoker-security view option requires PostgreSQL 15 or newer.
SELECT
  current_setting('server_version') AS postgres_version,
  current_setting('server_version_num')::integer >= 150000
    AS security_invoker_supported;

-- 1) Required tables must exist and have RLS enabled.
SELECT
  required.table_name,
  c.oid IS NOT NULL AS table_exists,
  COALESCE(c.relrowsecurity, false) AS rls_enabled,
  COALESCE(c.relforcerowsecurity, false) AS force_rls_enabled
FROM (
  VALUES
    ('data_sources'),
    ('tractor_specs'),
    ('tractors'),
    ('brands')
) AS required(table_name)
LEFT JOIN pg_catalog.pg_namespace AS n
  ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class AS c
  ON c.relnamespace = n.oid
 AND c.relname = required.table_name
ORDER BY required.table_name;

-- 2) data_sources must not already be readable by anon/authenticated,
-- either through a table-level grant or any column-level grant.
SELECT
  has_table_privilege('anon', 'public.data_sources', 'SELECT')
    AS anon_has_full_source_table_select,
  has_table_privilege('authenticated', 'public.data_sources', 'SELECT')
    AS authenticated_has_full_source_table_select,
  has_any_column_privilege('anon', 'public.data_sources', 'SELECT')
    AS anon_has_any_source_column_select,
  has_any_column_privilege('authenticated', 'public.data_sources', 'SELECT')
    AS authenticated_has_any_source_column_select;

-- 3) Show all policies on the four tables so unexpected policies are visible.
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('data_sources', 'tractor_specs', 'tractors', 'brands')
ORDER BY tablename, policyname;

-- 4) Count SELECT/ALL policies on data_sources.
-- The migration expects exactly one SELECT policy named "Public read sources".
SELECT
  count(*) FILTER (
    WHERE policyname = 'Public read sources' AND cmd = 'SELECT'
  ) AS expected_source_policy_count,
  count(*) FILTER (
    WHERE cmd IN ('SELECT', 'ALL')
      AND policyname <> 'Public read sources'
  ) AS unexpected_source_select_policy_count
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename = 'data_sources';

-- 5) Confirm the base-table columns needed by the invoker-security view
-- are selectable by both public API roles.
WITH required_columns(role_name, table_name, column_name) AS (
  VALUES
    ('anon', 'tractors', 'id'),
    ('anon', 'tractors', 'brand_id'),
    ('anon', 'tractors', 'model_name'),
    ('anon', 'tractors', 'model_year'),
    ('anon', 'tractors', 'variant'),
    ('anon', 'tractors', 'market'),
    ('anon', 'tractors', 'horsepower'),
    ('anon', 'tractors', 'engine'),
    ('anon', 'tractors', 'transmission'),
    ('anon', 'tractors', 'drivetrain'),
    ('anon', 'tractors', 'weight_kg'),
    ('anon', 'tractors', 'status'),
    ('anon', 'brands', 'id'),
    ('anon', 'brands', 'name'),
    ('anon', 'brands', 'country'),
    ('anon', 'brands', 'website_url'),
    ('anon', 'tractor_specs', 'id'),
    ('anon', 'tractor_specs', 'tractor_id'),
    ('anon', 'tractor_specs', 'spec_name'),
    ('anon', 'tractor_specs', 'spec_value'),
    ('anon', 'tractor_specs', 'unit'),
    ('anon', 'tractor_specs', 'canonical_key'),
    ('anon', 'tractor_specs', 'comparison_class'),
    ('anon', 'tractor_specs', 'measurement_standard'),
    ('anon', 'tractor_specs', 'rated_rpm'),
    ('anon', 'tractor_specs', 'evidence_text'),
    ('anon', 'tractor_specs', 'verified_at'),
    ('anon', 'tractor_specs', 'source_id'),
    ('anon', 'tractor_specs', 'source_priority'),
    ('authenticated', 'tractors', 'id'),
    ('authenticated', 'tractors', 'brand_id'),
    ('authenticated', 'tractors', 'model_name'),
    ('authenticated', 'tractors', 'model_year'),
    ('authenticated', 'tractors', 'variant'),
    ('authenticated', 'tractors', 'market'),
    ('authenticated', 'tractors', 'horsepower'),
    ('authenticated', 'tractors', 'engine'),
    ('authenticated', 'tractors', 'transmission'),
    ('authenticated', 'tractors', 'drivetrain'),
    ('authenticated', 'tractors', 'weight_kg'),
    ('authenticated', 'tractors', 'status'),
    ('authenticated', 'brands', 'id'),
    ('authenticated', 'brands', 'name'),
    ('authenticated', 'brands', 'country'),
    ('authenticated', 'brands', 'website_url'),
    ('authenticated', 'tractor_specs', 'id'),
    ('authenticated', 'tractor_specs', 'tractor_id'),
    ('authenticated', 'tractor_specs', 'spec_name'),
    ('authenticated', 'tractor_specs', 'spec_value'),
    ('authenticated', 'tractor_specs', 'unit'),
    ('authenticated', 'tractor_specs', 'canonical_key'),
    ('authenticated', 'tractor_specs', 'comparison_class'),
    ('authenticated', 'tractor_specs', 'measurement_standard'),
    ('authenticated', 'tractor_specs', 'rated_rpm'),
    ('authenticated', 'tractor_specs', 'evidence_text'),
    ('authenticated', 'tractor_specs', 'verified_at'),
    ('authenticated', 'tractor_specs', 'source_id'),
    ('authenticated', 'tractor_specs', 'source_priority')
)
SELECT
  role_name,
  table_name,
  bool_and(
    has_column_privilege(
      role_name,
      'public.' || table_name,
      column_name,
      'SELECT'
    )
  ) AS all_required_columns_selectable,
  array_agg(column_name ORDER BY column_name) FILTER (
    WHERE NOT has_column_privilege(
      role_name,
      'public.' || table_name,
      column_name,
      'SELECT'
    )
  ) AS missing_columns
FROM required_columns
GROUP BY role_name, table_name
ORDER BY role_name, table_name;

-- 6) The view should not exist yet if this is the first rollout.
SELECT
  to_regclass('public.tractorvs_public_specs') IS NOT NULL
    AS catalogue_view_already_exists;

ROLLBACK;
