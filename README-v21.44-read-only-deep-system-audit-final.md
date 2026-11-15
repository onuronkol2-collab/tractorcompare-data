# TractorCompare AI v21.44 — final read-only deep system audit

**Use this file:** `sql-v21.44-read-only-deep-system-audit-final.sql`

## Safety and execution

- Begins one PostgreSQL `READ ONLY` transaction and commits it once.
- Does not insert, update, delete, approve or publish any data.
- Does not create or alter schema objects, policies, indexes, functions or triggers.
- Does not output secret values or full function bodies.
- Inspects the known core tables and PostgreSQL catalogs.
- Run once in Supabase SQL Editor and preserve every result set together.

If any known core table is absent or permissions prevent a catalog read, stop and share the exact error. Do not guess column names or make a write query to work around it.

## Areas covered

1. Public-schema tables/views/sequences, RLS and full column inventory.
2. Primary/foreign/unique/check constraints and index definition, uniqueness, validity, readiness and usage.
3. RLS policies; effective table and schema privileges for `anon`, `authenticated`, `service_role`, `postgres`, `supabase_admin`.
4. Security-definer functions/RPCs, pinned search path signals, EXECUTE privileges (including PUBLIC), triggers and trigger functions. Function bodies are not exposed.
5. Core-table counts, catalog publication/market state and duplicate model identities.
6. Queue health, due/overdue entries, linked run state, stale/error research runs.
7. Finding counts, canonical taxonomy, reported confidence metadata, document/source/page/evidence mismatches, duplicate fingerprints and conflicting values for the same canonical field/scope.
8. AI-managed versus human-managed `tractor_specs`, evidence/source provenance, duplicate canonical scopes and orphan lineage.
9. Research document hashes, repeated URLs, identical hashes across distinct URLs, source-host concentration and source registry.
10. PostgreSQL default privileges.

## Planned unified remediation — not activated by this audit

The next implementation package will be based on the entire output and the actual deployed source code. The AI is intended to be an active technical decision-maker, not just a suggestion generator. It may update **AI-managed** specifications only under a validated evidence policy; human-managed values remain protected.

The decision engine must consider exact model/year/variant/market identity, canonical key, unit, measurement conditions and package scope. It must de-duplicate mirrored copies and count genuinely independent source families rather than URLs. It should weigh model-specific manufacturer specifications and regulatory/homologation documents highest, use independent corroboration, quarantine unresolved contradictions, and use stricter thresholds for consequential measurements.

Every update must preserve the old value, new value, source IDs, quoted evidence and printed page, consensus result, decision version and timestamps in append-only history, with idempotency, concurrency controls and tested rollback. Human publication control remains a separate gate. An LLM confidence value alone is not proof and must be checked against manually reviewed cases.

This audit only inspects the live database when you run it. It does not inspect the deployed Edge Function or frontend source; those must be examined before the unified implementation can be finalized.