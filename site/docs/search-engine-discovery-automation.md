# TractorVS — Search discovery automation and evidence runbook

This runbook is part of the permanent AGENTS.md integration rules.

## Current design (21 November 2026)

- Canonical site: `https://tractorvs.com`; the production sitemap remains `/sitemap-index.xml`. **One root index is the sole future submission entrypoint** for Google/Bing and includes `/sitemap-N.xml` HTML pages, `/forum-sitemap.xml` and `/image-sitemap.xml` via Astro's native `customSitemaps` option. This is separate from the already-existing successful individual submissions in Webmaster dashboards.
- Astro generates its default XML sitemap and only permanent, indexable routes.
- Standalone `/forum-sitemap.xml` includes only moderated SEO-ready topics and `/image-sitemap.xml` includes licensed/trusted eligible imagery.
- `robots.txt` lists all three; do **not** spam obsolete Google sitemap ping endpoints.
- Tractors: the public-catalog sync checks the anonymous published RLS view every 30 minutes on a best-effort GitHub Actions schedule.
- Forum: a separate safe published-content sync checks every 10 minutes; no privately visible or draft content is syndicated.
- A changed Git snapshot *requests* Cloudflare Workers Builds to publish a new static version. GitHub merge/build alone is not proof of a deployed website.

## Single-submission sitemap integrity: deployment and monitoring

- **Permanent AGENTS.md rule:** every new published sitemap type must be registered in `site/astro.config.mjs` `customSitemaps` AND included in the built `sitemap-index.xml`. Do not invent a new root index or submit each map separately on each release.
- `site/scripts/verify-unified-sitemap-index.mjs` checks **actual Astro output** (including every generated `sitemap-N.xml` child), forum and image child files, robots declarations and every locale's catalog entry. This runs in both site-build indexable CI and the Cloudflare production release gate; a missing child blocks production.
- `scripts/tractor-bing-sitemap-coverage.mjs` and its regression suite inspect the **live** root index and all children before the existing IndexNow discovery worker proceeds. Image sitemap page references overlap HTML URLs and must not inflate unique page counts; moderated forum pages are distinct and may be absent when no approved topic exists.
- Old `/sitemap.xml` redirects to `/sitemap-index.xml`. Leave existing Google/Bing verified sitemap submissions unchanged; the index link automatically exposes all public sitemap types after the new Cloudflare deployment. A `success` status or a `discovered` count is not the number of indexed pages.
- The index **must never** expose hidden or moderation-pending forum content, unverified translations, unpublished tractor drafts or unlicensed imagery. Ten-language site coverage is a published-only gate.
- To verify a release: inspect actual `https://tractorvs.com/sitemap-index.xml` and expect child URLs for generated HTML sitemap(s), `forum-sitemap.xml` and `image-sitemap.xml`; confirm each child HTTP 200, valid `urlset`, self canonical for sampled HTML pages and the relevant GSC/Bing crawl observations independently.

## Automatic IndexNow — fail-closed

Workflow: `.github/workflows/tractorvs-search-discovery.yml`.
Script: `scripts/tractor-search-discovery.mjs`.

- The workflow inspects the **LIVE** sitemap index, its child sitemap files, robots policy and IndexNow root key.
- Initial run creates a baseline of the already-published URLs without sending all historical pages.
- Subsequent runs compare new URLs or trusted `lastmod` changes against the last successful checkpoint.
- Every changed page must return 200 (without redirect), correct canonical and no `noindex` before notification.
- At most 60 changed pages are validated/sent per run; the rest remain pending.
- Submit to `https://api.indexnow.org/indexnow`, one batch, only after all validations succeed; accept 200 or 202, record 202 as pending verification, never as guaranteed indexing.
- The checkpoint is retained in GitHub Actions cache only after success; API failures do not mark URL delivery successful.
- Manual workflow runs default to **dry run**; no submission/commit.
- Removed pages are intentionally not submitted as 404/410 until an independently audited unpublication path exists.
- Google does **not** use IndexNow; it discovers URLs using sitemap and links.

## Sitemap lastmod provenance — no artificial freshness

Workflow: `.github/workflows/tractorvs-sitemap-history.yml`.
Script: `scripts/tractor-sitemap-history.mjs`.
Source files: `seo/sitemap-content-history.json` and `site/src/data/sitemap-lastmod.json`.

- On first successful production build, hash every actual sitemap page's rendered `<main>`, page title and meta description. **Do not invent any historical lastmod** dates.
- On a later build, timestamp only genuinely new pages or pages with a materially different content hash; keep all unchanged dates stable.
- The Astro sitemap `serialize` function only inserts dates from this vetted map.
- Reject missing pages, incorrect canonical, accidental `noindex`, duplicate/noncanonical URLs, unexplained mass disappearance and implausible bulk changes.
- Repository checkpoints are committed only after production build gates and a second verification build.
- Dates are observations of verified content change, not arbitrary build timestamps, and never proof of external indexing.

## Weekly evidence and real indexing

Every Monday, the IndexNow workflow records a machine-readable JSON artifact retained for 30 days and writes a GitHub Actions summary; 2-hour checks also write summaries.

**Distinct evidence levels:**
1. Published URL listed in sitemap (observable locally).
2. URL returns 200/canonical/indexable (verified from public website).
3. IndexNow endpoint acknowledged a notification (200/202; **not** proof of crawl).
4. Search engine crawled URL (requires platform crawler logs or Webmaster reports).
5. Search engine indexed URL (requires Search Console/Webmaster report; never inferred from 1–3).

Our connected Google Search Console, Bing Webmaster, Yandex Webmaster and Naver Search Advisor accounts might provide more metrics during a ChatGPT or human review. The GitHub workflow cannot truthfully calculate their indexed counts without authorized API access. Mark those columns **unavailable** rather than guessing.

## Operations and rollback

- Check GitHub Actions for the two workflows and `TractorVS live website SEO smoke test` before announcing success.
- Confirm latest Cloudflare production deployment **separately** from GitHub PR checks.
- Validate `https://tractorvs.com/robots.txt`, sitemap index, at least one child sitemap, public `lastmod` entries, and root IndexNow key.
- If a run fails, do not bypass canonical/RLS, replay thousands of URLs, or use paid services to mask a failing gate.
- Revert the smallest PR for rollback. Never disable preview `noindex`, forum moderation, analytics consent, or the existing SEO release gates to force an SEO outcome.
