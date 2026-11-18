# TractorVS live site smoke test

Run `TractorVS live website SEO smoke test` manually in GitHub Actions or
create/update a PR that changes `site/scripts/live-website-audit.mjs`.

The script only requests publicly reachable pages at
`https://tractorvs-site.onuronkol2.workers.dev` (no credentials).

It logs HTTP status, robots header/meta, canonical, hreflang count, JSON-LD count
and catalogue link visibility. This is a smoke test, not a Google Search Console
indexing assertion or performance benchmark. An intentionally noindexed preview
is expected. A custom production domain, when created, requires a separate
indexability, mobile Lighthouse and Search Console review.

The script never changes live data or production deployment settings.
