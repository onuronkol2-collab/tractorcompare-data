# CodeQL common-incident recovery (2026-11-25)

Incident [#698](https://github.com/onuronkol2-collab/tractorcompare-data/issues/698) tracks a shared failure signature in PRs #692, #693, #696. #696 runs 45650621835 and 45652231920 exported SARIF in all three languages then failed around result submission. Earlier #689/#690 passed. Retrieved logs lack the HTTP rejection; this is not proof of a provider-wide outage, configuration error or zero vulnerabilities. Public GitHub status appeared operational.

## Triage and recovery

1. Collect current PR head SHA, current check-run IDs and conclusions, timestamps, sanitized job logs, previous successful run, and one distinct affected PR. Do not log credentials. Read GitHub Security > Code scanning > Tools status to obtain the exact error; check GitHub Status. If access is missing, escalate to the owner/Support using issue #698 and run IDs.
2. Use `node scripts/codeql-recovery.mjs /private/path/input.json` on locally assembled evidence: `checks` (latest check-run list for the exact head only), `logs` (language-keyed log strings), `sameIncidentRetries` (count recorded in the shared incident for this recovery epoch), `peerRecoveryVerified`, `configurationCorrected`. Flags are explicit, evidence-backed operator inputs, never inferred from unrelated green builds. Do not publish this JSON. The helper is advisory and never authorizes merge or issues API calls.
3. 401/403 or explicit setup/entitlement conflict: owner checks current Code scanning configuration, app permissions and exact error. 429: honor cooldown and rate limits. A real analysis error: fix affected code. Export+upload failure with unknown reason: hold and escalate. Skipped/cancelled/missing tests never count as passes.
4. Coordinate through one issue and one retry owner. A new recovery epoch requires newly verified peer success or a documented configuration/provider fix, not mere elapsed time. After credible recovery, retry a single affected package once; if retry API fails, record error instead of repeated empty commits. If failed again, no more retries without new root-cause evidence. Verify all three languages and every other required check on exact latest SHA; verify a distinct PR also recovered. Keep all required gates, default CodeQL setup, rulesets and query coverage unchanged. Do not run a duplicate advanced CodeQL workflow or separately upload its SARIF while default setup is enabled.
5. Continue isolated research and preparation where safe, not blocked merges. Check actual production SHA and live page evidence separately. Close issue after recovery evidence and residual risk are recorded. Do not treat preview success or scheduled public catalogue sync as proof of a gated PR merge.

Official guidance:
- https://docs.github.com/en/code-security/reference/code-scanning/sarif-files/troubleshoot-sarif-uploads
- https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/manage-your-configuration/use-the-tools-status-page-for-code-scanning

Offline regression: `node --test scripts/codeql-recovery.test.mjs`. This classifies failures and avoids retry loops, not a fix to GitHub's SARIF service. No new scheduled workflow, elevated permission, paid service, production change or weakening of security gates.
