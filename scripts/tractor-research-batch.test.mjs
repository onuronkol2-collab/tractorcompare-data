import test from "node:test";
import assert from "node:assert/strict";
import { parseBatches, conciseBatch, runBatches, assertAnonJwt, MAX_BATCHES, MAX_ITEMS_PER_BATCH } from "./tractor-research-batch.mjs";

const ANON_JWT = "e30." + Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url") + ".sig";
const SERVICE_JWT = "e30." + Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url") + ".sig";

test("only legacy anon JWT can be used at the gateway", () => {
  assert.doesNotThrow(() => assertAnonJwt(ANON_JWT));
  assert.throws(() => assertAnonJwt(SERVICE_JWT), /Only role=anon/);
  assert.throws(() => assertAnonJwt("sb_secret_mock"), /legacy anon/);
});

test("manual runs are strictly capped", () => {
  assert.equal(parseBatches("1"), 1);
  assert.equal(parseBatches("8"), MAX_BATCHES);
  for (const value of ["0", "9", "-1", "2.3", "NaN", "", "1000"]) {
    assert.throws(() => parseBatches(value));
  }
  assert.equal(MAX_ITEMS_PER_BATCH, 3);
});

test("partial failure is visible, not reported as completed", () => {
  const receipt = conciseBatch({
    requested_batch_size: 3,
    stop_reason: "upstream_error",
    results: [{ success: true, queue_id: "one" }, { success: false, queue_id: "two", http_status: 503 }],
  }, 200);
  assert.equal(receipt.processed, 2);
  assert.equal(receipt.failed, 1);
  assert.equal(receipt.stop_reason, "upstream_error");
  assert.equal(receipt.results[1].success, false);
});

test("queue empty is terminal and request authentication remains on the server", async () => {
  const actions = [];
  const report = await runBatches({
    batches: "8",
    jwt: ANON_JWT,
    queueSecret: "mock-secret",
    fetchFn: async (_url, init) => {
      const body = JSON.parse(init.body);
      actions.push(body.action);
      assert.equal(init.headers["x-queue-secret"], "mock-secret");
      assert.equal(init.headers.Authorization, "Bearer " + ANON_JWT);
      if (body.action === "queue_stats") {
        return new Response(JSON.stringify({ success: true, queue: { queued: 0, completed: 428 } }), { status: 200 });
      }
      assert.equal(body.batch_size, 3);
      return new Response(JSON.stringify({ requested_batch_size: 3, results: [], stop_reason: "queue_empty" }), { status: 200 });
    },
  });
  assert.deepEqual(actions, ["process_queue_batch", "queue_stats"]);
  assert.equal(report.stop_reason, "queue_empty");
  assert.deepEqual(report.queue_after, { queued: 0, completed: 428 });
});

test("upstream failure stops future paid research calls", async () => {
  const actions = [];
  const report = await runBatches({
    batches: "8",
    jwt: ANON_JWT,
    queueSecret: "mock-secret",
    fetchFn: async (_url, init) => {
      const action = JSON.parse(init.body).action;
      actions.push(action);
      if (action === "queue_stats") return new Response(JSON.stringify({ success: true, queue: { queued: 415 } }), { status: 200 });
      return new Response(JSON.stringify({
        requested_batch_size: 3,
        stop_reason: "upstream_error",
        results: [{ success: false, queue_id: "q", http_status: 503 }],
      }), { status: 200 });
    },
  });
  assert.equal(report.stop_reason, "batch_failure_stop");
  assert.deepEqual(actions, ["process_queue_batch", "queue_stats"]);
});

test("missing secrets and an HTTP authorization failure never attempt additional batches", async () => {
  await assert.rejects(() => runBatches({ batches: "1", jwt: "", queueSecret: "x" }), /secrets/);
  let count = 0;
  await assert.rejects(() => runBatches({
    batches: "8",
    jwt: ANON_JWT,
    queueSecret: "secret",
    fetchFn: async () => { count++; return new Response("{}", { status: 401 }); },
  }), /HTTP 401/);
  assert.equal(count, 1);
});


test("each completed batch is checkpointed before a later network failure", async () => {
  const savedReceipts = [];
  let calls = 0;
  await assert.rejects(() => runBatches({
    batches: "4",
    jwt: ANON_JWT,
    queueSecret: "secret",
    onBatch: (receipt, n) => savedReceipts.push({ n, receipt }),
    fetchFn: async () => {
      calls++;
      if (calls === 1) return new Response(JSON.stringify({
        requested_batch_size: 3,
        stop_reason: "batch_limit_reached",
        results: [{ queue_id: "first-claim", tractor_id: "tractor-1", success: true, http_status: 200 }],
      }), { status: 200 });
      return new Response("{}", { status: 502 });
    },
  }), /HTTP 502/);
  assert.equal(calls, 2);
  assert.equal(savedReceipts.length, 1);
  assert.equal(savedReceipts[0].n, 1);
  assert.equal(savedReceipts[0].receipt.results[0].queue_id, "first-claim");
});
