import test from "node:test";
import assert from "node:assert/strict";
import {REPO,CONTEXT,REQUIRED,eligible,evaluate,completionCandidate,READINESS_WORKFLOW,readinessRunId} from "../../scripts/tractorvs-release-readiness-policy.mjs";
const sha="a".repeat(40);
const checks=()=>REQUIRED.map(([name,slug])=>({name,app:{slug},head_sha:sha,status:"completed",conclusion:"success"}));
const decide=(c=checks(),statuses=[])=>evaluate({sha,checks:c,statuses}).state;
test("all exact required checks and only documented ledger skip are accepted",()=>{
 assert.equal(decide([...checks(),{name:"build_and_reconcile",app:{slug:"github-actions"},head_sha:sha,status:"completed",conclusion:"skipped"}]),"success");
});
test("missing, pending, failed, skipped, wrong SHA and spoofed apps never pass",()=>{
 assert.equal(decide(checks().slice(1)),"pending");
 for(const conclusion of ["failure","skipped","cancelled","neutral"]){
  const c=checks();c[0].conclusion=conclusion;assert.equal(decide(c),"failure");
 }
 const c=checks();c[0].status="in_progress";c[0].conclusion=null;assert.equal(decide(c),"pending");
 const wrong=checks();wrong[0].head_sha="b".repeat(40);assert.equal(decide(wrong),"failure");
 const spoof=checks();spoof[0].app.slug="unknown";assert.equal(decide(spoof),"pending");
 assert.equal(decide([...checks(),checks()[0]]),"failure");
 assert.equal(decide(checks(),[{context:"other",state:"failure"}]),"failure");
 assert.equal(decide(checks(),[{context:CONTEXT,state:"pending"}]),"success");
});
test("only narrow same-repo trusted UI PRs are eligible",()=>{
 const pr={state:"open",draft:false,base:{ref:"main",repo:{full_name:REPO}},head:{sha,ref:"feat/ui",repo:{full_name:REPO}},user:{login:"onuronkol2-collab"},title:"UX: improve filters"};
 const f=[{filename:"site/src/components/Filter.astro",status:"modified"}];
 assert.equal(eligible(pr,f),true);
 for(const override of [{draft:true},{user:{login:"someone"}},{title:"QA only: proof"},{head:{...pr.head,repo:{full_name:"fork/repo"}}}])assert.equal(eligible({...pr,...override},f),false);
 for(const filename of [".github/workflows/site-build.yml","site/src/components/AnalyticsConsent.astro","site/src/data/models.json","supabase/migrations/change.sql"])assert.equal(eligible(pr,[...f,{filename,status:"modified"}]),false);
 assert.equal(eligible(pr,[{...f[0],status:"renamed"}]),false);
});

test("completion events must identify one exact trusted PR head",()=>{
 const run={event:"pull_request",head_repository:{full_name:REPO},head_sha:sha,pull_requests:[{number:761}]};
 assert.deepEqual(completionCandidate({workflow_run:run}),{number:761,sha});
 for(const override of [{event:"push"},{head_repository:{full_name:"fork/repo"}},{head_sha:"invalid"},{pull_requests:[]},{pull_requests:[{number:1},{number:2}]},{pull_requests:[{number:0}]}]){
  assert.equal(completionCandidate({workflow_run:{...run,...override}}),null);
 }
 const check={app:{slug:"cloudflare-workers-and-pages"},name:"Workers Builds: tractorvs-site",head_sha:sha,pull_requests:[{number:761}]};
 assert.deepEqual(completionCandidate({check_run:check}),{number:761,sha});
 assert.equal(completionCandidate({check_run:{...check,app:{slug:"github-actions"}}}),null);
 assert.equal(completionCandidate({check_run:{...check,name:"other"}}),null);
 assert.equal(completionCandidate({}),null);
});

test("readiness does not wait on its own independently verified advisory job",()=>{
 const self={id:140319714165,name:"readiness",app:{slug:"github-actions"},head_sha:sha,status:"in_progress",conclusion:null,details_url:"https://github.com/"+REPO+"/actions/runs/45942491508/job/140319714165"};
 const run={id:45942491508,path:READINESS_WORKFLOW,repository:{full_name:REPO},head_repository:{full_name:REPO},head_sha:sha,event:"pull_request_target"};
 const evaluateWith=(candidate=self,evidence=[run],other=checks())=>evaluate({sha,checks:[...other,candidate],statuses:[],advisoryRuns:evidence}).state;
 assert.equal(readinessRunId(self),run.id);
 assert.equal(evaluateWith(),"success");
 assert.equal(evaluateWith({...self,status:"completed",conclusion:"cancelled"}),"success");
 assert.equal(evaluateWith(self,[]),"pending");
 for(const evidence of [{...run,path:".github/workflows/unrelated.yml"},{...run,head_sha:"b".repeat(40)},{...run,repository:{full_name:"fork/repo"}},{...run,head_repository:{full_name:"fork/repo"}},{...run,event:"pull_request"}])assert.equal(evaluateWith(self,[evidence]),"pending");
 assert.equal(evaluateWith({...self,details_url:self.details_url.replace("/job/140319714165","/job/1")}),"pending");
 assert.equal(evaluateWith({...self,head_sha:"b".repeat(40)}),"failure");
 const failed=checks();failed[0].conclusion="failure";assert.equal(evaluateWith(self,[run],failed),"failure");
 const pending=checks();pending[0].status="in_progress";pending[0].conclusion=null;assert.equal(evaluateWith(self,[run],pending),"pending");
 assert.equal(evaluateWith(self,[run],checks().slice(1)),"pending");
});

test("advisory readiness requires every actual browser matrix shard, including both WebKit jobs",()=>{
 const names=["browser-projects (chromium, chromium, 1/1, chromium)","browser-projects (firefox, firefox, 1/1, firefox)","browser-projects (webkit, webkit, 1/2, webkit-shard-1)","browser-projects (webkit, webkit, 2/2, webkit-shard-2)","browser-projects (mobile-chromium, chromium, 1/1, mobile-chromium)"];
 assert.deepEqual(REQUIRED.filter(([n])=>n.startsWith("browser-projects (")).map(([n])=>n),names);
 for(const name of names){assert.equal(decide(checks().filter(c=>c.name!==name)),"pending");assert.equal(decide(checks().map(c=>c.name===name?{...c,conclusion:"failure"}:c)),"failure");}
});
