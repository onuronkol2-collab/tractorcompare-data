// Trusted-main, read-only release serialization barrier. No credential or status writes.
// The two protected release workflows already serialize through one concurrency group.
import {REPO,actionRunId} from "./tractorvs-protected-candidate-policy.mjs";
import {waitForProductionRelease} from "../site/scripts/live-release-readiness.mjs";
const workflow=".github/workflows/tractorvs-compare-live-browser-qa.yml";
const shaOk=s=>typeof s==="string"&&/^[a-f0-9]{40}$/.test(s);
const names=["release-readiness","live-browser-projects (chromium, chromium)","live-browser-projects (firefox, firefox)","live-browser-projects (webkit, webkit)","live-browser-projects (mobile-chromium, chromium)","production-browser"];
export const PRODUCTION_REQUIRED_JOBS=Object.freeze(names);
const events=new Set(["push","check_run","workflow_dispatch","issue_comment","schedule"]);
const trustedRun=(run,base)=>Number.isSafeInteger(run?.id)&&run.path===workflow&&run.head_sha===base&&run.head_branch==="main"&&run.repository?.full_name===REPO&&run.head_repository?.full_name===REPO&&events.has(run.event);
const success=j=>j?.status==="completed"&&j.conclusion==="success";
const time=s=>Date.parse(s);
const get=async(api,path)=>(await api(path)).data;
async function pages(api,path,key){
 const result=[];
 for(let page=1;page<=5;page++){
  const {data,more}=await api(path+(path.includes("?")?"&":"?")+"per_page=100&page="+page);
  if(!Array.isArray(data?.[key]))throw Error("Incomplete production proof inventory");
  result.push(...data[key]);if(!more)return result;
 }
 throw Error("Production proof pagination limit");
}
export function assessProductionBarrier({base,build,runs,jobsByRun}){
 if(!shaOk(base)||!Array.isArray(runs)||!(jobsByRun instanceof Map))throw Error("Invalid production barrier evidence");
 if(!build||build.head_sha!==base||build.name!=="Workers Builds: tractorvs-site"||build.app?.id!==85455||!success(build)||!Number.isFinite(time(build.completed_at)))return {state:"pending",reason:"Trusted current production build not complete"};
 const trusted=runs.filter(r=>trustedRun(r,base));
 // A pending/failed/skipped trigger is never evidence. For already running real
 // matrices, wait instead of creating another release which would invalidate them.
 for(const r of trusted){
  const jobs=jobsByRun.get(r.id)??[];
  if(!Array.isArray(jobs))throw Error("Invalid live job inventory");
  if(r.status!=="completed"&&jobs.some(j=>names.slice(1,-1).includes(j.name)&&j.status!=="completed"))return {state:"pending",reason:"Current production browser matrix active"};
 }
 for(const r of trusted){
  if(!success(r)||!Number.isFinite(time(r.run_started_at))||!Number.isSafeInteger(r.run_attempt)||r.run_attempt<1)continue;
  const jobs=jobsByRun.get(r.id)??[];
  // All required jobs must belong to one run and latest attempt. Never pool
  // successful projects across releases or accept a skipped aggregate.
  if(jobs.length!==names.length||jobs.some(j=>j.run_id!==r.id||j.run_attempt!==r.run_attempt||j.head_sha!==base||!names.includes(j.name)||!success(j)))continue;
  if(names.some(n=>jobs.filter(j=>j.name===n).length!==1))continue;
  const gate=jobs.find(j=>j.name==="release-readiness"),aggregate=jobs.find(j=>j.name==="production-browser");
  if(!Number.isFinite(time(gate.completed_at))||time(gate.completed_at)<time(build.completed_at)||!Number.isFinite(time(aggregate.completed_at))||time(aggregate.completed_at)<time(gate.completed_at))continue;
  return {state:"ready",runId:r.id,buildId:build.id};
 }
 return {state:"pending",reason:"Complete exact-current-release browser proof missing"};
}
export async function inspectProductionBarrier(api,base){
 if(!shaOk(base)||(await get(api,"/git/ref/heads/main")).object?.sha!==base)throw Error("Main changed before production barrier");
 const [checks,runs]=await Promise.all([
  pages(api,"/commits/"+base+"/check-runs?filter=all","check_runs"),
  pages(api,"/actions/workflows/tractorvs-compare-live-browser-qa.yml/runs?head_sha="+base+"&branch=main","workflow_runs")
 ]);
 const build=checks.filter(c=>c.name==="Workers Builds: tractorvs-site"&&c.app?.id===85455&&c.head_sha===base).sort((a,b)=>b.id-a.id)[0];
 const relevant=runs.filter(r=>trustedRun(r,base)&&(r.status!=="completed"||r.conclusion==="success"));
 if(relevant.length>30)throw Error("Excessive production proof run inventory");
 const jobsByRun=new Map();
 for(let i=0;i<relevant.length;i+=5)await Promise.all(relevant.slice(i,i+5).map(async run=>{
  // Pending events may have no jobs; all pages of actual latest-attempt jobs are read.
  jobsByRun.set(run.id,await pages(api,"/actions/runs/"+run.id+"/jobs?filter=latest","jobs"));
 }));
 const result=assessProductionBarrier({base,build,runs:relevant,jobsByRun});
 if((await get(api,"/git/ref/heads/main")).object?.sha!==base)throw Error("Main moved during production barrier");
 return result;
}
export async function assertProductionSettled(api,base,{inspect=inspectProductionBarrier,verifyServed=async()=>waitForProductionRelease({target:base,attempts:1,paths:["/tr/compare/","/tr/tractors/"]})}={}){
 const proof=await inspect(api,base);
 if(proof.state!=="ready")throw Error("PRODUCTION_QA_PENDING: "+proof.reason);
 const live=await verifyServed();
 if(live.status!=="ready"||live.expected!==base||live.observed!==base)throw Error("PRODUCTION_QA_PENDING: served release differs from base");
 if((await get(api,"/git/ref/heads/main")).object?.sha!==base)throw Error("Main changed after live proof");
 console.log("TRACTORVS_PRODUCTION_BARRIER "+JSON.stringify({base,runId:proof.runId,buildId:proof.buildId}));
 return proof;
}
export async function waitForProductionBarrier(api,base,{attempts=32,pause=ms=>new Promise(r=>setTimeout(r,ms)),inspect=inspectProductionBarrier}={}){
 if(!Number.isSafeInteger(attempts)||attempts<1||attempts>32)throw Error("Invalid barrier attempts");
 for(let i=0;i<attempts;i++){
  const result=await inspect(api,base);
  if(result.state==="ready")return result;
  if(i===0||i%4===3)console.log("PRODUCTION_QA_PENDING: "+result.reason);
  if(i+1<attempts)await pause(30000);
 }
 throw Error("PRODUCTION_QA_PENDING: bounded wait expired; no merge performed");
}
