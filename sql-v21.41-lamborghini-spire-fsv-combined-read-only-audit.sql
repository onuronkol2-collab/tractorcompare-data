-- TractorCompare AI v21.41 — Lamborghini Spire F/S/V combined read-only audit
-- Run in Supabase SQL Editor. This file performs SELECTs only.
-- It does NOT update tractors, queues, research runs, findings, or publication state.

WITH target_models (
  model_order, model_name, tractor_id, run_id, queue_id, expected_pdf_page, expected_findings
) AS (
  VALUES
    (1, 'Spire F Target',
     '0c8f654d-3651-401c-8f7a-0e5d488e1b37'::uuid,
     '374814b4-22c5-47bc-a2b3-2045e718e733'::uuid,
     '1ac9a3c9-550d-433f-a2b4-fcb55237d6b7'::uuid,
     5, 33),
    (2, 'Spire S 80 Target',
     'f9a68e93-5534-40b7-891f-ba0249fe25db'::uuid,
     '37450e92-79bd-4bca-8daf-c720676ab4ff'::uuid,
     '8f407f35-9112-4338-81ee-d1d9436b186d'::uuid,
     6, 56),
    (3, 'Spire V 80 Target',
     '5139abf5-726b-4cc0-961a-e9f0277e0ead'::uuid,
     '045d226e-3a20-4c9a-bab3-8a67a39aecc1'::uuid,
     'b914d47a-258c-45e3-85d3-2d8cb5b41e49'::uuid,
     7, 57)
),
target_findings AS (
  SELECT tm.*, f.*
  FROM target_models tm
  JOIN public.ai_research_findings f
    ON f.run_id = tm.run_id
),
duplicate_candidates AS (
  SELECT
    tm.model_order,
    tm.model_name,
    f.run_id,
    f.tractor_id,
    f.canonical_key,
    btrim(f.spec_value) AS spec_value,
    lower(btrim(coalesce(f.unit, ''))) AS normalized_unit,
    lower(btrim(coalesce(f.measurement_standard, ''))) AS normalized_scope,
    count(*) AS duplicate_count,
    jsonb_agg(jsonb_build_object(
      'id', f.id,
      'spec_name', f.spec_name,
      'page_number', f.page_number,
      'review_status', f.review_status
    ) ORDER BY f.created_at, f.id) AS matching_rows
  FROM target_models tm
  JOIN public.ai_research_findings f
    ON f.run_id = tm.run_id
  WHERE f.canonical_key IS NOT NULL
    AND btrim(coalesce(f.spec_value, '')) <> ''
  GROUP BY
    tm.model_order, tm.model_name, f.run_id, f.tractor_id,
    f.canonical_key, btrim(f.spec_value),
    lower(btrim(coalesce(f.unit, ''))),
    lower(btrim(coalesce(f.measurement_standard, '')))
  HAVING count(*) > 1
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'audit_version', '21.41',
    'audit_type', 'read_only_lamborghini_spire_f_s_v',
    'generated_at', now(),
    'mutations_performed', false,
    'expected_source_pages', jsonb_build_object(
      'Spire F Target', 5,
      'Spire S 80 Target', 6,
      'Spire V 80 Target', 7
    ),

    'model_overview', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'model', tm.model_name,
          'tractor_id', tm.tractor_id,
          'catalog_brand', b.name,
          'catalog_model_name', t.model_name,
          'catalog_market', t.market,
          'catalog_status', t.status,
          'horsepower_catalog_field', t.horsepower,
          'run_id', tm.run_id,
          'run_status', r.status,
          'run_requested_model', r.requested_model,
          'run_requested_year', r.requested_year,
          'run_requested_variant', r.requested_variant,
          'run_requested_market', r.requested_market,
          'run_completed_at', r.completed_at,
          'run_summary', r.summary,
          'run_result_meta', r.result_meta,
          'identity_checks', r.result_meta -> 'identity_checks',
          'pinned_target_tractor_id', r.result_meta ->> 'pinned_target_tractor_id',
          'pinned_source_identity_verified', r.result_meta ->> 'pinned_source_identity_verified',
          'queue_id', q.id,
          'queue_status', q.status,
          'queue_tractor_id', q.tractor_id,
          'queue_last_run_id', q.last_run_id,
          'queue_attempt_count', q.attempt_count,
          'queue_last_error', q.last_error,
          'findings_expected', tm.expected_findings,
          'findings_actual', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id
          ),
          'pending_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id AND f.review_status = 'pending'
          ),
          'non_pending_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id AND f.review_status <> 'pending'
          ),
          'missing_canonical_key_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id
              AND (f.canonical_key IS NULL OR btrim(f.canonical_key) = '')
          ),
          'other_class_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id
              AND lower(coalesce(f.comparison_class, '')) = 'other'
          ),
          'missing_page_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id AND f.page_number IS NULL
          ),
          'wrong_or_missing_expected_page_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id
              AND (f.page_number IS NULL OR f.page_number <> tm.expected_pdf_page)
          ),
          'missing_evidence_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id
              AND (f.evidence_text IS NULL OR btrim(f.evidence_text) = '')
          ),
          'missing_value_count', (
            SELECT count(*) FROM public.ai_research_findings f
            WHERE f.run_id = tm.run_id
              AND (f.spec_value IS NULL OR btrim(f.spec_value) = '')
          ),
          'source_document_count', (
            SELECT count(*) FROM public.ai_research_documents d
            WHERE d.run_id = tm.run_id
          )
        ) ORDER BY tm.model_order
      ), '[]'::jsonb)
      FROM target_models tm
      LEFT JOIN public.tractors t ON t.id = tm.tractor_id
      LEFT JOIN public.brands b ON b.id = t.brand_id
      LEFT JOIN public.ai_research_runs r ON r.id = tm.run_id
      LEFT JOIN public.tractor_research_queue q ON q.id = tm.queue_id
    ),

    'finding_class_and_review_summary', (
      SELECT coalesce(jsonb_agg(to_jsonb(s)
        ORDER BY s.model_order, s.comparison_class, s.review_status), '[]'::jsonb)
      FROM (
        SELECT
          tm.model_order,
          tm.model_name,
          coalesce(f.comparison_class, '[NULL]') AS comparison_class,
          coalesce(f.review_status, '[NULL]') AS review_status,
          count(*) AS finding_count,
          count(*) FILTER (WHERE f.canonical_key IS NULL OR btrim(f.canonical_key) = '') AS missing_canonical_key_count,
          count(*) FILTER (WHERE f.page_number IS NULL) AS missing_page_count,
          count(*) FILTER (WHERE f.page_number IS NULL OR f.page_number <> tm.expected_pdf_page) AS wrong_or_missing_expected_page_count,
          count(*) FILTER (WHERE f.evidence_text IS NULL OR btrim(f.evidence_text) = '') AS missing_evidence_count
        FROM target_models tm
        JOIN public.ai_research_findings f ON f.run_id = tm.run_id
        GROUP BY tm.model_order, tm.model_name, f.comparison_class, f.review_status
      ) s
    ),

    'fuel_tank_capacity_findings', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'model', tm.model_name,
          'finding_id', f.id,
          'spec_name', f.spec_name,
          'spec_value', f.spec_value,
          'unit', f.unit,
          'measurement_standard', f.measurement_standard,
          'canonical_key', f.canonical_key,
          'comparison_class', f.comparison_class,
          'page_number', f.page_number,
          'evidence_text', f.evidence_text,
          'source_url', f.source_url,
          'review_status', f.review_status
        ) ORDER BY tm.model_order, f.measurement_standard, f.spec_value
      ), '[]'::jsonb)
      FROM target_models tm
      JOIN public.ai_research_findings f ON f.run_id = tm.run_id
      WHERE f.canonical_key = 'fuel_tank_capacity'
    ),

    'all_findings_full_detail', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'model', tm.model_name,
          'expected_pdf_page', tm.expected_pdf_page,
          'finding', to_jsonb(f)
        ) ORDER BY tm.model_order, f.comparison_class, f.canonical_key, f.spec_name, f.id
      ), '[]'::jsonb)
      FROM target_models tm
      JOIN public.ai_research_findings f ON f.run_id = tm.run_id
    ),

    'source_documents_full_detail', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object('model', tm.model_name, 'document', to_jsonb(d))
        ORDER BY tm.model_order, d.source_url
      ), '[]'::jsonb)
      FROM target_models tm
      JOIN public.ai_research_documents d ON d.run_id = tm.run_id
    ),

    'duplicate_fingerprint_candidates', (
      SELECT coalesce(jsonb_agg(to_jsonb(dc)
        ORDER BY dc.model_order, dc.canonical_key, dc.spec_value), '[]'::jsonb)
      FROM duplicate_candidates dc
    ),

    'findings_linked_to_wrong_tractor', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'run_id', f.run_id,
        'finding_id', f.id,
        'finding_tractor_id', f.tractor_id,
        'expected_tractor_id', tm.tractor_id,
        'expected_model', tm.model_name,
        'spec_name', f.spec_name,
        'spec_value', f.spec_value
      ) ORDER BY tm.model_order, f.id), '[]'::jsonb)
      FROM target_models tm
      JOIN public.ai_research_findings f ON f.run_id = tm.run_id
      WHERE f.tractor_id IS DISTINCT FROM tm.tractor_id
    ),

    'unexpected_findings_on_these_tractors', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tractor_id', f.tractor_id,
        'finding_run_id', f.run_id,
        'finding_id', f.id,
        'spec_name', f.spec_name,
        'spec_value', f.spec_value,
        'review_status', f.review_status
      ) ORDER BY f.tractor_id, f.run_id, f.id), '[]'::jsonb)
      FROM public.ai_research_findings f
      WHERE f.tractor_id IN (SELECT tractor_id FROM target_models)
        AND f.run_id NOT IN (SELECT run_id FROM target_models)
    )
  )
) AS complete_lamborghini_spire_audit;
