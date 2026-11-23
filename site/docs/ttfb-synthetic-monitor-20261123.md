# TractorVS: slow TTFB investigation and regression prevention (23 Nov 2026)

## Evidence and limitations

A screenshot of an SEO crawl shows 1,819 samples across first-byte buckets: 1,298 above 500 ms (71.4%), 274 at 300–500 ms, 163 at 200–300 ms and 84 below 200 ms. The crawl's location, protocol, date, cache state and full URL list are not yet available. Treat this as a real crawler-specific signal, not proof that 71.4% of actual visitors suffer slow TTFB.

The existing independent live mobile Lighthouse run [45119323039](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45119323039) reports server-response-time of ~97 ms on Turkish catalog and ~236 ms on Turkish home. These server-response measurements omit some DNS, connection and redirects, and do not refute the crawler's separate observation.

The site is Astro statically built on Cloudflare Workers Static Assets. Existing run_worker_first is selective, and most indexable HTML routes are served as static assets, without an on-demand Supabase call. Cloudflare automatically caches these static assets per deployed version. Blanket Cache Everything, unbounded HTML TTLs, artificial Server-Timing claims or removing the approved image Worker route without additional evidence could break SEO, consent, licensing or version rollout.

## Concrete prevention delivered

- Daily lightweight GitHub Actions monitor, plus manual run and offline pull-request test. No extra paid service and no secrets.
- Three GET requests per public fixed URL; time until HTTP response headers from one GitHub runner. Record HTTP status, MIME, CF-Cache-Status, Age, and only the CF-Ray location suffix, not IPs/cookies/visitor data. Requests do not follow redirects or download the body.
- Covers root Worker path, published home/catalog pages across ten languages, published model page, compare, advisor, forum, articles, sitemap and robots.
- Per-route and per-class p50/p75/p95, slow bucket shares, and 200/MIME failures. Synthetic warning threshold over p75 800 ms or 50% of sampled successes at least 500 ms, reported without claiming global user impact. A route that fails all three attempts with HTTP/MIME problems fails the scheduled job. Also, if at least 12 routes were inspected and 60% of their per-route medians remain ≥500 ms across three readings (with at least two successful readings per route), the workflow fails with a severe synthetic slowdown alert. This identifies a sustained problem in the runner's region, NOT a confirmed global user or Ahrefs regression.
- Summary in GitHub Actions and a 14-day downloadable JSON artifact for incident comparisons. No automatic cache purge, bot blocking, noindex, forced crawl rerun, or site-wide traffic change.

## Runbook when red/orange TTFB recurs

1. Preserve crawl metadata: tool, starting URL, region/user agent, crawl concurrency, sample date, HTML-only URL list, redirect chains and all HTTP statuses. Verify crawl pressure/429/5xx; do not trust threshold colors as universal CWV standards.
2. Compare the monitor's same route, same runner baseline and Cloudflare colo/cache hints. Separate static HTML, Worker root, redirects, image proxy and API; do not average different mechanisms into a single server score.
3. Check Cloudflare Workers Static Assets deployments for selected SHA, cache outcome and 5xx; compare cold and warm requests across Turkish and foreign regions. Existing platform caching does not require speculative CDN Cache Everything rules.
4. Corroborate with real-user consented Cloudflare RUM / CrUX p75 (if enough data), and Lighthouse mobile lab runs. Distinguish server-response-time from navigation TTFB and from INP/LCP.
5. Only if verified problematic: make a separate targeted change (e.g. a redundant Worker-first path, misconfigured redirect, oversized response, cache rule proven safe for static versioned assets), with unit tests, Playwright, SEO/canonical/10-language, release-gate and rollback checks.
6. Re-measure after Cloudflare deployment by SHA and compare identical geography, URL set and protocol. The monitor is a smoke check, not a promise that an SEO crawler's >500 ms rate will fall.

Primary sources: [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) and [web.dev Optimize TTFB](https://web.dev/articles/optimize-ttfb/).
