# TractorCompare AI — v22.0 hardening candidate

## Baseline and safety

- Immutable baseline: `indexim.txt` at commit `e0330904f1d5f3bf28a1af27762ab4ea6229df1b`.
- Baseline blob SHA: `0f88d73c8cd3d93c992c9e07655d989933687398`.
- Candidate source: `candidate/index-v22.0.ts`.
- This is a review candidate only. It has **not** been deployed to Supabase and does not replace `indexim.txt`.
- No tractor, spec, finding, document, PDF, hash, or research-run data is modified by committing these candidate files.

## Candidate code changes

1. Stops the cross-document notes overwrite. Source-specific document notes and model/variant markers stay attached to their own document. Run-wide citations remain in `ai_research_runs.result_meta`.
2. Validates UUID input for target tractor, queue, run, and stored brand identifiers. Rejects the literal string `undefined`.
3. Bounds PostgreSQL INTEGER inputs (`page_number`, `rated_rpm`) to positive int32 values.
4. Rejects confidence values outside 0–1 or 0–100 instead of silently converting arbitrarily large values to 1.0.
5. Validates manual start/status/diagnose callers using Supabase Auth and an explicit server-side UUID allowlist.
6. Reuses an existing active run for a pinned tractor, handles the unique-index race, and saves `last_run_id` onto the queue row immediately after creating the run.
7. Sets the Gemini output ceiling to 65,536 tokens. The documented maximum output for Gemini 3.5 Flash and 3.8 Flash is 65,536.
8. Keeps `AUTO_APPROVE_VERIFIED_FINDINGS = false`. All candidate findings remain subject to human approval.

## Required Edge Function secrets before deployment

Keep the existing server-side secrets:

- `SUPABASE_URL`
- `DB_SECRET_KEY` (service-role/server secret; never expose to the browser)
- `GEMINI_API_KEY`
- `TC_QUEUE_SECRET`

Add:

- `TC_RESEARCH_ALLOWED_USER_IDS`: comma-separated UUIDs of the Supabase Auth users allowed to call manual `start`, `status`, `poll`, and `diagnose` actions. This secret is intentionally fail-closed: without it these endpoints return HTTP 503. Queue actions continue to use `x-queue-secret`.

Use only the intended administrator UUIDs. Do not put this allowlist or service-role key in client-side code.

## Migration order

1. Review and apply `supabase/migrations/202611150001_tc_research_function_search_path.sql`. It changes only the search path of the two existing SECURITY DEFINER queue RPCs; their function bodies and data are unchanged.
2. **Do not apply migration 002 yet.** The latest audit found two active Spire F Target runs for the same tractor:
   - `8a0d09a5-15fe-4eac-89e4-55252d6b68a3`
   - `e9e42fbd-85e8-4525-a2d4-9d5bacfe6245`
   
   Check both Gemini interaction states and their associated documents/findings first. Do not delete either run or blindly cancel one. Preserve all useful evidence. Resolve only after the provider state and saved work establish which run should remain active.
3. After the duplicate active-run audit is resolved, apply `supabase/migrations/202611150002_tc_active_research_unique_index.sql`. It refuses to create the index while any tractor has more than one queued/running run. It does not delete or rewrite records.
4. Configure `TC_RESEARCH_ALLOWED_USER_IDS`, then deploy the candidate file to the correct existing Supabase Edge Function only after local/Deno type-checking and staging verification.

## Remaining gates before production

- The repository snapshot has no `supabase/config.toml` or existing `supabase/functions/` directory, so the live Edge Function name and JWT deployment configuration must be confirmed before deployment.
- The canonical taxonomy corrections (maximum power with boost/IPM/DP, transmission oil capacity, and hitch category) need a final compatibility check against the app's comparison UI before a data-changing migration is authored.
- The existing source pipeline checks the PDF `%PDF-` signature and requires HTML content types for web pages. It still needs a complete Deno type-check and staging tests against representative manufacturer sources.
- Run `candidate/sql/20261115_conflict_and_notes_audit.sql` before resolving conflicts. It lists each duplicate active run with document/finding counts and identifies documents carrying the legacy `Gemini summary:` notes marker.
- The previous cross-document notes contamination is not retroactively rewritten. Use that read-only report to identify affected rows before any repair is considered.
- The 24 Agrale findings without page numbers remain pending until the PDF pages are visually checked.
- All manual `tractor_specs` rows and current official PDF evidence remain protected.
