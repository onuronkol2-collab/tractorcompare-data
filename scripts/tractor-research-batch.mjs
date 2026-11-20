// Controlled, restartable TractorVS batch runner. No public-data edits or auto-publication.
import { writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FUNCTION_URL = "https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/tractor-ai-research";
export const MAX_BATCHES = 8;
export const MAX_ITEMS_PER_BATCH = 3;

// The queue secret authenticates the privileged queue route. Never send a service_role key.
export function assertAnonJwt(jwt) {
  if (typeof jwt !== "string" || jwt.split(".").length !== 3) {
    throw new Error("Provide a valid legacy anon JWT, not a secret/publishable API key.");
  }
  let role;
  try { role = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8")).role; }
  catch { throw new Error("Legacy anon JWT has an invalid claims payload."); }
  if (role !== "anon") throw new Error("Only role=anon JWT is permitted. Never use service_role or a user token.");
}

export function parseBatches(value) {
  const raw = String(value ?? "").trim();
  if (!/^[1-8]$/.test(raw)) throw new Error("Batch count must be an integer from 1 to 8.");
  return Number(raw);
}

export function conciseBatch(body, httpStatus) {
  if (!body || typeof body !== "object" || !Array.isArray(body.results)) {
    throw new Error("Research endpoint returned an invalid batch structure.");
  }
  const stopReason = String(body.stop_reason ?? "unknown");
  const results = body.results.map((item) => ({
    queue_id: typeof item.queue_id === "string" ? item.queue_id : null,
    tractor_id: typeof item.tractor_id === "string" ? item.tractor_id : null,
    success: item.success === true,
    http_status: Number(item.http_status ?? 0),
    research_status: item.research_status == null ? null : String(item.research_status).slice(0, 60),
  }));
  const failed = results.filter((item) => !item.success).length;
  return {
    http_status: httpStatus,
    requested_batch_size: Number(body.requested_batch_size ?? 0),
    processed: results.length,
    failed,
    stop_reason: stopReason,
    results,
  };
}

export async function runBatches({ batches, jwt, queueSecret, fetchFn = fetch, onBatch = () => {} }) {
  if (!jwt || !queueSecret) throw new Error("Required GitHub Actions secrets are not configured.");
  assertAnonJwt(jwt);
  const batchCount = parseBatches(batches);
  const headers = {
    "Content-Type": "application/json",
    apikey: jwt,
    Authorization: "Bearer " + jwt,
    "x-queue-secret": queueSecret,
  };
  const post = async (action, other = {}) => {
    const response = await fetchFn(FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, ...other }),
      signal: AbortSignal.timeout(125_000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error("Research endpoint HTTP " + response.status + " for " + action + ".");
    }
    return { status: response.status, data };
  };

  const report = {
    started_at: new Date().toISOString(),
    requested_batches: batchCount,
    max_tractors: batchCount * MAX_ITEMS_PER_BATCH,
    batches: [],
    queue_after: null,
    stop_reason: "requested_batch_limit",
  };
  for (let index = 0; index < batchCount; index++) {
    const { status, data } = await post("process_queue_batch", { batch_size: MAX_ITEMS_PER_BATCH });
    const receipt = conciseBatch(data, status);
    report.batches.push(receipt);
    onBatch(receipt, index + 1);

    if (receipt.failed || receipt.stop_reason === "upstream_error" || receipt.stop_reason === "worker_exception" || receipt.stop_reason === "worker_http_error") {
      report.stop_reason = "batch_failure_stop";
      break;
    }
    if (receipt.stop_reason === "queue_empty" || receipt.processed === 0) {
      report.stop_reason = "queue_empty";
      break;
    }
  }
  try {
    const { data } = await post("queue_stats");
    if (data?.success === true && data?.queue && typeof data.queue === "object") {
      report.queue_after = Object.fromEntries(
        Object.entries(data.queue).filter(([key, value]) => /^[a-z_]+$/.test(key) && Number.isSafeInteger(value))
      );
    }
  } catch {
    report.queue_after = null;
  }
  report.completed_at = new Date().toISOString();
  return report;
}

export async function main() {
  const outputPath = resolve("tractor-research-progress.json");
  const checkpoint = { started_at: new Date().toISOString(), status: "in_progress", batches: [] };
  let report = checkpoint;
  writeFileSync(outputPath, JSON.stringify(checkpoint, null, 2) + "\n", { mode: 0o600 });
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  try {
    report = await runBatches({
      batches: process.env.TRACTORVS_BATCHES || "1",
      jwt: process.env.TRACTORVS_SUPABASE_ANON_JWT,
      queueSecret: process.env.TRACTORVS_QUEUE_SECRET,
      onBatch: (batch, n) => {
        checkpoint.batches.push(batch);
        checkpoint.last_completed_batch = n;
        writeFileSync(outputPath, JSON.stringify(checkpoint, null, 2) + "\n", { mode: 0o600 });
        console.log("Batch " + n + ": processed=" + batch.processed + " failed=" + batch.failed + " stop=" + batch.stop_reason);
      },
    });
    report.status = report.stop_reason === "batch_failure_stop" ? "stopped_after_failure" : "completed_controlled_run";
    const checked = report.batches.reduce((n, b) => n + b.results.filter((r) => r.queue_id).length, 0);
    const failed = report.batches.reduce((n, b) => n + b.failed, 0);
    const summary = "# TractorVS controlled research\n\n" +
      "- Queue jobs claimed: " + checked + "\n" +
      "- Failed results: " + failed + "\n" +
      "- Stop reason: " + report.stop_reason + "\n" +
      "- Queue after: " + JSON.stringify(report.queue_after ?? "unavailable") + "\n" +
      "- No draft publication is performed by this runner.\n";
    if (summaryFile) appendFileSync(summaryFile, summary);
    console.log("Claimed " + checked + " jobs; failed " + failed + "; stop " + report.stop_reason);
    if (report.status === "stopped_after_failure") process.exitCode = 1;
  } catch (error) {
    report = { ...checkpoint, status: "failed", error: String(error?.message ?? "Unknown error").slice(0, 160) };
    console.error(report.error);
    if (summaryFile) appendFileSync(summaryFile, "# TractorVS controlled research\n\nJob stopped with error: " + report.error + "\n");
    process.exitCode = 1;
  } finally {
    writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
