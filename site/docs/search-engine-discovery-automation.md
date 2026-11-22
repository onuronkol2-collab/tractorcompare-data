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

## Daily versus weekly full production SEO crawler (21 November 2026)

- This crawler is independent of the hourly IndexNow discovery worker. The production sitemap root must list `sitemap-N.xml` (all published canonical HTML pages), `forum-sitemap.xml` (only approved forum hubs and articles), and `image-sitemap.xml` (image references tied to eligible HTML/forum URLs).
- `site/scripts/production-sitemap-inventory.mjs` classifies the three XML content types. **Image references may overlap** HTML pages or approved forum topic pages. This is normal and must not be mistaken for duplicate crawlable URLs; duplicates *inside* one sitemap or orphans outside both canonical page sets are blocked.
- `.github/workflows/live-website-audit.yml` runs daily (06:00 UTC) with a **rotating 20 model URLs per locale + every non-model page**, while validating the **entire** sitemap index/child coverage and 10-language model slug parity. It runs weekly Sunday (07:00 UTC) in **full** mode, reading and checking every distinct HTML or approved forum page's status, canonical, hreflang, HTML language, visible content and JSON-LD. Both modes fail on missing pages, rate limiting and invalid XML; the daily sample is not evidence that every URL was fetched successfully that day.
- Daily rotation is deterministic and model-slug sorted, so the full cohort is covered by subsequent daily samples independently of weekly checks. `site/tests/production-sitemap-inventory.test.mjs` proves source subtype separation, index requirements, rejected hidden forum/offsite pages, ten-language parity and rotating sampling.
- **Do not equate:** master index children, image references, unique canonical URLs, sampled HTTP successes, IndexNow accepted, Google-discovered URLs or Google-indexed URLs. They are distinct measurements. A full sitemap has no direct bearing on guaranteed search rankings.
- Avoid writing user credentials, provider API keys or new screenshots to public CI artifacts; never trigger paid AI translation or mass URL submission from this SEO crawler.

## Licensed image and approved forum media health (21 November 2026)

- The separate free `image-seo-live-audit.yml` checks live JPEG assets, photo rights/attribution metadata, and the standalone image XML under the single root sitemap. Its image reference validation reuses the already-published HTML/forum URL inventory: duplicates of the same licensed tractor photograph across ten languages count as one asset, not ten broken images.
- Public tractor JPG files must be served at `/images/tractors/<identity>-960.jpg` and `-1920.jpg` with valid JPEG media type/magic bytes. Approved forum media may be a JPEG/PNG/WEBP on the project's documented `/functions/v1/forum-media?id=<uuid>` gateway **only when its forum topic page is on the moderated sitemap**; all other remote image origins or hidden/unapproved forum pages are rejected.
- Brief Cloudflare 500/502/503/504 responses are retried at most five times with bounded increasing delays; a persistent 5xx, rate-limited 429, missing 404 or corrupt image is reported as failure. Do not evade limits through another host. The verifier remains credential-free and read-only.
- Checking a public endpoint's binary magic bytes is **not evidence of copyright clearance**; the separate author/Commons license and model identity checks stay mandatory. The weekly report should distinguish network health, actual photo coverage, Google image discovery and image indexing.

## Automatic IndexNow — fail-closed (22 November 2026 checked against live API, official protocol)

Workflow: `.github/workflows/tractorvs-search-discovery.yml`.
Script: `scripts/tractor-search-discovery.mjs`.

