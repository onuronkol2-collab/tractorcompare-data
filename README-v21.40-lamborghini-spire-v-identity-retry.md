# TractorCompare AI v21.40 — Lamborghini Spire V identity correction

## Confirmed official evidence

The official Lamborghini Trattori Spire F/S/V 80 Target Stage V brochure at:

`https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8`

contains three separate technical tables:
- Printed page 5: `TECHNICAL DATA — SPIRE F 80 TARGET`
- Printed page 6: `TECHNICAL DATA — SPIRE S 80 TARGET`
- Printed page 7: `TECHNICAL DATA — SPIRE V 80 TARGET`

The previous V run extracted 56 candidates but saved zero findings. The strict identity checks showed the exact token sequence, but Gemini returned `model_found=false` and the result model name did not satisfy exact matching. No incorrect V findings were saved.

## v21.40 code changes

`index-v21.40.ts` adds two narrowly scoped official PDF page mappings:
- Exact brand: Lamborghini Trattori
- Exact model: Spire S 80 Target or Spire V 80 Target
- Exact official PDF URL: 7988...
- Exact printed page heading and page number in the evidence note

This allows the existing queue-pinned source verification to pass only if the source document is preferred, model-specific, HTTP 200, relevance score >= 100, and hosted on the approved official manufacturer domain. It does not relax the strict Gemini identity rule globally and does not trust arbitrary PDFs.

The result metadata distinguishes an official PDF cross-reference from the existing official HTML cross-reference through `pinned_official_pdf_cross_reference_passed`.

All other v21.39 behavior, including exact-ID queue processing, remains intact. Automatic approval remains disabled.

## Deployment

1. Deploy the complete `index-v21.40.ts` as the Supabase Edge Function source.
2. Run `sql-v21.40-lamborghini-spire-v-identity-retry.sql` once in SQL Editor. It:
   - Verifies the S run is completed and its 56 pending findings are persisted to the exact S tractor.
   - Verifies the V run is the exact failed zero-persisted run.
   - Verifies the exact S and V queue IDs and official PDF registry entry.
   - Marks the completed S queue row complete.
   - Requeues only the V queue row, clearing the old failed run ID so the next request starts a fresh v21.40 research run.
   - Does not modify any findings or publish any data.

Expected post-SQL state:
- S queue `8f407f35-9112-4338-81ee-d1d9436b186d`: `completed`, with successful run ID `37450e92-79bd-4bca-8daf-c720676ab4ff`.
- V queue `b914d47a-258c-45e3-85d3-2d8cb5b41e49`: `queued`, `last_run_id = NULL`.

## Start only V after the migration

Use the deployed v21.40 Edge Function Test panel with the existing queue secret:

```json
{
  "action": "process_queue_for_tractors",
  "tractor_ids": [
    "5139abf5-726b-4cc0-961a-e9f0277e0ead"
  ]
}
```

This starts only Spire V 80 Target. It cannot claim another brand/model.

Expected successful identity evidence:
- `model_found: true`
- `pinned_source_identity_verified: true`
- `identity_checks.pinned_official_pdf_cross_reference_passed: true`
- `identity_checks.pinned_cross_reference_status: "verified_official_pdf_model_page"`
- `matched_tractor_id: 5139abf5-726b-4cc0-961a-e9f0277e0ead`
- Findings remain `pending`; automatic publication is `0`.

The S research already completed with 56 pending findings. Do not run the S research again unless a later audit identifies a specific gap.
