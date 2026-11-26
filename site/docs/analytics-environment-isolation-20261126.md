# Analytics measurement isolation — 26 Nov 2026

Scope: UX / measurement workstream, independent of SEO, forum, photos and release coordination. No historic analytics data or GA4 admin filter is changed.

## Observed baseline (GA4 property 565231416, settled Oct 27–Nov 23)
33 sessions, 8 users, 192 page views, 17 mobile sessions and 16 desktop. Source/medium: ChatGPT AI assistant 14, direct 7, t.co referral 7, Google Accounts referral 2, Google organic 2, Tag Assistant referral 1. All reported hostnames: tractorvs.com. These counts are not a verified human audience. The preview exposure is a code-level risk, not evidence that preview sessions were received. No prior comparison data; no custom tractor events in this window. Sample too small for UX causality or conversion claims.

## Proposed code gate
Only canonical HTTPS production origin can fetch any of the three vendors. Loopback tests use inert script data blocks and preserve consent/queue assertions. Other hosts and auth callback payloads never load these providers. GA4 config ignores only the exact Google Accounts referrer, preserving events, Google Search and AI attribution. Existing consent and revocation behavior remains. Cloudflare dashboard auto-injection must independently remain disabled; source code cannot control that setting.

## Release and measurement acceptance
Run the existing required CI/CodeQL/browser/preview gates and new analytics unit + browser regressions. Coordinate merge and current-SHA production checks with release workstream. Verify real production consent/no-consent paths without generating artificial production traffic; use existing legitimate sessions and provider evidence. GA4 admin developer/internal filters: inspect first, Testing mode only, validate against legitimate traffic before any activation. Do not exclude all ChatGPT, all GitHub, or all Turkish traffic. No old data deletion. Direct admin settings, Clarity and Cloudflare dashboard metrics remain unverified by this patch. Compare settled 7/28/90 day windows when enough data exists; use distinct returning users, action events and device breakdowns, not synthetic successes.

## Browser dependency incident (#755)
Run 45878797322 / mobile job 140112552983 on Ubuntu 26.04 failed before any test: Microsoft APT feed returned HTTP 403, exit 100. Chromium (152 passed) and Firefox (145 passed) on the same source SHA succeeded; the failure is runner/dependency infrastructure, not a demonstrated application regression. Pin the dependency-installing matrix to Ubuntu 24.04 LTS and guard the four-engine matrix and fail-closed aggregate with a contract test. Preserve signed APT verification, pinned Playwright, permissions, timeouts and existing test coverage. No blind rerun or bypass. New SHA must pass required checks; the mitigation is not yet verified. Other workflows are not modified without evidence of the same failure or coordination with their owners.
