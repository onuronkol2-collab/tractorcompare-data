import test from "node:test";
import assert from "node:assert/strict";
import {
  TRUSTED_REPO, WORKFLOW_NAME, DAILY_MAX_RUNS, MONTHLY_MAX_RUNS,
  utcPeriod, fetchResearchRuns, decideResearchQuota, assertTrustedScope,
} from "./tractor-research-budget.mjs";
import { checkProcessAllowance, checkNextAllowance } from "./tractor-research-budget-guard.mjs";

const now = new Date("2026-11-20T13:25:00Z");
function record(id, at, status = "completed", conclusion = "success") {
  return { id, created_at: at, status, conclusion };
}
function responseFor(items, total = items.length) {
  return new Response(JSON.stringify({
    total_count: total,
    workflow_runs: items.map(r => ({ ...r, name: r.name ?? WORKFLOW_NAME })),
  }), { status: 200 });
}
function fakeFetch(items) {
  return async (url, init) => {
    assert.ok(url.includes("/actions/runs?"));
    assert.ok(url.includes("event=workflow_dispatch"));
    assert.ok(url.includes("created="));
    assert.match(init.headers.Authorization, /Bearer /);
    return responseFor(items);
  };
}

test("UTC quota boundaries and repository scope are strict", () => {
  assert.deepEqual(utcPeriod("2026-12-01T00:00:00Z"), {
    day: "2026-12-01", month: "2026-12", timestamp: Date.parse("2026-12-01T00:00:00Z"),
  });
  assert.doesNotThrow(() => assertTrustedScope(TRUSTED_REPO, "refs/heads/main"));
  assert.throws(() => assertTrustedScope("someone/fork", "refs/heads/main"), /trusted repository/);
  assert.throws(() => assertTrustedScope(TRUSTED_REPO, "refs/heads/release"), /trusted repository/);
  assert.equal(DAILY_MAX_RUNS, 6);
  assert.equal(MONTHLY_MAX_RUNS, 24);
});

test("watchdog stops at daily run cap and existing last allowed run can finish", () => {
  const runs = Array.from({length: DAILY_MAX_RUNS}, (_,i) =>
    record(100+i, "2026-11-20T" + String(10+i).padStart(2,"0") + ":00:00Z"));
  assert.equal(decideResearchQuota({runs, now}).reason,"quota_reached");
  const current = decideResearchQuota({runs, now, currentRunId:105, forExistingRun:true});
  assert.equal(current.allowed,true);
  assert.equal(current.daily, DAILY_MAX_RUNS);
  assert.equal(decideResearchQuota({runs:[...runs,record(106,"2026-11-20T13:00:00Z")],
    now,currentRunId:106,forExistingRun:true}).reason, "quota_exceeded");
});

test("monthly cap and UTC day reset work without changing monthly allowance", () => {
  const runs = Array.from({length: MONTHLY_MAX_RUNS}, (_,i) =>
    record(i+1, "2026-11-" + String(1+i%19).padStart(2,"0") + "T09:00:00Z"));
  const d=decideResearchQuota({runs,now});
  assert.equal(d.daily,0);
  assert.equal(d.monthly,MONTHLY_MAX_RUNS);
  assert.equal(d.reason,"quota_reached");
  assert.equal(decideResearchQuota({runs,now:new Date("2026-12-01T00:01:00Z")}).allowed,true);
});

test("two consecutive failures trigger cooldown but one failure never blocks forever", () => {
  const failure = [
    record(22,"2026-11-20T13:20:00Z","completed","failure"),
    record(21,"2026-11-20T13:10:00Z","completed","failure"),
  ];
  assert.equal(decideResearchQuota({runs:failure,now}).reason,"consecutive_failure_cooldown");
  assert.equal(decideResearchQuota({runs:failure,now:new Date("2026-11-20T19:21:00Z")}).allowed,true);
  const recovered=[record(23,"2026-11-20T13:24:00Z"),...failure];
  assert.equal(decideResearchQuota({runs:recovered,now}).allowed,true);
});

test("active research work prevents watchdog collisions, except own current run", () => {
  const runs=[record(15,"2026-11-20T13:24:00Z","in_progress",null)];
  assert.equal(decideResearchQuota({runs,now}).reason,"another_research_run_active");
  assert.equal(decideResearchQuota({
    runs,now,currentRunId:15,forExistingRun:true,
  }).allowed,true);
  assert.equal(decideResearchQuota({runs,now,currentRunId:15}).allowed,true);
});

test("run listing filters only research workflow dispatches, not unrelated jobs", async () => {
  const hits=[{...record(11,"2026-11-20T10:00:00Z"),name:WORKFLOW_NAME},
              {...record(12,"2026-11-20T11:00:00Z"),name:"Unrelated manual workflow"}];
  const result=await fetchResearchRuns({
    githubToken:"test-token",repo:TRUSTED_REPO,now,
    fetchFn:fakeFetch(hits),
  });
  assert.deepEqual(result.map(x=>x.id),[11]);
});

test("GitHub query failures, incomplete pagination, and bad timestamps fail closed", async () => {
  await assert.rejects(fetchResearchRuns({
    githubToken:"test",repo:TRUSTED_REPO,now,
    fetchFn:async()=>new Response("{}",{status:403}),
  }),/quota/);
  await assert.rejects(fetchResearchRuns({
    githubToken:"test",repo:TRUSTED_REPO,now,
    fetchFn:async()=>responseFor([],101),
  }),/incomplete/);
  await assert.rejects(fetchResearchRuns({
    githubToken:"test",repo:TRUSTED_REPO,now,
    fetchFn:async()=>responseFor([record(2,"invalid-date")]),
  }),/timestamps/);
});

test("processing gate enforces manual one-batch, current GH run and count", async () => {
  const single=[record(9,"2026-11-20T13:00:00Z","in_progress",null)];
  const common={ githubToken:"test",repo:TRUSTED_REPO,ref:"refs/heads/main",runId:"9",now,fetchFn:fakeFetch(single) };
  assert.equal((await checkProcessAllowance({...common,batches:"1"})).allowed,true);
  assert.equal((await checkProcessAllowance({...common,batches:"8"})).allowed,false);
  assert.equal((await checkProcessAllowance({...common,batches:"1",runId:"404"})).allowed,false);
  assert.equal((await checkNextAllowance(common)).allowed,true);
});
