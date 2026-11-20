// Half-hourly, cost-capped TractorVS recovery launcher.
// Uses only the existing Edge queue's authenticated read-only queue_stats.
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { assertAnonJwt, FUNCTION_URL } from "./tractor-research-batch.mjs";
import {
  TRUSTED_REPO, assertTrustedScope, fetchResearchRuns, decideResearchQuota,
} from "./tractor-research-budget.mjs";

export async function fetchQueueStats({ jwt, queueSecret, fetchFn = fetch }) {
  if (!jwt || !queueSecret) throw new Error("Missing existing TractorVS research secrets.");
  assertAnonJwt(jwt);
  const response = await fetchFn(FUNCTION_URL, {
    method: "POST",
    headers: {
      apikey: jwt,
      Authorization: "Bearer " + jwt,
      "x-queue-secret": queueSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "queue_stats" }),
    signal: AbortSignal.timeout(25000),
  });
  if (response.status !== 200) {
    throw new Error("Research gateway rejected read-only queue check: HTTP " + response.status);
  }
  const data = await response.json();
  if (data?.success !== true || !data.queue ||
      !Number.isSafeInteger(data.queue.queued) || !Number.isSafeInteger(data.queue.retry) ||
      data.queue.queued < 0 || data.queue.retry < 0) {
    throw new Error("Research queue stats incomplete; cannot dispatch.");
  }
  return { queued: data.queue.queued, retry: data.queue.retry };
}

export async function runWatchdog({ githubToken, repo, ref,
  jwt, queueSecret, dryRun = false, now = new Date(), fetchFn = fetch }) {
  assertTrustedScope(repo, ref);
  if (!githubToken) throw new Error("GitHub Actions token required.");
  const runs = await fetchResearchRuns({ githubToken, repo, fetchFn, now });
  const gate = decideResearchQuota({ runs, now });
  if (!gate.allowed) return { dispatched: false, reason: gate.reason, gate };
  const queue = await fetchQueueStats({ jwt, queueSecret, fetchFn });
  if (!queue.queued && !queue.retry) {
    return { dispatched: false, reason: "queue_empty_or_manual_review_only", gate, queue };
  }
  if (dryRun) return { dispatched: false, reason: "dry_run_verified", gate, queue };
  const response = await fetchFn("https://api.github.com/repos/" + TRUSTED_REPO +
    "/actions/workflows/tractor-research-batch.yml/dispatches", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + githubToken,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "main", inputs: { batches: "1", remaining_cycles: "2" } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status !== 204) {
    throw new Error("Research workflow auto-dispatch denied: HTTP " + response.status);
  }
  return { dispatched: true, reason: "one_bounded_research_run_dispatched", gate, queue };
}

export async function main() {
  const result = await runWatchdog({
    githubToken: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    jwt: process.env.TRACTORVS_SUPABASE_ANON_JWT,
    queueSecret: process.env.TRACTORVS_QUEUE_SECRET,
    dryRun: process.env.TRACTORVS_DRY_RUN === "true",
  });
  const line = "TractorVS watchdog: " + result.reason + "; dispatched=" +
    result.dispatched + "; UTC daily/monthly runs=" + result.gate.daily +
    "/" + result.gate.monthly + "; queue=" +
    JSON.stringify(result.queue ?? "not_polled");
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## TractorVS automatic research\n\n" +
      "- " + line + "\n- Research results remain drafts pending evidence checks.\n" +
      "- Limits count dispatches, NOT actual paid Gemini tokens.\n");
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
