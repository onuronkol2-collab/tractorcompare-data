# TractorVS: faster, evidence-first batch publication (20 November 2026)

## Current production checkpoint
After reviewing the existing public data and releasing STEYR 6360/6390/6440 CERVUS CVT (manufacturer brochure, 10/2025), the live database showed **108 published / 352 draft / 2 archived**. Three CERVUS models now have 38 sourced/dated specifications each, exposed in the existing public view. The 6440 brochure has a **cylinder-count contradiction** between the table and producer narrative; no cylinder-count row is asserted for the 6440, and the ambiguity is attached to the displacement metadata.

The complete catalogue remains static Astro with ten locales. **SQL status updates do not themselves deploy new HTML or sitemaps.** Separate Cloudflare production verification remains necessary.

## Four work lanes — not an indiscriminate 352-row publication

1. **Source-family quick wins**: Group drafts by exact official URL, document publication date, model, country/market, variant and engine/gross/net/PTO measurement scope. Download each producer PDF only once per run, compare its distinct model columns and publish only exact validated UUIDs. Use the private, READ-ONLY `supabase/verification/20261120_bulk_source_family_triage.sql` to prioritize source families (do not upload draft results publicly).
2. **Partial evidence, independent tests**: Separate confirmed fields from unverified or market-mismatched values. For a model with a reliable evidence-backed core, offer an explicit reviewed release while keeping unsupported fields marked as unverified. Before a broad rollout, the team must test an evidence-only public-view transition against the 115 existing published specs without verification dates and 29 without excerpts. The current site already labels those fields as `not_verified`; do NOT blindly change the shared SQL view and silently break published pages.
3. **Catalogue/series records**: A page called `Kioti HX Series`, `McCormick X5`, or `Belarus 80.1/82.1` is not necessarily one exact tractor. Classify them separately, expand into distinct source-backed model identities when justified and never duplicate raw specs across incompatible markets or trims.
4. **Images and static pages in parallel**: The photo-candidate queue is separate from tractor-spec verification. Copyright/reuse license + photographer + exact pictured model remain mandatory. Missing photos do not block a technically verified model page. Public model releases trigger the free GitHub-based static refresh monitor; actual Cloudflare deploy and Google indexing must still be checked independently.

## Free public catalog auto-sync

`.github/workflows/tractorvs-publication-autosync.yml` runs at UTC **:17 and :47** (GitHub cron timing is best-effort; not a guarantee). A PR only runs unit tests. On main, the workflow:

- Uses only the existing **legacy anon JWT** (`TRACTORVS_SUPABASE_ANON_JWT`) to read `tractorvs_public_specs`. No service-role key, Gemini, TinyFish, Edge secret, or unpublished draft tables.
- Pages through all public rows, refusing to hash an incomplete, inconsistent, empty, or unexpectedly large result, and calculates SHA-256 over publication content including spec value, verification and source.
- Compares against a small public `site/src/data/public-catalog-sync.json` marker. If identical, no write or rebuild is requested. If different, a GitHub token scoped to **contents: write** commits just the public fingerprint and counts to `main`, causing the existing Cloudflare Git-connected build to be requested.
- The new `site/src/data` marker is innocuous build input and includes only public `published_models`, `public_rows`, SHA, generated timestamp. It contains no draft identities, secret or full producer text.
- Errors from Supabase, incomplete page ranges, missing/wrong JWT role, GitHub denied write or change during pagination **stop safely**. Logs do not print keys. Manual dispatch defaults to `dry_run=true`.
- A successful GitHub commit means **a rebuild request**, not proof of Cloudflare delivery, page indexing or Webmaster/Search Console coverage. GitHub workflows triggered by commits made using `GITHUB_TOKEN` may not invoke other GitHub Actions workflows; confirm Cloudflare's own Git integration independently.

A signed-in owner can open GitHub Actions > `TractorVS zero-paid published catalog sync` and choose `dry_run=true` to verify without modifying anything; do not include your JWT in logs or support conversations. If an existing repository token cannot write to main due to protection rules, the step will fail closed. Resolve the repo policy rather than bypassing it or adding admin/service-role secrets.

## Faster execution with fewer costs

Daily and hourly source work should prioritize the **existing 352 drafts and documented source families**, not generate more speculative draft rows. Once the official document is inspected, several models sharing it may be validated within one transaction after a per-UUID source and contradiction gate. Keep the hourly ChatGPT task enabled and checkpoint after each document family; it cannot run continuously like a daemon. The free GitHub cron only checks whether public pages must rebuild, it **does not invent model values or auto-approve** unverifiable evidence. User authorization to publish verified facts does not relax licensing, source integrity or RLS.
