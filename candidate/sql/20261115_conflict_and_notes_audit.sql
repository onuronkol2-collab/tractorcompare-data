-- TractorCompare AI v22.0 candidate — read-only conflict/provenance audit
-- No INSERT/UPDATE/DELETE/DDL is performed.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

WITH duplicate_tractors AS (
  SELECT tractor_id
  FROM public.ai_research_runs
  WHERE tractor_id IS NOT NULL
    AND status IN ('queued', 'running')
  GROUP BY tractor_id
  HAVING count(*) > 1
),
document_counts AS (
  SELECT
    run_id,
    count(*) AS document_count,
    count(*) FILTER (WHERE source_type = 'pdf') AS pdf_count
  FROM public.ai_research_documents
  GROUP BY run_id
),
finding_counts AS (
  SELECT
    run_id,
    count(*) AS finding_count,
    count(*) FILTER (WHERE review_status = 'pending') AS pending_count,
    count(*) FILTER (WHERE review_status = 'approved') AS approved_count,
    count(*) FILTER (WHERE review_status = 'duplicate') AS duplicate_count
  FROM public.ai_research_findings
  GROUP BY run_id
),
reports AS (
  SELECT
    'ACTIVE_RUN_CONFLICT'::text AS report_section,
    jsonb_build_object(
      'tractor_id', r.tractor_id,
      'brand', b.name,
      'model_name', t.model_name,
      'run_id', r.id,
      'run_status', r.status,
      'created_at', r.created_at,
      'updated_at', r.updated_at,
      'gemini_model', r.gemini_model,
      'gemini_interaction_id', r.gemini_interaction_id,
      'error_message', r.error_message,
      'document_count', coalesce(dc.document_count, 0),
      'pdf_count', coalesce(dc.pdf_count, 0),
      'finding_count', coalesce(fc.finding_count, 0),
      'pending_count', coalesce(fc.pending_count, 0),
      'approved_count', coalesce(fc.approved_count, 0),
      'duplicate_count', coalesce(fc.duplicate_count, 0)
    ) AS details
  FROM public.ai_research_runs r
  JOIN duplicate_tractors x ON x.tractor_id = r.tractor_id
  LEFT JOIN public.tractors t ON t.id = r.tractor_id
  LEFT JOIN public.brands b ON b.id = t.brand_id
  LEFT JOIN document_counts dc ON dc.run_id = r.id
  LEFT JOIN finding_counts fc ON fc.run_id = r.id

  UNION ALL

  SELECT
    'DOCUMENT_NOTES_REVIEW'::text,
    jsonb_build_object(
      'document_id', d.id,
      'run_id', d.run_id,
      'source_url', d.source_url,
      'final_url', d.final_url,
      'source_type', d.source_type,
      'content_hash', d.content_hash,
      'has_legacy_run_summary_marker', position('Gemini summary:' in coalesce(d.notes, '')) > 0,
      'has_model_identity_marker', position('TC_EXACT_MODEL_EVIDENCE:' in coalesce(d.notes, '')) > 0,
      'has_variant_identity_marker', position('TC_EXACT_VARIANT_EVIDENCE:' in coalesce(d.notes, '')) > 0,
      'documents_with_legacy_summary_in_same_run',
        (SELECT count(*)
         FROM public.ai_research_documents d2
         WHERE d2.run_id = d.run_id
           AND position('Gemini summary:' in coalesce(d2.notes, '')) > 0)
    )
  FROM public.ai_research_documents d
  WHERE position('Gemini summary:' in coalesce(d.notes, '')) > 0
)
SELECT report_section, details
FROM reports
ORDER BY report_section, details->>'run_id', details->>'source_url', details->>'run_id';

COMMIT;
