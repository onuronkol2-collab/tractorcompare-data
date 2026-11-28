import test from "node:test";
import assert from "node:assert/strict";
import {browserRequiredNames,LEGACY_BROWSER_NAMES,SHARDED_BROWSER_NAMES} from "../../scripts/tractorvs-browser-checks.mjs";
import {authorization,assessOwnerEvidence,allowedSkip,conditionalSkipEvidence,pendingOwnerChecks,waitForOwnerEvidence,matchesAuthorizedPR,OWNER,OWNER_ID,WORKFLOW} from "../../scripts/tractorvs-owner-test-release-policy.mjs";
import {REPO,requiredCandidateChecks} from "../../scripts/tractorvs-protected-candidate-policy.mjs";
const head="a".repeat(40),base="b".repeat(40),now=Date.parse("2026-11-27T17:00:00Z");
const env={GITHUB_REPOSITORY:REPO,GITHUB_REF:"refs/heads/main",GITHUB_WORKFLOW_REF:REPO+"/"+WORKFLOW+"@refs/heads/main",GITHUB_ACTOR:OWNER,GITHUB_TRIGGERING_ACTOR:OWNER,GITHUB_ACTOR_ID:String(OWNER_ID),GITHUB_EVENT_NAME:"issue_comment",GITHUB_SHA:base};
const date=new Date(now).toISOString(),user={login:OWNER,id:OWNER_ID};
const event={action:"created",sender:user,issue:{number:42,pull_request:{}},comment:{id:42,body:"TRACTORVS TEST RELEASE "+head+" "+base,author_association:"OWNER",user,created_at:date,updated_at:date}};
const selection={number:42,head,base,commentId:42};
test("owner exact authorization rejects wrong actor, fork, edited/expired comment, old main, wrong workflow",()=>{
 assert.deepEqual(authorization(event,env,now),selection);
 for(const change of [{GITHUB_ACTOR:"other"},{GITHUB_TRIGGERING_ACTOR:"other"},{GITHUB_ACTOR_ID:"1"},{GITHUB_REF:"refs/heads/other"},{GITHUB_SHA:head},{GITHUB_WORKFLOW_REF:"other"},{GITHUB_EVENT_NAME:"schedule"}])assert.equal(authorization(event,{...env,...change},now),null);
 assert.equal(authorization({...event,action:"edited"},env,now),null);
 assert.equal(authorization({...event,comment:{...event.comment,user:{login:OWNER,id:1}}},env,now),null);
 assert.equal(authorization({...event,comment:{...event.comment,updated_at:"different"}},env,now),null);
 assert.equal(authorization(event,env,now+7200001),null);
});
test("legacy and full sharded matrices only; missing shard remains required",()=>{
 assert.deepEqual(browserRequiredNames([]),LEGACY_BROWSER_NAMES);
 assert.deepEqual(browserRequiredNames([{name:SHARDED_BROWSER_NAMES[0]}]),SHARDED_BROWSER_NAMES);
 assert.equal(browserRequiredNames([{name:LEGACY_BROWSER_NAMES[0]},{name:SHARDED_BROWSER_NAMES[0]}]),null);
 assert.equal(browserRequiredNames([{name:"browser-projects (fake)"}]),null);
});
function fixture(sharded){
 const runs=[],names=sharded?SHARDED_BROWSER_NAMES:LEGACY_BROWSER_NAMES,req=[...requiredCandidateChecks("sitemap").filter(r=>!r.name.startsWith("browser-projects (")),...names.map(name=>({name,appId:15368,path:".github/workflows/playwright-accessibility.yml",event:"pull_request"}))];
 const checks=req.map((r,i)=>{const id=i+1,runId=100+i;if(r.path)runs.push({id:runId,path:r.path,event:r.event,head_sha:head,repository:{full_name:REPO},head_repository:{full_name:REPO},status:"completed",conclusion:"success"});return {id,name:r.name,app:{id:r.appId},head_sha:head,status:"completed",conclusion:"success",details_url:"https://github.com/"+REPO+"/actions/runs/"+runId+"/job/"+id};});
 return {selection,checks,runs,statuses:[]};
}
test("release evidence rejects missing/failed shard, fake workflow, other failed status and added DB risk without RLS checks",()=>{
 for(const sharded of [false,true]){
  const f=fixture(sharded);assert.equal(assessOwnerEvidence(f),true);
  assert.equal(assessOwnerEvidence({...f,checks:f.checks.slice(1)}),false);
  assert.equal(assessOwnerEvidence({...f,checks:f.checks.filter(c=>c.name!==(sharded?SHARDED_BROWSER_NAMES[3]:LEGACY_BROWSER_NAMES[2]))}),false);
  assert.equal(assessOwnerEvidence({...f,runs:f.runs.slice(1)}),false);
  assert.equal(assessOwnerEvidence({...f,statuses:[{context:"unknown",state:"failure"}]}),false);
  assert.equal(assessOwnerEvidence({...f,files:[{filename:"supabase/migrations/x.sql"}]}),false);
 }
});
test("exact same repository PR only; drafts and outdated SHA rejected",()=>{
 const pr={number:42,state:"open",draft:false,user,head:{sha:head,ref:"ci/reviewed",repo:{full_name:REPO}},base:{sha:base,ref:"main",repo:{full_name:REPO}},mergeable:true,mergeable_state:"clean",changed_files:1,title:"Reviewed improvement"};
 const files=[{filename:"site/tests/x.mjs"}];assert.equal(matchesAuthorizedPR(pr,selection,files),true);
 assert.equal(matchesAuthorizedPR({...pr,draft:true},selection,files),false);
 assert.equal(matchesAuthorizedPR({...pr,title:"TEST only"},selection,files),false);
 assert.equal(matchesAuthorizedPR({...pr,head:{...pr.head,sha:base}},selection,files),false);
 assert.equal(matchesAuthorizedPR(pr,selection,[]),false);
});

