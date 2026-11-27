import test from "node:test";
import assert from "node:assert/strict";
import {assessProductionBarrier,assertProductionSettled,waitForProductionBarrier,PRODUCTION_REQUIRED_JOBS} from "../../scripts/tractorvs-production-barrier.mjs";
const base="a".repeat(40),repo="onuronkol2-collab/tractorcompare-data",at="2026-11-27T17:00:00Z",end="2026-11-27T17:10:00Z";
function fixture(){
 const run={id:12,run_attempt:1,path:".github/workflows/tractorvs-compare-live-browser-qa.yml",head_sha:base,head_branch:"main",repository:{full_name:repo},head_repository:{full_name:repo},event:"check_run",status:"completed",conclusion:"success",run_started_at:at};
 const jobs=PRODUCTION_REQUIRED_JOBS.map((name,i)=>({name,run_id:12,run_attempt:1,head_sha:base,status:"completed",conclusion:"success",completed_at:i===0?at:end}));
 const build={id:17,head_sha:base,name:"Workers Builds: tractorvs-site",app:{id:85455},status:"completed",conclusion:"success",completed_at:at};
 return {base,build,runs:[run],jobsByRun:new Map([[12,jobs]])};
}
test("only one complete trusted exact-base production matrix permits next merge",()=>{
 const f=fixture();assert.equal(assessProductionBarrier(f).state,"ready");
 const rows=f.jobsByRun.get(12);
 for(const name of PRODUCTION_REQUIRED_JOBS)assert.equal(assessProductionBarrier({...f,jobsByRun:new Map([[12,rows.filter(j=>j.name!==name)]])}).state,"pending");
 for(const change of [{conclusion:"failure"},{conclusion:"skipped"},{head_sha:"b".repeat(40)},{run_attempt:2},{run_id:99}])
  assert.equal(assessProductionBarrier({...f,jobsByRun:new Map([[12,rows.map((j,i)=>i===2?{...j,...change}:j)]])}).state,"pending");
 for(const change of [{event:"pull_request"},{head_branch:"other"},{path:".github/workflows/other.yml"},{head_repository:{full_name:"fork/repo"}}])
  assert.equal(assessProductionBarrier({...f,runs:[{...f.runs[0],...change}]}).state,"pending");
 assert.equal(assessProductionBarrier({...f,build:{...f.build,app:{id:1}}}).state,"pending");
 assert.equal(assessProductionBarrier({...f,build:{...f.build,completed_at:end}}).state,"pending");
});
test("active trusted matrix blocks even with old complete proof; skipped trigger cannot count",()=>{
 const f=fixture(),active={...f.runs[0],id:13,status:"in_progress",conclusion:null};
 const jobsByRun=new Map(f.jobsByRun);jobsByRun.set(13,[{name:PRODUCTION_REQUIRED_JOBS[1],status:"in_progress"}]);
 assert.equal(assessProductionBarrier({...f,runs:[...f.runs,active],jobsByRun}).state,"pending");
 assert.equal(assessProductionBarrier({...f,runs:[{...active,status:"completed",conclusion:"skipped"}],jobsByRun}).state,"pending");
});
test("final barrier refuses stale served SHA and moved main; bounded wait never approves pending",async()=>{
 const api=async()=>({data:{object:{sha:base}}}),inspect=async()=>({state:"ready",runId:12,buildId:17});
 await assert.rejects(assertProductionSettled(api,base,{inspect,verifyServed:async()=>({status:"ready",expected:base,observed:"c".repeat(40)})}),/served release differs/);
 await assert.rejects(assertProductionSettled(async()=>({data:{object:{sha:"c".repeat(40)}}}),base,{inspect,verifyServed:async()=>({status:"ready",expected:base,observed:base})}),/Main changed/);
 assert.equal((await assertProductionSettled(api,base,{inspect,verifyServed:async()=>({status:"ready",expected:base,observed:base})})).state,"ready");
 let calls=0;await assert.rejects(waitForProductionBarrier(api,base,{attempts:2,pause:async()=>{},inspect:async()=>{calls++;return {state:"pending",reason:"test"};}}),/bounded wait expired/);assert.equal(calls,2);
});
