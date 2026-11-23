# TractorVS consent-gated product engagement goals (23 Nov 2026)

## Scope and reason
The connected GA4 property's sole configured key event is `purchase`, even though
TractorVS currently offers technical research, not direct product checkout.
This patch introduces four **non-key** product navigation events without
changing the privacy agreement, GA4 property settings or tracking providers.

| GA4 event | Exact meaning |
| --- | --- |
| `tractor_model_view` | An approved model-detail URL was opened |
| `tractor_compare_view` | The generic comparison tool URL was opened |
| `tractor_comparison_read` | An editorial model-pair comparison URL was opened |
| `tractor_advisor_view` | The tractor advisor URL was opened |

These are views / navigation indicators, **not** completed comparisons, qualified
leads, successful recommendations, sales, or verified rankings. They are emitted
only if the visitor explicitly accepts analytics, through the existing consent-gated
`AnalyticsConsent.astro` loader. GA4 events are queued after the consent grant
and config, before requesting the GA4 script. No identifying custom parameters,
search strings, user content, form data, or model-specific IDs are attached. A
visitor who rejects analytics never loads GA4 and never emits these events.
All ten language routes share the same event labels.

## Acceptance and limitations
- `node --experimental-strip-types --test tests/analytics-goal-events.test.mjs`
  in `site/`, plus the existing consent suite, production build and browser checks
  must pass; CI is the authority for results.
- Check a consent-rejected and consent-accepted real browser session in each
  major locale before merging. Do not infer tracking counts from source-code tests.
- GA4 event reporting can be delayed and opt-in samples are not all site traffic.
- Once live data establishes useful business goals, configure the appropriate
  GA4 key events in the GA4 administrator interface; this change does **not**
  change the `purchase` key event or admin settings. Do not mark generic views as
  conversions merely to increase the reported conversion rate.
- No indexability, metadata, site map, RLS, forum posts, photo licenses,
  auto-publishing, Cloudflare deployment, or other agents' changes are modified.
