import test from "node:test";
import assert from "node:assert/strict";
import { runWatchdog, fetchQueueStats } from "./tractor-research-watchdog.mjs";
import { TRUSTED_REPO, WORKFLOW_NAME, DAILY_MAX_RUNS } from "./tractor-research-budget.mjs";

const jwt = "e30." + Buffer.from(JSON.stringify({role:"anon"})).toString("base64url") + ".sig";
const now = new Date("2026-11-20T13:29:00Z");
const base = {
  githubToken: "fake-github-token",
  repo: TRUSTED_REPO,
  ref: "refs/heads/main",
  jwt, queueSecret: "fake-queue-secret",
  now,
};

function mockApi({ runs = [], queue = {queued:10,retry:2}, failAuth=false, dispatchStatus=204 } = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    const kind = url.includes("/actions/runs?")
      ? "runs" : url.includes("/functions/v1/tractor-ai-research")
        ? "queue" : url.includes("/dispatches") ? "dispatch" : "unexpected";
    calls.push(kind);
    if (kind === "runs") {
      return new Response(JSON.stringify({
        total_count:runs.length,
        workflow_runs: runs.map(x=>({...x,name:WORKFLOW_NAME})),
      }),{status:200});
    }
    if(kind==="queue") {
      assert.equal(init.method,"POST");
      assert.equal(init.headers["x-queue-secret"],"fake-queue-secret");
      assert.equal(init.headers.Authorization,"Bearer "+jwt);
      assert.deepEqual(JSON.parse(init.body),{action:"queue_stats"});
      if(failAuth) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401});
      return new Response(JSON.stringify({success:true,queue}),{status:200});
    }
    if (kind==="dispatch") {
      assert.equal(init.headers.Authorization,"Bearer fake-github-token");
      assert.deepEqual(JSON.parse(init.body),{
        ref:"main",inputs:{batches:"1",remaining_cycles:"2"},
      });
      return {status:dispatchStatus};
    }
    throw new Error("Unexpected API destination");
  };
  return {calls,fetchFn};
}

test("watchdog performs read-only queue check then dispatches exactly one bounded chain",async()=>{
  const mock=mockApi();
  const result=await runWatchdog({...base,fetchFn:mock.fetchFn});
  assert.equal(result.dispatched,true);
  assert.deepEqual(mock.calls,["runs","queue","dispatch"]);
  assert.equal(result.gate.daily,0);
});

test("manual dry-run checks budget + authenticated queue without dispatch",async()=>{
  const mock=mockApi();
  const result=await runWatchdog({...base,dryRun:true,fetchFn:mock.fetchFn});
  assert.equal(result.reason,"dry_run_verified");
  assert.deepEqual(mock.calls,["runs","queue"]);
});

test("empty queue and review-only status do not create pointless runs",async()=>{
  const mock=mockApi({queue:{queued:0,retry:0,needs_source:50}});
  const result=await runWatchdog({...base,fetchFn:mock.fetchFn});
  assert.equal(result.reason,"queue_empty_or_manual_review_only");
  assert.deepEqual(mock.calls,["runs","queue"]);
});

test("quota denies before any Supabase call",async()=>{
  const runs=Array.from({length:DAILY_MAX_RUNS},(_,i)=>({
    id: i+1,created_at:"2026-11-20T"+String(i+1).padStart(2,"0")+":00:00Z",
    status:"completed",conclusion:"success",
  }));
  const mock=mockApi({runs});
  const result=await runWatchdog({...base,fetchFn:mock.fetchFn});
  assert.equal(result.reason,"quota_reached");
  assert.deepEqual(mock.calls,["runs"]);
});

test("bad key, malformed queue stats or dispatch errors never claim success",async()=>{
  const auth=mockApi({failAuth:true});
  await assert.rejects(runWatchdog({...base,fetchFn:auth.fetchFn}),/HTTP 401/);
  assert.deepEqual(auth.calls,["runs","queue"]);

  const malformed=mockApi({queue:{queued:"5",retry:0}});
  await assert.rejects(runWatchdog({...base,fetchFn:malformed.fetchFn}),/incomplete/);
  assert.deepEqual(malformed.calls,["runs","queue"]);

  const denied=mockApi({dispatchStatus:403});
  await assert.rejects(runWatchdog({...base,fetchFn:denied.fetchFn}),/HTTP 403/);
  assert.deepEqual(denied.calls,["runs","queue","dispatch"]);
});

test("untrusted repo and branch never call third parties",async()=>{
  let calls=0;
  const fn=async()=>{calls++;throw new Error("should never connect");};
  await assert.rejects(runWatchdog({...base,repo:"attacker/fork",fetchFn:fn}),/trusted repository/);
  await assert.rejects(runWatchdog({...base,ref:"refs/heads/pr",fetchFn:fn}),/trusted repository/);
  assert.equal(calls,0);
});

test("queue stats authentication enforces legacy anon JWT",async()=>{
  await assert.rejects(fetchQueueStats({
    jwt:"sb_secret_never_use",queueSecret:"secret",
    fetchFn:async()=>{throw Error("network must not be used");},
  }),/legacy anon/);
});
