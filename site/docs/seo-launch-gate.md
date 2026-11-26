# TractorVS SEO release gate (2026-11-18)

Indexing is enabled only when a trusted production build explicitly sets **PUBLIC_INDEXING_ENABLED=true** and **SITE_URL**. A local or incomplete build remains noindexed by default.

## Build-time facts

- Astro statically generates one URL per published model and locale.
- The public Supabase view provides only `status = published` tractors.
- The stable slug includes a UUID prefix and is not derived solely from model name.
- Technical facts preserve model variant, market, unit, rated RPM and source.
- JSON-LD uses `Thing`, `WebPage` and `BreadcrumbList`; `ImageObject` is added only for approved photographs with rights attribution. No invented offers, prices, aggregate ratings or reviews.
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

Website SEO changes are isolated to `site/`; undo a specific change by reverting its Git commit, rerunning checks and redeploying. The SQL index is a separate optional deployment: if already applied, drop only the dedicated index as a reviewed DDL operation. Do not run data-cleaning UPDATE/DELETE for identity conflicts without an evidence-based review.

## Permanent Search Console regression protocol — 26 November 2026

Apply to every release, not only SEO PRs. Keep an evidence-linked queue in #196 and #404; image rights in #338, HTTPS/WWW in #181. Do not publish private Search Console exports or analytics numbers to the public repository.

| Observed report class | Prevention and acceptance |
| --- | --- |
| Crawled / discovered, currently not indexed | All intended pages must be real canonical HTML, internally reachable, substantive, source-backed and appropriately localized. Full static sitemap discovery graph blocks disconnected pages; existing daily/weekly live crawl and GSC URL Inspection distinguish technical regressions from Google's selection/delay. Do not promise indexing. |
| Excluded by noindex | Block robots/googlebot noindex or none on submitted HTML before deploy, and restrictive X-Robots-Tag in the live audit. Retain noindex for private, unapproved, preview and other deliberately excluded routes; never remove it in bulk. |
| Alternate page with proper canonical / page with redirect | Only final canonical HTTPS pages belong in page sitemaps; verify actual HTTP status and canonical, redirect destination and path/locale preservation via existing live checks. Expected aliases are not errors. Meta refresh on submitted HTML blocks deployment. |
| Wrong/missing canonical, locale, sitemap membership | Full built HTML check parses actual head; exactly one self-canonical, reciprocal hreflang only for existing published locale destinations, correct HTML lang and x-default. Reuse typed sitemap inventory; image references are not extra HTML pages. |
| Historical product rich-result warnings (offers/review/aggregateRating) | Noncommercial model catalogue remains Thing/WebPage/BreadcrumbList, no false commercial/rating metadata. Preserve existing JSON-LD production audit and tests. |
| ImageObject acquireLicensePage / copyrightNotice | Preserve verified real license/source/credit/owner gates. Unknown owner or CC0 must never receive fabricated copyrightNotice. Missing optional fields are not necessarily invalid rich results. |
| Title/meta advisories, duplicate language metadata | Preserve technical identity and genuine localization; run existing full-build metadata checks. Length guidance is not a hard indexing requirement. |
| HTTP/WWW, 404/soft 404, 5xx, mobile, lastmod | Preserve existing HTTP normalization, real status and content checks, Cloudflare served-release proof, asset integrity, mobile/accessibility and evidence-based lastmod. New observed issues require targeted reproduction and negative regression tests. |

Release sequence: exact latest head CI, CodeQL and applicable Cloudflare preview; check current main compatibility; merge; confirm trusted Cloudflare production revision and actual public responses; full sitemap/HTML audit on the served revision. Weekly full and daily rotating audit are existing workflows; do not create redundant jobs. Use the owner-only on-demand audit only after verified activation (#747/#748). Compare GSC report dates and indexed eligible URL cohorts over time; request exact affected URL examples where available, inspect in batches, distinguish expected exclusions, and use Search Console validation only after confirmed fixes. Record new/recurring issue classes and add a test at the earliest appropriate release boundary. A green build or sitemap submission is not evidence that Google indexed a page.

Official references: https://developers.google.com/search/help/crawling-index-faq ; https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls ; https://developers.google.com/search/docs/crawling-indexing/block-indexing ; https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata ; https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors .

### Additional coverage regressions — 26 November 2026

Check both directions of static inventory: submitted pages must be indexable canonical HTML; generated directory-format pages not submitted need explicit noindex or a verified canonical to a submitted target. Do not automatically publish exclusions. Shared live head inspection ignores inert markup, checks Googlebot-specific noindex/none and meta refresh; full live audit rejects non-HTML responses. Compare applicable Googlebot robots rules against all canonical sitemap paths in static and live audits. The matcher is scoped to the project's ASCII query-free paths, not a general search engine simulator. Exact reported URL examples are needed to classify each historical Search Console exclusion; current crawl evidence cannot establish historical causes or guarantee indexing. Keep existing release gates, privacy, locale and moderation boundaries; never bulk-remove valid exclusions or submit aliases, filters or preview URLs. No private Search Console metrics or exports are committed.

### Visitor-state URL discovery and rendering resources — 26 November 2026

Comparison selections, forum preselection, brand search and language preference actions are useful user state, not independent indexable content. Preserve existing deep links, sharing, redirects and clean canonical pages; mark generated utility links nofollow (a crawl hint, not a blocking guarantee). Do not automatically turn a clean comparison entry into a parameterized URL on first load. Keep canonical locale links followable when no visitor state is present. The live SEO audit now reads one real SSR model ID per language and checks the corresponding comparison JSON for HTTP 200, JSON MIME/array and actual X-Robots-Tag noindex; do not robots-disallow rendering resources or index them as HTML. Historical coverage rows may remain until Google recrawls. Private exports and counts stay outside the public repo.
