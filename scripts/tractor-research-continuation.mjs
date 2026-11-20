// Trigger a follow-up GitHub Actions run after a successful, bounded
// research batch. Does NOT publish tractors or bypass review.
import { readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const WORKFLOW_FILE = "tractor-research-batch.yml";
export const ALLOWED_BATCHES = new Set(["1", "2", "4", "8"]);
export const MAX_REMAINING_CYCLES = 8;

export function parseRemainingCycles(value) {
  const s = String(value ?? "").trim();
  if (!/^(?:0|[1-8])$/.test(s)) throw new Error("Continuation cycles must be 0 through 8.");
  return Number(s);
}

export function continuationDecision(report, cycles, batches) {
  const left = parseRemainingCycles(cycles);
  if (!ALLOWED_BATCHES.has(String(batches))) throw new Error("Invalid bounded batch selection.");
  if (left === 0) return { continue: false, reason: "chain_budget_reached" };
  if (!report || report.status !== "completed_controlled_run") {
    return { continue: false, reason: "batch_not_successful" };
  }
  if (report.stop_reason !== "requested_batch_limit") {
    return { continue: false, reason: "batch_stopped_or_queue_empty" };
  }
  if (!Array.isArray(report.batches) || report.batches.length !== Number(batches)) {
    return { continue: false, reason: "incomplete_batch_receipt" };
  }
  const counts = report.queue_after;
  if (!counts || typeof counts !== "object" ||
    !Number.isSafeInteger(counts.queued) || !Number.isSafeInteger(counts.retry) ||
    counts.queued < 0 || counts.retry < 0) {
    return { continue: false, reason: "queue_stats_unverified" };
  }
  if (counts.queued + counts.retry === 0) return { continue: false, reason: "queue_drained" };
  if (!report.batches.every(b => b && b.failed === 0 &&
    Array.isArray(b.results) && b.results.length > 0 &&
    b.results.every(x => x?.success === true && typeof x.queue_id === "string" && x.queue_id))) {
    return { continue: false, reason: "batch_job_failure_or_no_progress" };
  }
  return { continue: true, reason: "progress_and_pending_queue", nextCycles: left - 1 };
}

export async function dispatchContinuation({ report, cycles, batches, githubToken, repo,
  ref = "refs/heads/main", fetchFn = fetch }) {
  const decision = continuationDecision(report, cycles, batches);
  if (!decision.continue) return { ...decision, dispatched: false };
  if (repo !== "onuronkol2-collab/tractorcompare-data" || ref !== "refs/heads/main") {
    throw new Error("Only the trusted TractorVS default branch may trigger research continuation.");
  }
  if (!githubToken) throw new Error("GitHub Actions token was not supplied.");
  const url = "https://api.github.com/repos/" + repo + "/actions/workflows/" + WORKFLOW_FILE + "/dispatches";
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + githubToken,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        batches: String(batches),
        remaining_cycles: String(decision.nextCycles),
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status !== 204) {
    throw new Error("GitHub declined safe continuation request, HTTP " + response.status);
  }
  return { ...decision, dispatched: true };
}

export async function main() {
  const report = JSON.parse(readFileSync(resolve("tractor-research-progress.json"), "utf8"));
  const opts = {
    report,
    cycles: process.env.TRACTORVS_REMAINING_CYCLES ?? "0",
    batches: process.env.TRACTORVS_BATCHES ?? "1",
    githubToken: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
  };
  const result = await dispatchContinuation(opts);
  const line = result.dispatched
    ? "Next controlled research run dispatched, cycles remaining: " + result.nextCycles
    : "No continuation: " + result.reason;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    "\n**Continuation:** " + line + "\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
