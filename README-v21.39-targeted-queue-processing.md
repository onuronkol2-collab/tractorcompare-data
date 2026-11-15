# TractorCompare AI v21.39 — targeted queue processing

## Why this release exists

The existing `process_queue_batch` action calls the global RPC
`tc_claim_next_tractor_research()`. It selects the next eligible queue item
across every brand, ordered by ascending priority and creation time. It does
not accept a brand or tractor filter. Therefore it must not be used when the
operator intends to process a particular brand/model pair.

v21.39 adds `process_queue_for_tractors`, which claims only rows belonging
to the explicit tractor IDs supplied in the request. The global queue actions
remain unchanged.

## Files in this branch

- `index-v21.39.ts` — complete Supabase Edge Function source.
- `sql-v21.39-targeted-queue-processing.sql` — database migration that creates
  the exact-ID, atomic, service-role-only queue claim RPC.

Branch: `tractor-ai-v21-39-targeted-queue-processing`

## Deployment

1. Replace the deployed Edge Function's complete `index.ts` with the complete
   contents of `index-v21.39.ts`; deploy the function. Keep the existing
   `SUPABASE_URL`, `DB_SECRET_KEY`, `GEMINI_API_KEY`, and
   `TC_QUEUE_SECRET` secrets configured.
2. Run the complete `sql-v21.39-targeted-queue-processing.sql` migration
   once in the Supabase SQL Editor. It is transactional and does not claim
   or modify any queue row.
3. Verify the SQL result: `service_role_can_execute = true`,
   `anon_can_execute = false`, and `authenticated_can_execute = false`.

## Exact Lamborghini S/V request

Use the Edge Function Test panel with the existing queue-secret header.
Do not use `process_queue_batch` for this targeted operation.

```json
{
  "action": "process_queue_for_tractors",
  "tractor_ids": [
    "f9a68e93-5534-40b7-891f-ba0249fe25db",
    "5139abf5-726b-4cc0-961a-e9f0277e0ead"
  ]
}
```

The order is intentional:

1. `f9a68e93-5534-40b7-891f-ba0249fe25db` — Spire S 80 Target, dedicated
   S table (printed PDF page 6).
2. `5139abf5-726b-4cc0-961a-e9f0277e0ead` — Spire V 80 Target, dedicated
   V table (printed PDF page 7).

The handler accepts 1–3 unique UUIDs. Each ID is validated and claimed through
`tc_claim_tractor_research_by_id(p_tractor_id)` using a row lock with
`SKIP LOCKED`. No other tractor ID can be returned for that request. If the
specified queue row is not eligible (not queued/retry and due, or not a stale
running row), that item returns a conflict and is not substituted with another
job.

## Existing unrelated jobs from the prior global batch

- Kioti HX Series returned HTTP 422 because the official site returned HTTP 403.
  Its queue is moved to `needs_source`; it is not a successful research run.
- Iseki TXGS24 returned HTTP 202 and run ID
  `834fd783-3bff-456e-97a1-fe69c8cab8d7`. The v21.37 queue handler stores an
  in-progress run as `retry` with that run ID for subsequent status polling.
  Do not start a duplicate TXGS24 run merely because the batch returned
  `research_status: in_progress`.

## Safety guarantees

- Existing global queue processing continues to use
  `tc_claim_next_tractor_research()`.
- Targeted processing uses only explicit tractor UUIDs.
- The exact-ID RPC is SECURITY DEFINER and executable only by
  `service_role`; public, anon and authenticated execution is revoked.
- Existing source/model identity checks and human-review requirements remain
  in place.
- `AUTO_APPROVE_VERIFIED_FINDINGS = false`; no research finding is
  automatically approved or published by this change.
