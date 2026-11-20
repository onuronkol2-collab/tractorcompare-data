// Fail-closed spending gate before any paid queue claim, including manual runs.
// A research run counts toward UTC dispatch caps even when it was manually launched.
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { assertTrustedScope, fetchResearchRuns, decideResearchQuota } from "./tractor-research-budget.mjs";

export async function checkProcessAllowance({ githubToken, repo, ref, runId,
  batches = "1", fetchFn = fetch, now = new Date() }) {
  assertTrustedScope(repo, ref);
  // The automatic cost policy allows at most one batch of 3 queue claims per dispatch.
  // Existing GitHub manual menu values over 1 are rejected until an explicit budget review.
  if (String(batches) !== "1") {
    return { allowed: false, reason: "batch_input_exceeds_approved_auto_budget" };
  }
  const runs = await fetchResearchRuns({ githubToken, repo, fetchFn, now });
  return decideResearchQuota({
    runs, now, currentRunId: Number(runId), forExistingRun: true,
  });
}
export async function main() {
  const answer = await checkProcessAllowance({
    githubToken: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    runId: process.env.GITHUB_RUN_ID,
    batches: process.env.TRACTORVS_BATCHES,
  });
  const allowed = Boolean(answer.allowed);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, "allowed=" + allowed + "\n");
  }
  const line = "Research budget gate: " + answer.reason + "; allowed=" + allowed +
    "; UTC daily/monthly dispatches=" + String(answer.daily ?? "unknown") +
    "/" + String(answer.monthly ?? "unknown");
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, "- " + line + "\n");
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
