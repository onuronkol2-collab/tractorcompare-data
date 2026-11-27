import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {REPO,requiredCandidateChecks,assertProtectedReleaseRule,evaluateCandidateChecks,INDEPENDENT_CONTEXT} from "../../scripts/tractorvs-protected-candidate-policy.mjs";
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
 runs.push({id:999,path:".github/workflows/tractorvs-publication-independent-evidence.yml",event:"pull_request_target",head_sha:base,repository:{full_name:REPO},status:"completed",conclusion:"success"});
 const statuses=[{context:INDEPENDENT_CONTEXT,state:"success",creator:{login:"github-actions[bot]"},target_url:"https://github.com/"+REPO+"/actions/runs/999",updated_at:new Date(now).toISOString()}];
 return {kind,sha:head,base,checks,runs,statuses,now};
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
