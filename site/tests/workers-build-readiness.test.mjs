import test from "node:test";
import assert from "node:assert/strict";
import {classifyWorkersBuild,waitForWorkersBuild} from "../scripts/workers-build-readiness.mjs";
const sha="a".repeat(40),other="b".repeat(40);
const check=(fields={})=>({id:1,name:"Workers Builds: tractorvs-site",head_sha:sha,app:{slug:"cloudflare-workers-and-pages"},status:"completed",conclusion:"success",...fields});
const reply=(...checks)=>({check_runs:checks});
test("only the trusted latest Workers build for exact SHA counts",()=>{
 assert.equal(classifyWorkersBuild(reply(check({head_sha:other}),check({app:{slug:"other-app"}})),sha).status,"pending");
 assert.equal(classifyWorkersBuild(reply(check(),check({id:2,status:"in_progress",conclusion:null})),sha).status,"pending");
 assert.equal(classifyWorkersBuild(reply(check({id:2,conclusion:"failure"}),check()),sha).status,"failed");
 assert.equal(classifyWorkersBuild(reply(check()),sha).status,"ready");
});
test("wait through missing and running checks without probing stale preview; fail closed on terminal error",async()=>{
 let calls=0,pauses=0;
 const options={sha,token:"test",attempts:3,pause:async()=>pauses++};
 const result=await waitForWorkersBuild({...options,fetchFn:async(url,opts)=>{
  assert.equal(url,"https://api.github.com/repos/onuronkol2-collab/tractorcompare-data/commits/"+sha+"/check-runs?filter=latest&per_page=100");
  assert.equal(opts.redirect,"error");calls++;
  return Response.json(calls===1?reply():calls===2?reply(check({status:"in_progress"})):reply(check()));
 }});
 assert.equal(result.status,"ready");assert.equal(calls,3);assert.equal(pauses,2);
 await assert.rejects(waitForWorkersBuild({...options,fetchFn:async()=>Response.json(reply(check({conclusion:"failure"})))}),/PREVIEW_BUILD_FAILED/);
 await assert.rejects(waitForWorkersBuild({...options,fetchFn:async()=>Response.json(reply())}),/PREVIEW_BUILD_PENDING/);
 await assert.rejects(waitForWorkersBuild({...options,fetchFn:async()=>new Response("",{status:429})}),/rate limited/);
});
