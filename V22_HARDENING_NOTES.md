# TractorCompare AI — v22.0 hardening candidate

**Date:** 2026-11-15  
**Status:** Candidate files prepared on `candidate/v22.0-hardening-2026-11-15`. Not deployed. No Supabase SQL has been executed.

## Baseline and preservation

- Original baseline: `indexim.txt`, v21.40 snapshot, Git blob `0f88d73c8cd3d93c992c9e07655d989933687398`.
- The original `indexim.txt` was not changed.
- New Edge Function candidate: `indexim-v22.0.ts`.
- New database migration: `supabase/migrations/20261115000100_tractorcompare_v22_hardening.sql`.
- Read-only verification: `supabase/verification/20261115000200_v22_hardening_verify.sql`.
- Non-destructive rollback: `supabase/rollback/20261115000100_tractorcompare_v22_hardening_rollback.sql`.

No current database rows were deleted, merged, reclassified or mass-updated. Existing `ai_research_documents.notes`, source URLs, final URLs, hashes, page references, findings, AI-managed specs and human-managed `tractor_specs` are preserved. The migration does not backfill identity evidence from legacy notes. New identity columns on existing documents default to unverified.

The mandatory human-review gate remains in place. `AUTO_APPROVE_VERIFIED_FINDINGS` remains `false`; new AI findings remain pending. The 57 pending Spire F Target findings from run `374814b4-22c5-47bc-a2b3-2045e718e733` are not changed.

## v22.0 Edge Function changes

1. **Document provenance isolation:** removed the code that concatenated notes from every source document in a run and wrote the combined notes back to all documents. Run summaries, citation URLs and source lists remain on the run record's `summary/result_meta`; each document's `notes` remains source-local.
2. **Structured identity proof:** new document-specific fields store normalized model/variant identity, whether the proof passed, and the proof method. Pinned-model verification no longer trusts legacy notes markers.
3. **Curated Lamborghini mapping:** retained the model-specific PDF references: Spire F Target on printed page 5 using PDF 7987; Spire S 80 Target on page 6 and Spire V 80 Target on page 7 using PDF 7988. The exact source URL is part of each curated mapping; the matching file hash does not collapse the F/S/V identities.
4. **UUID and integer bounds:** strict UUID validation rejects values such as the literal string `undefined`. PDF page numbers and RPM values are bounded to PostgreSQL int4 positive integers before insertion.
5. **Run idempotency and queue recovery:** run creation goes through a transactionally locked RPC. The queue's `last_run_id` is written in the same transaction as the run insert, before source discovery or Gemini starts. A duplicate active request reuses an existing run rather than creating another Gemini interaction. A trigger blocks new duplicate active-run inserts, including inserts from an older Edge Function path.
6. **Bounded incomplete-output recovery:** normal runs use 32,768 output tokens. One incomplete response may be retried once at 60,000 output tokens with low thinking level; a second incomplete response moves the queue item to `needs_source` instead of looping forever. The 60,000 budget is below Gemini 3.8 Flash's documented 65,536 output-token ceiling.
7. **API authentication and throttling:** `start/research`, `status/poll` and `diagnose` require a Supabase user JWT verified with `auth.getUser()`. Users may inspect only their own runs; admins are recognized only through server-controlled `app_metadata` claims. Per-user limits: 5 starts per 15 minutes, 120 status requests per minute, 10 diagnostics per minute. Queue actions continue to require `x-queue-secret`; an external user cannot provide `queue_id`.
8. **Taxonomy:** maximum power with boost, IPM, DP and CPM are mapped separately from base maximum power. Transmission oil capacity maps to the capacities class. Hitch-category labels standardize to `three_point_linkage_category` / `implements` for new rows. Existing stored keys/classes are not mass-migrated.
9. **SECURITY DEFINER hardening:** queue-claim RPCs receive an empty search path; table references in their existing definitions are schema-qualified. Their execution remains restricted to `service_role`.

Primary Gemini model is `gemini-3.8-flash`, with `gemini-3.7-flash` as transient-error fallback. Google documents a 65,536-token output ceiling for Gemini 3.8 Flash and notes that thinking tokens are included in `max_output_tokens`; this is why the larger one-time recovery budget is materially different from retrying again at 32,768.

