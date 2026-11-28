import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {REPO,requiredCandidateChecks,assertProtectedReleaseRule,evaluateCandidateChecks,trustedIndependentRun,INDEPENDENT_CONTEXT} from "../../scripts/tractorvs-protected-candidate-policy.mjs";
const head="a".repeat(40),base="b".repeat(40),now=Date.parse("2026-11-27T16:00:00Z");
const rule={id:28247144,target:"branch",source:REPO,enforcement:"active",bypass_actors:[],conditions:{ref_name:{include:["~DEFAULT_BRANCH"],exclude:[]}},rules:[{type:"deletion"},{type:"non_fast_forward"},{type:"pull_request"},{type:"required_status_checks",parameters:{strict_required_status_checks_policy:true,do_not_enforce_on_create:false,required_status_checks:[{context:"Verify AGENTS and agent instructions",integration_id:15368}]}}]};
test("reject disabled, bypassed, incomplete or wrongly targeted protection",()=>{
 assert.equal(assertProtectedReleaseRule(rule),true);
 for(const r of [{...rule,enforcement:"disabled"},{...rule,bypass_actors:[{}]},{...rule,rules:rule.rules.slice(0,3)},{...rule,conditions:{ref_name:{include:["refs/heads/other"],exclude:[]}}}])assert.throws(()=>assertProtectedReleaseRule(r));
});
function fixture(kind){
 const runs=[],checks=requiredCandidateChecks(kind).map((r,i)=>{
 const id=i+1,runId=i+100;
 if(r.path)runs.push({id:runId,path:r.path,event:r.event,head_sha:head,repository:{full_name:REPO},head_repository:{full_name:REPO}});
 return {id,name:r.name,app:{id:r.appId},head_sha:head,status:"completed",conclusion:"success",details_url:"https://github.com/"+REPO+"/actions/runs/"+runId+"/job/"+id};
 });
 const repoApi="https://api.github.com/repos/"+REPO;
 runs.push({id:999,path:".github/workflows/tractorvs-publication-independent-evidence.yml",event:"pull_request_target",head_sha:head,repository:{full_name:REPO},head_repository:{full_name:REPO},status:"completed",conclusion:"success",pull_requests:[{number:42,url:repoApi+"/pulls/42",head:{sha:head,repo:{url:repoApi}},base:{sha:base,ref:"main",repo:{url:repoApi}}}]});
 const statuses=[{context:INDEPENDENT_CONTEXT,state:"success",creator:{login:"github-actions[bot]"},target_url:"https://github.com/"+REPO+"/actions/runs/999",updated_at:new Date(now).toISOString()}];
 return {number:42,kind,sha:head,base,checks,runs,statuses,now};
}
test("all category evidence required, exact workflow origin resolves duplicate tests",()=>{
 for(const kind of ["catalog","forum","sitemap"]){
  const x=fixture(kind);assert.equal(evaluateCandidateChecks(x).state,"success");
  assert.notEqual(evaluateCandidateChecks({...x,checks:x.checks.slice(1)}).state,"success");
  assert.notEqual(evaluateCandidateChecks({...x,checks:x.checks.map((c,i)=>i?c:{...c,conclusion:"skipped"})}).state,"success");
  assert.notEqual(evaluateCandidateChecks({...x,runs:x.runs.slice(1)}).state,"success");
  assert.notEqual(evaluateCandidateChecks({...x,statuses:[]}).state,"success");
  assert.notEqual(evaluateCandidateChecks({...x,now:now+21*60000}).state,"success");
 }
});
test("all three existing writers are mutually exclusive with gated reusable path",()=>{
 for(const n of ["tractorvs-publication-autosync","tractorvs-forum-publication-autosync","tractorvs-sitemap-history"]){
  const s=readFileSync(new URL("../../.github/workflows/"+n+".yml",import.meta.url),"utf8");
  assert.match(s,/vars\.TRACTORVS_PR_ONLY_CUTOVER != 'true'/);assert.match(s,/vars\.TRACTORVS_PR_ONLY_CUTOVER == 'true'/);assert.match(s,/uses: \.\/\.github\/workflows\/tractorvs-integrated-publication-pilot\.yml/);
 }
});

