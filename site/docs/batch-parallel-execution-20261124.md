# Batch-first parallel execution (24 November 2026)

User requires safe batch research, additions, testing and fewer repeated calls. Read AGENTS, current main and changed PR files in one grouped operation; source/brand batches, deduplicated evidence, same-unit exact variant validation, one coherent PR per shared root cause. Keep RLS, source rights, review and publication gates.

Measured baseline: #577 build job 138549293392: 914/914 Node tests passed, no skips. #565 browser job 138364590334: 451 passed, 97 skipped, test duration 6.3 min (inert build; skipped are not executed tests). #577 sitemap preview 138549501932 stopped at the intended bulk-change gate (3540/3996 pages). That protection is unchanged.

Pilot: four existing browser projects run on independent standard public-repo runners, only required engine installed, same inert builds/config/scope, fail-fast false, individual artifacts; aggregate browser-smoke requires matrix success. Each runner keeps its own cheap inert build to avoid extra artifact trust. No secrets or production HTML in caches. Npm download caches keyed by existing lockfiles. PR sitemap history queues isolated by PR number, main single-writer group remains unchanged. Running jobs not cancelled; pending same-group runs may be superseded. Live research QA unchanged.

Compare equivalent commits' wall-clock time and aggregate runner time, executed/passed/failed/skipped/flaky counts; parallel capacity may limit gain. No claimed speedup until actual logs. No new paid service. Rollback: revert this PR only. Keep unrelated PRs and 85% lastmod threshold intact.

References: https://playwright.dev/docs/test-parallel ; https://playwright.dev/docs/test-sharding ; https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency .
