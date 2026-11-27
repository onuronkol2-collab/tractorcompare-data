import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {candidateKind,assertExecutionEnabled,mergeExact} from "../../scripts/tractorvs-protected-release-executor.mjs";
import {assessRecovery,verifyRecovery,recoveryRecord,confirmedDeliveryDrift} from "../../scripts/tractorvs-forum-recovery-evidence.mjs";
const repo="onuronkol2-collab/tractorcompare-data",base="a".repeat(40),head="b".repeat(40),merged="c".repeat(40);
const env={GITHUB_REPOSITORY:repo,GITHUB_REF:"refs/heads/main",GITHUB_SHA:base,GITHUB_EVENT_NAME:"schedule",CUTOVER_ENABLED:"true",EXECUTE_RELEASE:"true"};
const pr={state:"open",draft:false,user:{login:"tractorvs-secure-publisher[bot]"},title:"Publication candidate: catalog",head:{sha:head,ref:"ops/publication-candidate/catalog/"+"a".repeat(12)+"-"+"b".repeat(16),repo:{full_name:repo}},base:{ref:"main",sha:base,repo:{full_name:repo}},mergeable:true};
const selection={number:42,head,base,kind:"catalog"};
const rule={id:28247144,target:"branch",source:repo,enforcement:"active",bypass_actors:[],conditions:{ref_name:{include:["~DEFAULT_BRANCH"],exclude:[]}},rules:[{type:"deletion"},{type:"non_fast_forward"},{type:"pull_request"},{type:"required_status_checks",parameters:{strict_required_status_checks_policy:true,do_not_enforce_on_create:false,required_status_checks:[{context:"Verify AGENTS and agent instructions",integration_id:15368}]}}]};
test("executor only accepts exact App candidate and explicitly enabled trusted main",()=>{
 assert.equal(candidateKind(pr),"catalog");assertExecutionEnabled(env);
 for(const p of [{...pr,draft:true},{...pr,user:{login:"owner"}},{...pr,title:"other"},{...pr,head:{...pr.head,ref:"ops/other"}}])assert.equal(candidateKind(p),null);
 for(const e of [{CUTOVER_ENABLED:"false"},{EXECUTE_RELEASE:"false"},{GITHUB_REF:"refs/heads/feature"},{GITHUB_EVENT_NAME:"pull_request"}])assert.throws(()=>assertExecutionEnabled({...env,...e}));
});
function mock({disabled=false,moved=false,stale=false,headMoved=false,mergeFailed=false,sourceFailed=false}={}){
 const writes=[];let read=0,checks=0;
 const api=async(path,method="GET",body)=>{
  if(path==="/rulesets/28247144")return {data:disabled?{...rule,enforcement:"disabled"}:rule};
  if(path==="/git/ref/heads/main")return {data:{object:{sha:moved&&++read===2?merged:base}}};
  if(path==="/pulls/42/merge"){writes.push({method,body});return {data:{merged:!mergeFailed,sha:merged}};}
  if(path==="/pulls/42")return {data:writes.length?{...pr,merged:true,merge_commit_sha:merged}:headMoved?{...pr,head:{...pr.head,sha:merged}}:pr};
  throw Error("unexpected path");
 };
 const check=async()=>({state:stale&&++checks===2?"pending":"ready",...selection});
 const recheckSource=async()=>{if(sourceFailed)throw Error("source changed");};
 return {api,writeApi:api,check,recheckSource,writes};
}
test("merge performs only exact-head squash after repeated checks and protected base",async()=>{
 const m=mock();const r=await mergeExact({...m,selection});assert.equal(r.mergedSha,merged);
 assert.equal(m.writes.length,1);assert.equal(m.writes[0].method,"PUT");assert.equal(m.writes[0].body.sha,head);assert.equal(m.writes[0].body.merge_method,"squash");
 for(const o of [{disabled:true},{moved:true},{stale:true},{headMoved:true},{sourceFailed:true}]){
  const x=mock(o);await assert.rejects(mergeExact({...x,selection}));assert.equal(x.writes.length,0);
 }
 const f=mock({mergeFailed:true});await assert.rejects(mergeExact({...f,selection}));assert.equal(f.writes.length,1);
});
const now=Date.parse("2026-11-27T16:00:00Z"),observed={fingerprint:"d".repeat(64),scope:"aaufxtcvnzgavtlintiv",source:"anon_public_forum_views",public_topics:2,indexable_topics:2,public_replies:0,public_images:0,public_rows:2},previous={...observed,generated_at:new Date(now-86400000).toISOString()};
const readPublic=async()=>observed,audit=async()=>({ok:false,errors:["Missing sitemap URL: https://tractorvs.com/forum/example/"]});
test("forum recovery requires real unchanged fingerprint and definite independent mismatch; preserves caps",async()=>{
 const input={previous,jwt:"synthetic",now,readPublic,audit};
 const proposal=await assessRecovery(input);assert.equal(proposal.delivery_recovery.count,1);assert.equal(proposal.fingerprint,previous.fingerprint);
 assert.equal(await verifyRecovery({...input,submitted:proposal}),true);
 assert.equal(await assessRecovery({...input,previous:proposal}),null);
 assert.equal(await assessRecovery({...input,readPublic:async()=>({...observed,public_rows:3})}),null);
 assert.equal(confirmedDeliveryDrift({ok:false,errors:["Live endpoint returned HTTP 403"]}),false);
 assert.equal(await assessRecovery({...input,audit:async()=>({ok:true,errors:[]})}),null);
 assert.equal(recoveryRecord({...previous,delivery_recovery:{window_start:new Date(now-4*3600000).toISOString(),last_attempt:new Date(now-3*3600000).toISOString(),count:2}},new Date(now).toISOString()),null);
 await assert.rejects(verifyRecovery({...input,submitted:{...proposal,public_topics:9}}));
 await assert.rejects(verifyRecovery({...input,submitted:proposal,now:now+21*60000}));
});
test("release credential stays in trusted merge job and watchdog recovery switches exclusively",()=>{
 const w=readFileSync(new URL("../../.github/workflows/tractorvs-protected-release-executor.yml",import.meta.url),"utf8");
 const [scan,tail]=w.split("  merge:"),[merge,live]=tail.split("  verify-live:");
 assert.doesNotMatch(scan,/APP_PRIVATE_KEY|environment: secure-publisher/);assert.match(merge,/environment: secure-publisher/);
 assert.doesNotMatch(merge,/npm ci|contents: write|pull-requests: write/);assert.doesNotMatch(live,/APP_PRIVATE_KEY/);
 const watch=readFileSync(new URL("../../.github/workflows/tractorvs-forum-live-visibility-watchdog.yml",import.meta.url),"utf8");
 assert.match(watch,/vars\.TRACTORVS_PR_ONLY_CUTOVER != 'true'/);assert.match(watch,/kind: forum-recovery/);assert.match(watch,/vars\.TRACTORVS_PR_ONLY_CUTOVER == 'true'/);
});
