# Staged automatic release readiness — 2026-11-26

Repository auto-merge was enabled by its owner. No ruleset is activated by this PR. The initial narrow UI release readiness status is produced by a trusted base-only workflow; it never checks out or executes PR code, never merges or deploys, and cannot publish database, photo, forum, security or workflow changes. It checks exact current SHA, source app, main ancestry, all four browser jobs, CodeQL, preview and build. Unexpected skips, missing checks, conflicts, API errors or changed head cannot yield approval. A successful readiness status is not authorization.

## Activation blockers
- The sitemap lastmod ledger pushes directly to main in .github/workflows/tractorvs-sitemap-history.yml.
- Catalog and forum public revision sync use direct GitHub Contents API writes in scripts/tractor-publication-autosync.mjs and scripts/tractor-forum-publication-autosync.mjs.
- Existing workflows have path filters; requiring every named job globally would block unrelated legitimate PRs. PRs created by GITHUB_TOKEN also have restricted downstream event triggering; do not replace the writers with untested PR creation.
- Migrate and validate each writer with existing permissions and tested release triggering, or retain disabled ruleset. Do not add a blanket bypass, widen credentials, or disable required checks.
- Before making the status mandatory, confirm applicable policy for every PR category, direct-write migration, branch protection availability on repository plan, trusted-source status selection, strict main freshness, no bypass, and exercise real positive/negative cases. This is a staging step only. Native auto-merge must be enabled per explicitly authorized PR after rules are enforced. Cloudflare Git integration deploys after merge; production verification remains separate.
