# Research UX execution evidence — 2026-11-24

PR #557 run 45326272941 first hit a 30-minute Ubuntu dependency installation timeout; the second run succeeded with 40 intentional predeployment skips. Actual post-merge run 45330187374 passed all 40 journeys against the public domain.

Predeployment now lists the test inventory and runs offline report-gate regressions without downloading browser engines for tests that cannot yet execute. The job summary explicitly distinguishes this from a live pass. Push, schedule and manual runs retain Chromium, Firefox, WebKit and mobile Chromium across ten locales; the JSON report must contain actual, non-retried passing journeys for every locale/browser pair, without skipped, unexpected or flaky tests. The job remains bounded at 45 minutes to reduce dependency-installation timeout risk. A green predeployment check is never production evidence. Keep the report artifact and review any failures before claiming closure.

The production UI marker check is not an exact deployed SHA proof; retain separate Cloudflare build/deployment and live evidence. No RLS, published data, website behavior or SEO routes are changed. Revert this single commit if necessary; do not remove existing browser coverage.

Reference: https://playwright.dev/docs/test-reporters and https://playwright.dev/docs/api/class-testconfig