- The workflow inspects the **LIVE** sitemap index, its child sitemap files, robots policy and IndexNow root key.
- Initial run creates a baseline of the already-published URLs without sending all historical pages.
- Subsequent runs compare new URLs or trusted `lastmod` changes against the last successful checkpoint.
- Every changed page must return 200 (without redirect), correct canonical and no `noindex` before notification.
- At most **120 genuinely new or content-modified public pages** are verified and submitted per hourly run (`31 * * * *`, UTC); the remaining queue persists across runs. This is a safe, bounded throughput improvement over the former 60 pages every two hours; no historic unchanged sitemap bulk ping or shortcut around canonical, noindex and ownership checks.
- Submit a validated batch to the shared `https://api.indexnow.org/indexnow` endpoint. It distributes a successful protocol notification to participating engines (including Bing, Yandex, Naver and Seznam). **Do not post individually to all engines.** If the primary returns transient 5xx or a network error, try one alternative official endpoint at a time (`www.bing.com/indexnow`, `yandex.com/indexnow`, `searchadvisor.naver.com/indexnow`), stopping at the first 200 or 202. Never bypass 4xx ownership failures, invalid payloads or 429 throttling. All failures leave the changed URLs pending.
- A 200 means IndexNow accepted the request, 202 is provisional pending key validation. Neither status proves delivery, crawl or indexing by each individual engine. The report records the actual endpoint used, not invented search-index counts.
- The checkpoint is retained in GitHub Actions cache only after an acknowledged shared API response and successful live validation. HTTP 202 is recorded separately as **provisional receipt, pending key verification**; it never proves engine-specific acceptance. HTTP 400/403/422/429 and all failed fallback attempts fail closed without advancing or losing queued changes. An explicit JSON failure report is retained even when the main job fails. The hourly workflow also archives its small status/coverage evidence for seven days; the weekly evidence remains separate.
- Manual workflow runs default to **dry run**; no submission/commit.
- Removed pages are intentionally not submitted as 404/410 until an independently audited unpublication path exists.
- Google does **not** use IndexNow. Its sitemap is regenerated on published production builds and exposed through `robots.txt` and the previously submitted root index. Google periodically revisits submitted sitemaps; **do not** use deprecated Google ping URLs or claim immediate Google indexing.
- Yandex, Bing and Naver each can discover the root sitemap through their webmaster dashboards/robots declarations. The IndexNow shared notification is a separate **URL-change hint**, not a repeated sitemap registration. Yandex's sitemap-registration API requires authorized Yandex OAuth access and is unnecessary on each new publish. Naver's specialized crawl-request API is for approved partners and requires separate authorization; a verified Search Advisor site alone does not grant it. Never invent partner tokens or submit unauthenticated API requests.
- Baidu is not an IndexNow participant according to the reviewed public participant roster. Without a verified Baidu Webmaster account/API credentials, do not claim automatic Baidu submission.
- In every engine onboarding conversation show all current live sitemap links; recommend the one complete index when supported, then explain if/when an engine needs individual child submissions. Never erase already-valid submissions.

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

Every Monday, the IndexNow workflow records a machine-readable JSON artifact retained for 30 days and writes a GitHub Actions summary; hourly checks also write summaries.

**Distinct evidence levels:**
1. Published URL listed in sitemap (observable locally).
2. URL returns 200/canonical/indexable (verified from public website).
3. One IndexNow endpoint acknowledged a shared notification (200/202; **not** proof of independent receipts, crawling, or indexing for each engine).
4. Search engine crawled URL (requires platform crawler logs or Webmaster reports).
5. Search engine indexed URL (requires Search Console/Webmaster report; never inferred from 1–3).

Our connected Google Search Console, Bing Webmaster, Yandex Webmaster and Naver Search Advisor accounts might provide more metrics during a ChatGPT or human review. The GitHub workflow cannot truthfully calculate their indexed counts without authorized API access. Mark those columns **unavailable** rather than guessing.

## Operations and rollback

- Check GitHub Actions for the two workflows and `TractorVS live website SEO smoke test` before announcing success.
- Confirm latest Cloudflare production deployment **separately** from GitHub PR checks.
- Validate `https://tractorvs.com/robots.txt`, sitemap index, at least one child sitemap, public `lastmod` entries, and root IndexNow key.
- If a run fails, do not bypass canonical/RLS, replay thousands of URLs, or use paid services to mask a failing gate.
- Revert the smallest PR for rollback. Never disable preview `noindex`, forum moderation, analytics consent, or the existing SEO release gates to force an SEO outcome.