// Recorded #790 failure class: successful read-only checks paired with intentional production-only skips.
test("conditional PR jobs require same successful workflow run and read-only prerequisite",()=>{
 const f=fixture(true);
 const kinds=[["tractorvs-sitemap-history","tests",["build_and_reconcile","protected_candidate"]],["tractorvs-publication-autosync","tests",["sync_public_only","protected_candidate"]],["tractorvs-forum-publication-autosync","validate",["sync","protected_candidate"]],["tractorvs-forum-translation","check",["status"]]];
 let id=2000;
 for(const [workflow,prerequisite,names] of kinds){
  const run={id:id++,path:".github/workflows/"+workflow+".yml",event:"pull_request",head_sha:head,repository:{full_name:REPO},head_repository:{full_name:REPO},status:"completed",conclusion:"success"};
  const mk=(name,conclusion)=>{const job=id++;return {id:job,name,app:{id:15368},head_sha:head,status:"completed",conclusion,details_url:"https://github.com/"+REPO+"/actions/runs/"+run.id+"/job/"+job};};
  const good=mk(prerequisite,"success");
  for(const name of names){
   const c=mk(name,"skipped");const checks=[good,c];
   assert.equal(allowedSkip(c,[run],head,checks),true);
   for(const rows of [[c],[{...good,conclusion:"failure"},c],[{...good,head_sha:base},c],[good,good,c],[{...good,details_url:good.details_url.replace("/runs/"+run.id+"/","/runs/999/")},c]])assert.equal(allowedSkip(c,[run],head,rows),false);
   for(const bad of [{...run,event:"push"},{...run,conclusion:"failure"},{...run,head_sha:base},{...run,path:".github/workflows/other.yml"},{...run,head_repository:{full_name:"other/repo"}}])assert.equal(allowedSkip(c,[bad],head,checks),false);
   assert.equal(allowedSkip({...c,name:"unknown"},[run],head,checks),false);
   assert.equal(allowedSkip({...c,app:{id:1}},[run],head,checks),false);
  }
 }
 assert.equal(assessOwnerEvidence({...f,files:[{filename:"AGENTS.md"}]}),false);
 assert.equal(assessOwnerEvidence({...f,files:[{filename:"scripts/tractorvs-publication-candidate.mjs"}]}),false);
 assert.equal(assessOwnerEvidence({...f,files:[{filename:"site/src/components/AnalyticsConsent.astro"}]}),false);
});