## Database migration behavior

The migration is transactional and uses `IF NOT EXISTS` for added columns/table. It:
- Adds `requested_by_user_id` to `ai_research_runs`.
- Adds four source-local identity fields to `ai_research_documents`.
- Adds an RLS-enabled rate-limit table with table access restricted to `service_role`.
- Creates a rate-limit RPC and an atomic open-or-reuse research-run RPC.
- Adds an active-run insert guard. It does not create a partial unique index because the audit found pre-existing active duplicates; existing records are deliberately left intact.
- Hardens the two existing queue-claim SECURITY DEFINER functions.
- Adds a versioned taxonomy alias resolver and points the existing taxonomy trigger function to it.
- Leaves `tc_set_finding_canonical_key()` unattached; no competing trigger is introduced.

The SQL is prepared but has **not** been run against Supabase. The rollback script restores the previous alias resolver, taxonomy trigger behavior and queue-claim search path, and removes v22 runtime RPCs/guards. It intentionally keeps the added identity/ownership columns and restricted rate-limit table so any v22 evidence or ownership values are not discarded.

## Important pre-deployment decisions

### Edge Function folder and gateway JWT setting

The repository snapshot does not identify the deployed Supabase Edge Function slug and has no `supabase/config.toml`. Therefore `indexim-v22.0.ts` is a reviewed source candidate, not a drop-in deploy path yet. Before deployment, identify the real function slug and install the file at that function's expected `index.ts` path.

The handler now verifies user JWTs itself for interactive actions and the shared queue secret for worker actions. Check the deployed function's gateway `verify_jwt` setting before rollout:
- If gateway JWT verification is enabled, the internal queue caller must also send a valid project JWT in addition to `x-queue-secret`.
- If internal queue requests cannot send a JWT, configure gateway JWT verification off for this exact function slug; the candidate handler still enforces user JWT verification for interactive requests and `x-queue-secret` for queue requests.
- Never put the Supabase service-role key or queue secret in browser code.

### Existing in-flight runs

Do not cancel or delete historical research rows. In particular:
- Spire F Target has one completed run with 57 pending findings, plus two separate older running runs with distinct Gemini interaction IDs. Inspect both provider interactions before deciding whether either needs to be closed. Do not create another F run while either remains active.
- The generic Spire Target queue row remains paused because its F/S/V identity is ambiguous.
- The orphan run with null brand/model and the long-running Agrale/ISEKI runs remain audit records until their provider status and attached evidence are reviewed.

The migration's RPC reuses the newest active run with a Gemini interaction ID where possible. It does not reconcile the pre-existing duplicate Spire F runs.

## Rollout order

1. Back up the Supabase project and apply the SQL migration in staging first.
2. Run the read-only verification script and check that required columns, function grants, trigger, RLS and taxonomy tests pass.
3. Review the actual Edge Function slug and gateway JWT setting; install the candidate at the correct deployment path.
4. Deploy the Edge Function only after the migration is confirmed.
5. Smoke-test an authenticated manual start, status ownership, rate-limit behavior, an internal queue run, immediate `last_run_id` persistence, and one incomplete-output recovery.
6. Confirm new documents have their own identity metadata, document notes do not change during completion, and every new finding remains pending for human review.

## Rollback order

If v22 is deployed and must be reverted, first redeploy the previous Edge Function source (`indexim.txt` / v21.40), then run the rollback SQL. Do not remove the v22 database RPCs while the v22 Edge Function is still serving requests. The rollback intentionally leaves the added identity/ownership columns and rate-limit table in place.

## What remains deliberately out of scope

- No deletion/merging of duplicate documents or runs.
- No bulk changes to the 814 human-managed technical specifications or the 142 existing AI-managed specifications.
- No page-number assignment to the 24 Agrale 540 XT findings until the PDF page is visually checked.
- No forced selection among conflicting Deutz, Agrale, Antonio Carraro, SAME, ISEKI, Kubota or John Deere specifications; those remain variant/scope review tasks.
- No automatic publication of models or specifications.
- No production deployment and no live database mutation.
