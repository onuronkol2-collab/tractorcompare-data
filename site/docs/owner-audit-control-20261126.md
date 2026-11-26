# Owner-authorized on-demand public audits (26 Nov 2026)
Control issue: https://github.com/onuronkol2-collab/tractorcompare-data/issues/747

After the workflow PR is merged into main, the connected repository owner (user ID 356616554) can request one of three fixed commands by creating a new issue comment:
- `/tractorvs-audit full-seo` — existing full production sitemap/HTML/links SEO audit.
- `/tractorvs-audit mobile-performance` — existing mobile Lighthouse template/locale and SSR footprint audit.
- `/tractorvs-audit all` — both independent checks.

Check currently running jobs first; don't send repeated commands for an equivalent active run. The workflows exist on main and use the fixed default-main SHA, not a pull request or user-controlled ref. Job conditions reject other users, PRs, issues, closed issue, edited comments and arbitrary strings. Unrelated comment events may create skipped workflow records but do not allocate runners. No new secret, external app, deployment authority, database writes, arbitrary code execution, paid crawler or API credits. Existing workflow_dispatch, scheduled and PR behavior remains. Read-only GitHub token scopes only; checkout credentials are not persisted. Each requested job uses the trusted production readiness gate before and after measurements and fails if the served SHA changes. Full SEO mode is explicit, and Lighthouse remains template-sampled lab evidence (not field Core Web Vitals). Existing run/job timeouts and artifact retention remain. Concurrency serializes production runs per workflow without cancelling a running job; pending requests can be superseded by later ones. Do not claim a skipped/queued/commented request is a successful test.

Activation: exact SHA CI/CodeQL and applicable Cloudflare preview must pass; merge after current-main compatibility; verify actual on-demand runs from the newly deployed workflow and actual job logs. Closing issue 747 disables comment-based requests; manual and scheduled audits remain. Revert PR to remove the feature. Never add arbitrary commands or broader token access to this mechanism.