test("early owner TEST waits for complete evidence, then releases without hourly scheduler",async()=>{
 const sequence=[null,null,true];const pauses=[],reports=[];
 assert.equal(await waitForOwnerEvidence(async()=>sequence.shift(),{attempts:4,pause:async ms=>pauses.push(ms),report:s=>reports.push(s)}),true);
 assert.deepEqual(pauses,[30000,30000]);assert.equal(reports.length,1);
 assert.equal(await waitForOwnerEvidence(async()=>false,{pause:async()=>assert.fail("closed PR must not retry")}),false);
 await assert.rejects(waitForOwnerEvidence(async()=>{throw Error("Main changed");},{pause:async()=>assert.fail("invalid authorization must not retry")}),/Main changed/);
 await assert.rejects(waitForOwnerEvidence(async()=>null,{attempts:2,pause:async()=>{}}),/bounded wait expired/);
 await assert.rejects(waitForOwnerEvidence(async()=>undefined,{attempts:2,pause:async()=>{}}),/Invalid owner evidence result/);
 await assert.rejects(waitForOwnerEvidence(async()=>true,{attempts:41}),/Invalid owner evidence attempts/);
});
test("pending technical inventory never converts terminal checks into success",()=>{
 assert.equal(pendingOwnerChecks([]),true);
 assert.equal(pendingOwnerChecks([{status:"queued",conclusion:null}]),true);
 assert.equal(pendingOwnerChecks([{status:"completed",conclusion:"success"}]),false);
 assert.equal(pendingOwnerChecks([{status:"completed",conclusion:"neutral"}]),false);
 for(const conclusion of ["failure","cancelled","timed_out","action_required","stale","startup_failure"])assert.throws(()=>pendingOwnerChecks([{status:"completed",conclusion},{status:"in_progress"}]),/Terminal technical check/);
});

// Keep the durable operator instruction consistent with the pre-armed executor.
test("operator instructions arm TEST before completion while retaining merge gates",async()=>{
 const {readFile}=await import("node:fs/promises");
 const guide=await readFile(new URL("../../AGENTS.md",import.meta.url),"utf8");
 assert.match(guide,/PR hazır olup testler başlatıldığında/);
 assert.match(guide,/testlerin bitmesini beklemeden, salt okunur korumalı owner TEST taramasını/);
 assert.match(guide,/Merge yalnız tüm zorunlu kontroller başarılı ve yayın koşulları sağlanmışsa gerçekleşir/);
 assert.doesNotMatch(guide,/TEST kapsamında tüm kontroller başarılı olunca güvenilir repo sahibi kimliğinden exact/);
 const policy=await readFile(new URL("../../.github/workflows/tractorvs-owner-test-release.yml",import.meta.url),"utf8");
 const scan=policy.slice(policy.indexOf("  scan:"),policy.indexOf("  merge:"));
 assert.match(scan,/timeout-minutes: 45/);
 assert.doesNotMatch(scan,/APP_PRIVATE_KEY|APP_ID|secure-publisher/);
 assert.match(policy,/needs\.scan\.outputs\.ready == 'true'/);
});

 test("conditional evidence never grants permission before its originating run completes",()=>{
 const run={id:123,path:".github/workflows/tractorvs-sitemap-history.yml",event:"pull_request",head_sha:head,repository:{full_name:REPO},head_repository:{full_name:REPO},status:"in_progress",conclusion:null};
 const job=(id,name,conclusion)=>({id,name,app:{id:15368},head_sha:head,status:"completed",conclusion,details_url:"https://github.com/"+REPO+"/actions/runs/123/job/"+id});
 const good=job(1,"tests","success"),skip=job(2,"protected_candidate","skipped");
 assert.equal(conditionalSkipEvidence(skip,[run],head,[good,skip]),"pending");
 assert.equal(allowedSkip(skip,[run],head,[good,skip]),false);
 assert.equal(conditionalSkipEvidence(skip,[{...run,status:"completed",conclusion:"success"}],head,[good,skip]),"verified");
 assert.equal(conditionalSkipEvidence(skip,[{...run,status:"completed",conclusion:"failure"}],head,[good,skip]),"invalid");
 assert.equal(conditionalSkipEvidence(skip,[run],head,[skip]),"invalid");
 });

 test("permanent operator record binds shared conditional proof and exact release recovery",async()=>{
 const {readFile}=await import("node:fs/promises");
 const guide=await readFile(new URL("../../AGENTS.md",import.meta.url),"utf8");
 const doc=await readFile(new URL("../docs/release-readiness-conditional-jobs-20261128.md",import.meta.url),"utf8");
 assert.match(guide,/site\/docs\/release-readiness-conditional-jobs-20261128\.md/);
 assert.match(guide,/conditionalSkipEvidence/);
 assert.match(guide,/Kapalı fakat unmerged PR yayın sayılmaz/);
 for(const evidence of ["46117725171","46131004893","46131210132","bec88f046230f44e5b504440a16f4337c568e10b"])assert.ok(doc.includes(evidence));
 });
