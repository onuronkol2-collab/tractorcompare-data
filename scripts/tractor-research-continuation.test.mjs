import test from "node:test";
import assert from "node:assert/strict";
import { continuationDecision, dispatchContinuation, parseRemainingCycles } from "./tractor-research-continuation.mjs";

const receipt = {
  status: "completed_controlled_run",
  stop_reason: "requested_batch_limit",
  queue_after: { queued: 411, retry: 4, completed: 24 },
  batches: [{
    failed: 0, processed: 2,
    results: [{ queue_id: "one", success: true }, { queue_id: "two", success: true }],
  }],
};

test("reject unbounded chain or invalid batch sizes", () => {
  assert.equal(parseRemainingCycles("8"), 8);
  for (const bad of ["", "-1", "9", "999", "1.5", "NaN"]) {
    assert.throws(() => parseRemainingCycles(bad));
  }
  assert.throws(() => continuationDecision(receipt, "8", "10"));
});

test("continue when progress is real and a verified queue remains", () => {
  assert.deepEqual(continuationDecision(receipt, "2", "1"), {
    continue: true, reason: "progress_and_pending_queue", nextCycles: 1,
  });
});

test("stop on cost cap, failed job, missing statistics, empty queue or zero progress", () => {
  assert.equal(continuationDecision(receipt, "0", "1").reason, "chain_budget_reached");
  assert.equal(continuationDecision({ ...receipt, stop_reason: "queue_empty" }, "5", "1").reason,
    "batch_stopped_or_queue_empty");
  assert.equal(continuationDecision({ ...receipt, queue_after: null }, "5", "1").reason,
    "queue_stats_unverified");
  assert.equal(continuationDecision({ ...receipt, queue_after: { queued: 0, retry: 0 } }, "5", "1").reason,
    "queue_drained");
  assert.equal(continuationDecision({ ...receipt, batches: [{ failed: 1, results: [] }] }, "5", "1").reason,
    "batch_job_failure_or_no_progress");
  assert.equal(continuationDecision({ ...receipt, batches: [{ failed: 0, results: [] }] }, "5", "1").reason,
    "batch_job_failure_or_no_progress");
  assert.equal(continuationDecision({ ...receipt, status: "failed" }, "5", "1").reason,
    "batch_not_successful");
});

test("verified source gaps may be skipped while the bounded chain continues", () => {
  const sourceGap = {
    ...receipt,
    batches: [{
      failed: 0, source_gaps: 2, processed: 3,
      results: [
        { queue_id: "missing-official-page", success: false, source_gap: true, http_status: 422 },
        { queue_id: "ambiguous-identity", success: false, source_gap: true, http_status: 422 },
        { queue_id: "found", success: true, source_gap: false, http_status: 200 },
      ],
    }],
  };
  assert.deepEqual(continuationDecision(sourceGap, "2", "1"), {
    continue: true, reason: "progress_and_pending_queue", nextCycles: 1,
  });
  const fakeGap = {
    ...sourceGap,
    batches: [{
      failed: 0, source_gaps: 1,
      results: [{ queue_id: "wrong-status", success: false, source_gap: true, http_status: 401 }],
    }],
  };
  assert.equal(continuationDecision(fakeGap, "2", "1").reason, "batch_job_failure_or_no_progress");
});

test("dispatches one branch-scoped successor with a decreasing counter", async () => {
  let requests = 0;
  const result = await dispatchContinuation({
    report: receipt,
    cycles: "2",
    batches: "1",
    githubToken: "test-only",
    repo: "onuronkol2-collab/tractorcompare-data",
    fetchFn: async (url, init) => {
      requests++;
      assert.match(url, /actions\/workflows\/tractor-research-batch.yml\/dispatches$/);
      assert.equal(init.method, "POST");
      assert.equal(init.headers.Authorization, "Bearer test-only");
      assert.deepEqual(JSON.parse(init.body), {
        ref: "main",
        inputs: { batches: "1", remaining_cycles: "1" },
      });
      return { status: 204 };
    },
  });
  assert.equal(result.dispatched, true);
  assert.equal(requests, 1);
});

test("will never dispatch with untrusted branch, wrong repo, or failed report", async () => {
  let requests = 0;
  const fn = async () => { requests++; return { status: 204 }; };
  await assert.rejects(() => dispatchContinuation({
    report: receipt, cycles: "2", batches: "1",
    githubToken: "test", repo: "attacker/fork", fetchFn: fn,
  }), /trusted TractorVS/);
  await assert.rejects(() => dispatchContinuation({
    report: receipt, cycles: "2", batches: "1",
    githubToken: "test", repo: "onuronkol2-collab/tractorcompare-data",
    ref: "refs/heads/feature", fetchFn: fn,
  }), /trusted TractorVS/);
  const noDispatch = await dispatchContinuation({
    report: { ...receipt, stop_reason: "queue_empty" }, cycles: "2", batches: "1",
    githubToken: "test", repo: "onuronkol2-collab/tractorcompare-data", fetchFn: fn,
  });
  assert.equal(noDispatch.dispatched, false);
  assert.equal(requests, 0);
});

test("GitHub dispatch API error stops the chain", async () => {
  await assert.rejects(() => dispatchContinuation({
    report: receipt, cycles: "2", batches: "1",
    githubToken: "test", repo: "onuronkol2-collab/tractorcompare-data",
    fetchFn: async () => ({ status: 403 }),
  }), /HTTP 403/);
});
