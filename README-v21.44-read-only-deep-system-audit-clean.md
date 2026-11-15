# TractorCompare AI v21.44 — consolidated read-only deep system audit

This is the clean, executable copy of the v21.44 diagnostic audit. Use this file:
`sql-v21.44-read-only-deep-system-audit-clean.sql`.

## Important safety notes

- The script starts a PostgreSQL `READ ONLY` transaction and ends it with one `COMMIT`.
- It performs no data writes or schema changes; it does not create tables, functions, triggers, indexes or policies.
- It does not approve findings, publish tractors, or change the research queue.
- It does not read secret values or dump function source code.
- It reads the known core tables: `brands`, `tractors`, `tractor_specs`, `data_sources`, `ai_research_runs`, `ai_research_documents`, `ai_research_findings`, and `tractor_research_queue`.
- It also inspects PostgreSQL catalogs for the full public schema, grants, RLS, constraints, functions, triggers and default privileges.

## How to run

1. Open Supabase SQL Editor.
2. Paste the complete contents of `sql-v21.44-read-only-deep-system-audit-clean.sql`.
3. Run it once.
4. Preserve all result sets together. Do not run repair statements based on one isolated row.

If the transaction fails because a required core table is missing or a permission is insufficient, stop and share the exact error instead of guessing column names or changing the script.

## What it checks

- Public-schema objects, every column, constraints, foreign keys and index validity/usage.
- RLS policies plus effective table/schema privileges for `anon`, `authenticated`, `service_role`, `postgres` and `supabase_admin`.
- Security-definer functions, effective EXECUTE exposure (including PUBLIC), triggers and trigger-function mode.
- Exact core-table counts, catalog status, duplicate/ambiguous model identities.
- Queue status, overdue retries, stale/nonterminal research runs and linked errors.
- Findings completeness, canonical taxonomy, reported confidence distribution, evidence/source/page mismatches, orphan relations and conflicting values for the same canonical field/scope.
- Current `tractor_specs` ownership, missing provenance, duplicate scopes and source lineage.
- Research document hashes, repeated URLs, repeated content across different URLs and source-host concentration. Identical hashes across URLs are potential mirrors, not separate votes.
- Data-source registry and future default privileges.

## Why we are doing this

The next repair release will be designed from the whole snapshot, not from isolated errors. It will coordinate the database migration, Edge Function research/verification logic, source consensus, AI-managed value updates, access policies, audit history, review UI/API and tests.

## Target AI decision policy (design only; this audit does not enable it)

The AI should be able to update **AI-managed** tractor specifications when evidence is strong, but should not silently overwrite human-managed records. The eventual decision engine must:

- match the exact model, year, variant, market, canonical field, unit and technical condition;
- group mirrored/reposted copies into one source family so they cannot manufacture a majority;
- weigh official manufacturer technical documents, homologation/regulatory evidence and genuinely independent corroboration;
- compare exact extracted values and context, not just an LLM's self-reported confidence;
- quarantine unresolved disagreements rather than choosing a convenient number;
- apply stricter thresholds to consequential fields (power, torque, mass, brakes, lift capacity, speed) than low-risk equipment flags;
- record previous and new values, source IDs, quoted evidence, page numbers, consensus calculation, decision-engine version and timestamps in an append-only history;
- provide tested rollback, idempotency and concurrency protection;
- keep human-managed values protected and keep public model publication as a separate control.

A model confidence score is not a calibrated probability. Any automatic-update threshold must be validated against manually reviewed examples before activation.

## Scope boundary

This SQL inspects the live database snapshot only when the user runs it. It cannot inspect the deployed Edge Function or website frontend by itself. Those current code artifacts must be included before calling the next implementation package complete.

## Static packaging checks

1 read-only transaction start, 1 transaction end, 33 top-level SELECT statements, 675 lines. The clean file contains one copy of each marked audit section.
