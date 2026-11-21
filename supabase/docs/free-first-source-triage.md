# TractorVS — Free-first manufacturer source triage (offline foundation)

This is a **zero-network, zero-LLM, zero-database-write** gate. It is **not** the full automated draft research worker. It exists to safely classify short technical excerpts extracted from a manufacturer document **before** anyone or any future authenticated worker considers a model-specific specification ready for editorial review.

## Safety invariant
- Only externally authenticated, trusted upstream collectors may supply a document, its original and final URLs, HTTP/content-type results, a **brand-reviewed** hostname allowlist, and a bounded technical excerpt.
- Source URLs must be HTTPS and match an explicitly approved host (or its subdomain). Arbitrary redirects, IP literals, localhost, credentials, non-standard ports, bad HTTP and unparsed PDF content are blocked. This local checker is **not** an HTTP client; the future fetcher must independently reject DNS rebinding, private-address redirects, oversized files and unapproved license/terms before retrieving any page.
- The **exact model name, field label, value and unit** must be present together in a bounded source block. Page title, navigation or a similar model name is not enough.
- Non-editorial variant names, market and known model year must appear in the evidence block, not merely be assumed. Power fields marked *rated* or *maximum* require an explicit measurement standard. Null year or "global" market is logged as unproven, never silently confirmed.
- Shared manufacturer pages are legitimate: one official Antonio Carraro page may contain a separate tab for a different model. A URL slug mismatch raises a warning, but never substitutes for verifying the **specific tab's values**.
- Even the best possible output is `review_candidate`, **not** `verified`, `approved` or `published`. Manual/contextual technical review and the existing Supabase evidence/publication gates remain mandatory.

## Usage — private environment only
A trusted internal collector may supply a bounded JSON array (maximum 1,000 records) through stdin:

```sh
node scripts/tractor-free-source-triage.mjs < /secure/private-manufacturer-evidence.json
```

STDOUT contains **aggregate counts only** (`records`, `unique_trusted_documents`, `outcomes`, warnings, and explicit zero publication/paid-call counters). Raw URLs, manufacturer names, specifications and excerpts are **not printed**. Never commit or upload the private JSON file to GitHub, its CI artifacts, an issue or a public report. Do not pass service-role keys to this script; it has no Supabase connection.

`groupFetches()` groups records by trusted document URL for a future bounded authenticated fetcher; it **does not collapse distinct model/year/market/variant/evidence records**. This avoids repeated downloads of one catalogue while preserving exact equipment identity.

## Tests and live status

`node --test scripts/tractor-free-source-triage.test.mjs` exercises more than 10 synthetic manufacturer evidence scenarios: shared document, exact model vs lookalike, navigation-only false positives, unit/value boundaries, variant/year/market, power measurement standard, PDF extraction, redirects, bad HTTP, private output, and source deduplication.

Current deployed research watchdog stays `dry_run=true` on scheduled runs. It is **not** a free-first research processor. No live Supabase tables, source evidence, technical specifications, or tractor publication state are changed by installing these files. A separate security-reviewed collector and private persistence integration will be needed for unattended operation. We should only enable that connection when a full review is performed and an independently proven, strictly limited cost/traffic budget exists.

**Related:** P0 research queue issue #147, targeted draft-claim protection PR #198, Golden Rule in `AGENTS.md`.
