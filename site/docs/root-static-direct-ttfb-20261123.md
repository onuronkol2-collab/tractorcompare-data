# Canonical homepage static-first routing — targeted TTFB fix (23 Nov 2026)

## Before
Cloudflare Workers Static Assets had `assets.run_worker_first: ["/", ...]` in two mirrored Wrangler configurations. English canonical homepage `/` is generated as `site/dist/index.html` by Astro; the Worker does **not** personalize, rewrite, redirect, authenticate, nor change its response. It reaches the end of its fetch handler and calls `env.ASSETS.fetch(request)`. Because the Worker always runs first for `/`, that extra execution path is unnecessary.

The first GitHub-runner synthetic TTFB probe, [run 45244045669](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45244045669), saw three root samples (p50 76 ms, p75 155 ms) versus three Turkish static-home samples (p50 27 ms, p75 44 ms); **this tiny comparison is directional only, not proof of a Worker CPU bottleneck.**

## Change
Remove only `/` from both `wrangler.jsonc` and `site/wrangler.jsonc`. The Worker still handles locale choice, photo-license-gated images, sitemap alias, verification proof URLs and visitor-country API. The fallback code and all existing published URL paths are unchanged.

Cloudflare's documented default *asset-first* behavior now serves the existing `/index.html` static output for `/`, without executing the Worker script first. No HTML TTL, Cache Everything rule, Supabase, forum, sitemap/hreflang, analytics consent, image file, photograph license, 10-locale page or database change.

The production release gate now **fails closed** if `/` or broad wildcards are accidentally re-added to Worker-first routing. A new regression test checks both Wrangler configs, canonical English static page creation and special-path preservation. The existing i18n worker unit test can still call the fallback directly without changing its semantics.

## Acceptance and rollback
1. CI: all Node tests, Astro/static production bundle, Golden Rule, SEO canonical/hreflang, 10 language pages and browser accessibility; validate both Wrangler configurations match.
2. After actual Cloudflare deployment: require `/` HTTP 200, English title/canonical/hreflang, no country/cookie redirect; compare `/tr/`, `/tractors/`, `/language/tr/` and sample photo URL behavior. Confirm root is listed as `static-root` in latest TTFB monitor artifact and measure p50/p75/p95 across runs.
3. Do **not** claim Ahrefs' 1,298 slow URLs were repaired by this one-route improvement. Need the matching crawler time/region per-URL evidence.
4. Rollback by reverting the squash merge commit, restoring `/` in both mirrored configurations and restoring the original release-gate requirement. Deploy and verify both cache route and SEO.

Documentation: [Cloudflare Static Assets routing](https://developers.cloudflare.com/workers/static-assets/) and [run_worker_first](https://developers.cloudflare.com/workers/static-assets/binding/).
