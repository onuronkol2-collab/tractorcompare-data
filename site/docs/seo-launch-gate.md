# TractorVS SEO release gate (2026-11-18)

The repository intentionally keeps **PUBLIC_INDEXING_ENABLED=false** until
a production domain, translations and model pages have been checked.

## Build-time facts

- Astro statically generates one URL per published model and locale.
- The public Supabase view provides only `status = published` tractors.
- The stable slug includes a UUID prefix and is not derived solely from model name.
- Technical facts preserve model variant, market, unit, rated RPM and source.
- JSON-LD uses `Vehicle`, `WebPage` and `BreadcrumbList`; it does not invent offers, price, images, aggregate ratings or reviews.
- `SITE_URL` is needed for canonical URL, reciprocal hreflang and sitemap.
- The existing 10-language locale structure must remain intact.

## Before enabling indexing

1. Verify a final production domain and set `SITE_URL=https://<final-domain>`.
2. Set both `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` **only** as build variables. Never use a service-role key.
3. Audit public-view RLS and published model counts. Check that all routes rendered in HTML contain their specifications; the site is pre-rendered.
4. Inspect several variants and markets, including Belarus 80.1 and 82.1, McCormick X5.100/110/120, Landini 5-085/100/110/120.
5. Review native-language content in all 10 locales. Do not index untranslated or near-duplicate pages solely because a translated menu exists.
6. With an approved domain and content, enable `PUBLIC_INDEXING_ENABLED=true`, rebuild and check each model's canonical and reciprocal hreflang tags.
7. Verify `/robots.txt` and `/sitemap-index.xml`; submit the sitemap in Search Console, then inspect several URLs and check rendered HTML and indexing status.
8. Benchmark mobile Lighthouse/Core Web Vitals and investigate real-user performance. Caching `/_astro/*` improves repeat visits but does not by itself guarantee a score.
9. Do not edit the current public catalogue's RLS or bulk-publish draft models as part of the SEO release.
10. For further bulk additions, run `supabase/verification/20261118_tractorvs_duplicate_identity_audit.sql`, and only if no duplicates exist, apply the reviewed `20261118_tractorvs_duplicate_identity_guard.sql`.

## Rollback boundaries

Both SEO patches are additive and isolated to `site/`; undo by reverting their Git commits and redeploying. The SQL index is a separate optional deployment: if already applied, drop only the dedicated index as a reviewed DDL operation. Do not run data-cleaning UPDATE/DELETE for identity conflicts without an evidence-based review.
