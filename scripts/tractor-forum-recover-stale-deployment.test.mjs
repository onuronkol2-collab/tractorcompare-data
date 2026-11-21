import {test} from "node:test";
import assert from "node:assert/strict";
import {requestBoundedForumRecovery} from "./tractor-forum-recover-stale-deployment.mjs";
const repo="onuronkol2-collab/tractorcompare-data";
const now=new Date("2026-11-21T16:50:00Z");
function mock(recovery=null,recordOverrides={}){
 const calls=[];
 const record={scope:"aaufxtcvnzgavtlintiv",fingerprint:"a".repeat(64),
  public_topics:1,delivery_recovery:recovery,...recordOverrides};
 const fetchFn=async(url,options={})=>{
  calls.push({url,options});
  if(options.method==="PUT")return new Response(JSON.stringify({commit:{sha:"f".repeat(40)}}),{status:200});
  return new Response(JSON.stringify({sha:"github-blob-sha",encoding:"base64",
   content:Buffer.from(JSON.stringify(record)).toString("base64")}),{status:200});
 };
 return {calls,fetchFn};
}
const props={repo,ref:"refs/heads/main",token:"test-repo-token",now};
test("first confirmed visibility failure may request a single GitHub-only build",async()=>{
 const m=mock();
 const res=await requestBoundedForumRecovery({...props,fetchFn:m.fetchFn});
 assert.equal(res.committed,true);
 assert.equal(m.calls.filter(x=>x.options.method==="PUT").length,1);
 const update=JSON.parse(m.calls.at(-1).options.body);
 assert.equal(update.branch,"main");
 const data=JSON.parse(Buffer.from(update.content,"base64").toString("utf8"));
 assert.equal(data.delivery_recovery.count,1);
 assert.equal(data.public_topics,1);
 assert.ok(!JSON.stringify(m.calls).includes("supabase.co"));
});
test("recovery cooldown and daily cap prevent repeated costly builds",async()=>{
 const recent=mock({window_start:"2026-11-21T15:45:00Z",count:1,last_attempt:"2026-11-21T15:45:00Z"});
 const a=await requestBoundedForumRecovery({...props,fetchFn:recent.fetchFn});
 assert.equal(a.reason,"recovery_cooldown");
 assert.equal(recent.calls.filter(x=>x.options.method==="PUT").length,0);
 const used=mock({window_start:"2026-11-21T08:00:00Z",count:2,last_attempt:"2026-11-21T10:00:00Z"});
 const b=await requestBoundedForumRecovery({...props,fetchFn:used.fetchFn});
 assert.equal(b.reason,"recovery_daily_cap");
 assert.equal(used.calls.filter(x=>x.options.method==="PUT").length,0);
});
test("unknown provenance and non-main refs never trigger a commit",async()=>{
 const m=mock();
 await assert.rejects(requestBoundedForumRecovery({...props,ref:"refs/heads/feature",fetchFn:m.fetchFn}),/only/);
 const wrong=mock(null,{scope:"other-project"});
 await assert.rejects(requestBoundedForumRecovery({...props,fetchFn:wrong.fetchFn}),/provenance/);
 assert.equal(wrong.calls.filter(x=>x.options.method==="PUT").length,0);
});
