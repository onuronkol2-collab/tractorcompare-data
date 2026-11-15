# TractorCompare AI v21.44 — Read-only deep system audit

## Why this comes before the next repair bundle

The project has reached the point where isolated SQL patches are no longer the right workflow. Before changing the AI research/approval system, the schema, security configuration, source provenance, queue, current AI-managed values, canonical taxonomy and web-facing access must be inspected together.

This migration is an **audit only**. It is intentionally not a repair migration.

## Safety contract

- Starts a PostgreSQL `READ ONLY` transaction.
- Does not insert/update/delete data.
- Does not create or alter tables, functions, triggers, indexes, or policies.
- Does not approve findings, publish tractors, or change research queues.
- Does not read or output secret values or full function bodies.
- Uses the known TractorCompare core tables: `brands`, `tractors`, `tractor_specs`, `data_sources`, `ai_research_runs`, `ai_research_documents`, `ai_research_findings`, `tractor_research_queue`.

## How to run

1. Open Supabase SQL Editor.
2. Paste the complete `sql-v21.44-read-only-deep-system-audit.sql` contents.
3. Run it once.
4. Preserve the individual result sets and share/export them together. Do not run a separate write query to fix anything based on an isolated result.

If the transaction fails because one of the known core tables is missing or a permission is insufficient, stop and share the exact error. Do not modify the script to guess at the schema.

## Result sets

The audit returns:
1. Database context (no credentials).
2. Public-schema objects and RLS flags.
3. Full column inventory.
4. Constraints and foreign keys.
5. Indexes and index statistics.
6. RLS policies.
7. Effective table grants for `anon`, `authenticated`, `service_role`, `postgres`, and `supabase_admin`.
8. Function/RPC security metadata and effective EXECUTE roles (not function bodies).
9. Triggers and trigger-function security mode.
10. Exact counts for the eight core tables.
11. Tractor catalog status/market summary.
12. Duplicate or ambiguous tractor identities.
13. Queue health and nonterminal/overdue rows.
14. Research run statuses/errors.
15. AI finding counts by run/model/status/class and missing evidence indicators.
16. Findings with document/source/page/evidence integrity problems.
17. Duplicate finding fingerprints (candidates only; not deletion instructions).
18. Current `tractor_specs` ownership/provenance and duplicate-scope candidates.
19. Research document/source provenance and repeated source rows.
20. Registered data-source distribution and PostgreSQL default privileges.

## How the results will be used

The next code package will be designed only after reviewing this complete snapshot. It is intended to combine the required database migration, Edge Function changes, deterministic validation, AI evidence consensus, review UI/API contract, permissions and tests as one coordinated release.

### Intended AI authority model (design target; not activated by this audit)

The AI should have meaningful authority over **AI-managed** technical fields. It must not silently overwrite human-managed fields. Before any automatic AI update is enabled, we will implement:

- exact tractor identity, model year, variant and market matching;
- canonical key, unit, operating condition and package/option scope matching;
- source-family deduplication so copies of the same manufacturer source do not count as independent votes;
- weighted evidence consensus rather than trusting the model's self-reported confidence alone;
- conflict quarantine when high-quality sources disagree;
- per-field risk thresholds (e.g. engine power, torque, braking and lifting capacity stricter than low-risk options);
- append-only before/after history, source/evidence references, decision version and a tested rollback route;
- concurrency protection and idempotency;
- a separate human-controlled model publication workflow.

A model's own confidence score is not a calibrated probability. Thresholds must be tested against manually adjudicated examples before automatic updates are activated.

## Boundaries

This file cannot inspect the live Edge Function deployment or browser frontend. The deployed Edge Function source and frontend repository/build output must be inspected as part of the same final review before an implementation package is called complete.