# CI speed candidate — 2026-11-27

Base: 2265f867f3eca451e2f93986a64337ced1207808. Prepared without starting CI, pushing a branch, merging or deploying.

## Evidence and scope

- PR #775 baseline run 46034141364: 430 seconds overall. WebKit job 140625169631: 148 passed, 4.8 min browser execution; Chromium 155 passed in 1.4 min, Firefox 148 in 1.6 min, mobile Chromium 152 in 1.4 min. Runner queue and setup contribute separately. Existing intentional skips must be audited, not counted as executed.
- Browser engine installation took about 30–46 seconds. Inert build took about 2–3 seconds per project. Artifact transfer and a serial build gate would likely cost more than that build; retain isolated builds.
- Site build run 46034141294: 102 seconds; all three build invocations are short and serve distinct entrypoint/indexing checks. Keep each. Production bundle run 46034141316: 87 seconds; add lock-keyed npm download cache, preserve npm ci and production pre/postflight.
- Live QA run 46036047872 uses two simultaneous projects; keep cap and exact release checks due to live traffic, rate limits and WAF. Align the browser runner with the proven Ubuntu 24.04 baseline. No production endpoint or access control changes.
- Browser binary cache is not assumed beneficial; official Playwright guidance notes restore may take as long as downloading and OS deps still need installation. Consider only after measured benchmark. No paid runner or new service.

## Acceptance under TEST authorization only

1. Rebase/recheck workflow conflicts against current main and open PRs. Validate YAML/action expressions, workflow-policy regression tests, all existing required checks, CodeQL and Cloudflare preview; keep required names and permissions intact.
2. Compare exact Playwright test identities from an unsharded listing to the union of both WebKit shard listings (no lost/duplicate test). Compare each executed, skipped, failed, flaky and retry count, including existing expected platform skips. Require both shards successful and all other projects complete. Missing/cancelled shards fail aggregate. Confirm unique artifacts and retain traces; inspect any test that is newly skipped or flaky. Do not accept a faster result with lower coverage.
3. Compare at least three comparable successful runs: workflow wall time, individual execution and setup, queue, total runner-minutes, cache hits. Target shorter wall time without unacceptable increased runner usage. If no benefit or worse reliability, revert the shard change; never turn off required checks. Consider optimizing the multi-locale WebKit tests (forum compose 29.7s; forum dashboard 25.4s; editorial hub 22.1s) via reliable locators and independent fixtures without dropping checks, only if profiling supports it.
4. Verify live QA with original two-project maximum, all four projects and same-SHA before/after evidence. No live run or deploy until explicitly authorized under existing command policy.
5. Avoid duplicate PRs and use same-SHA existing success evidence where policy allows; only retry failed jobs for genuinely transient problems and unchanged SHA. Existing obsolete PR cancellation stays unchanged; never skip required CodeQL/security/RLS/SEO/photo/license/language checks.

References: https://playwright.dev/docs/test-sharding ; https://playwright.dev/docs/ci ; https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching .

## Second optimization wave (prepared, not tested)
- Split three measured slow, state-independent ten-language local journeys into two five-language tests each; original assertions preserved. New test identities replace the three old titles, so compare per-locale assertion coverage as well as the new unsharded/sharded test inventory; expected test count increases by three per applicable browser. Check locale set equality, isolation and reliability. The old timings were 25.4s dashboard, 13.8s article filter and 22.1s full-text guide/review. No arbitrary sleeps removed or timeouts shortened.
- Readiness evaluator reuses ancestry comparison for identical candidate/main SHA and reads checks and statuses concurrently. It still fetches current main and PR, paginates fresh evidence, fails closed and rechecks main/head before terminal status. Add a regression review of main movement, paginated failure and unchanged SHA when TEST is authorized.
- Non-forum QA isolates read-only PR inventory by PR number and cancels only superseded inventory, keeping all production triggers serialized; no increased live traffic. Pin the proven LTS runner, lock-key npm cache and prefer offline npm downloads. All 40 required live journeys and evidence checks remain unchanged.
- Matrix regression test checks complete WebKit partition and unique artifacts; run under TEST. Before adoption, measure total runner-minutes and wall time; do not keep an optimization that regresses reliability or coverage.