test("protected release requires exact complete new browser matrix from its trusted workflow",()=>{
 const names=["browser-projects (chromium, chromium, 1/1, chromium)","browser-projects (firefox, firefox, 1/1, firefox)","browser-projects (webkit, webkit, 1/2, webkit-shard-1)","browser-projects (webkit, webkit, 2/2, webkit-shard-2)","browser-projects (mobile-chromium, chromium, 1/1, mobile-chromium)"];
 const workflow=readFileSync(new URL("../../.github/workflows/playwright-accessibility.yml",import.meta.url),"utf8");
 const entries=[...workflow.matchAll(/- project: ([\w-]+)\n +engine: ([\w-]+)\n +shard: '(\d+\/\d+)'\n +evidence: ([\w-]+)/g)].map(m=>"browser-projects ("+m.slice(1).join(", ")+")");
 assert.deepEqual([...entries].sort(),[...names].sort());
 for(const kind of ["catalog","forum","sitemap","forum-recovery"]){const x=fixture(kind);assert.deepEqual(requiredCandidateChecks(kind).filter(r=>r.name.startsWith("browser-projects (")).map(r=>r.name),names);for(const name of names){assert.notEqual(evaluateCandidateChecks({...x,checks:x.checks.filter(c=>c.name!==name)}).state,"success");assert.equal(evaluateCandidateChecks({...x,checks:x.checks.map(c=>c.name===name?{...c,conclusion:"failure"}:c)}).state,"failure");}}
});


test("limited token may omit bypass actors only on the exact owner-attested ruleset revision",()=>{
 const {bypass_actors,...limited}=rule;
 const pinned={...limited,node_id:"RRS_lACqUmVwb3NpdG9yec5W49omzgGvBGg",updated_at:"2026-11-27T19:56:36.616+03:00",current_user_can_bypass:"never"};
 assert.equal(assertProtectedReleaseRule(pinned),true);
 assert.equal(assertProtectedReleaseRule({...pinned,updated_at:"2026-11-27T16:56:36.616Z"}),true);
 for(const x of [limited,{...pinned,updated_at:"2026-11-27T20:00:00+03:00"},{...pinned,node_id:"wrong"},{...pinned,bypass_actors:null},{...pinned,bypass_actors:[{}]},{...pinned,current_user_can_bypass:"always"},{...pinned,enforcement:"disabled"},{...pinned,rules:rule.rules.slice(0,3)}])assert.throws(()=>assertProtectedReleaseRule(x));
});

test("independent target event binds exact PR head and trusted base rather than run head alone",()=>{
 const x=fixture("sitemap"),run=x.runs.at(-1),p=run.pull_requests[0],s=x.statuses[0],selection={number:42,head,base};
 assert.equal(trustedIndependentRun(s,x.runs,selection),true);
 for(const bad of [{...run,head_sha:base},{...run,pull_requests:[]},{...run,pull_requests:[{...p,number:43}]},{...run,pull_requests:[{...p,base:{...p.base,sha:head}}]},{...run,pull_requests:[{...p,base:{...p.base,ref:"other"}}]},{...run,pull_requests:[{...p,head:{...p.head,repo:{url:"https://api.github.com/repos/other/repo"}}}]},{...run,pull_requests:[p,p]},{...run,head_repository:{full_name:"other/repo"}},{...run,conclusion:"failure"},{...run,event:"workflow_run"}]){
  const runs=[...x.runs.slice(0,-1),bad];
  assert.notEqual(evaluateCandidateChecks({...x,runs}).state,"success");
 }
 assert.equal(trustedIndependentRun({...s,creator:{login:"other[bot]"}},x.runs,selection),false);
 const dispatch={...run,event:"workflow_dispatch",head_sha:base,pull_requests:[]};
 assert.equal(trustedIndependentRun(s,[dispatch],selection),true);
 assert.equal(trustedIndependentRun(s,[{...dispatch,head_sha:head}],selection),false);
 assert.notEqual(evaluateCandidateChecks({...x,now:now+21*60000}).state,"success");
});
