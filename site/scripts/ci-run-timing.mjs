import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
const ms=v=>typeof v==="string"?Date.parse(v):NaN;
const elapsed=(a,b)=>Number.isFinite(ms(a))&&Number.isFinite(ms(b))&&ms(b)>=ms(a)?ms(b)-ms(a):null;
const summary=values=>{
 const a=values.filter(Number.isFinite).sort((x,y)=>x-y);
 return a.length?{samples:a.length,medianMs:a[Math.ceil(a.length*.5)-1],p95Ms:a[Math.ceil(a.length*.95)-1],meanMs:a.reduce((x,y)=>x+y,0)/a.length}:null;
};
export function analyzeCiHistory(runs){
 if(!Array.isArray(runs)||runs.length>200)throw Error("Invalid run history");
 const seen=new Set(),completed=[];
 for(const run of runs){
  if(!Number.isSafeInteger(run.id)||seen.has(run.id))throw Error("Invalid or duplicate run ID");
  seen.add(run.id);
  if(run.status!=="completed")continue;
  const jobs=Array.isArray(run.jobs)?run.jobs:[];
  const knownJobs=jobs.map(j=>elapsed(j.started_at,j.completed_at));
  completed.push({id:run.id,conclusion:run.conclusion,wallMs:elapsed(run.created_at,run.updated_at),
   dispatchMs:elapsed(run.created_at,run.run_started_at),
   // Only use actual job creation timestamp, never pretend dependency wait is runner queue.
   jobQueueMs:summary(jobs.map(j=>elapsed(j.created_at,j.started_at))),
   runnerMs:jobs.length&&knownJobs.every(Number.isFinite)?knownJobs.reduce((a,b)=>a+b,0):null});
 }
 const successful=completed.filter(r=>r.conclusion==="success");
 return {completed:completed.length,successful:successful.length,wall:summary(successful.map(r=>r.wallMs)),dispatch:summary(successful.map(r=>r.dispatchMs)),runner:summary(successful.map(r=>r.runnerMs)),runs:completed};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const input=JSON.parse(readFileSync(process.argv[2],"utf8"));
 console.log(JSON.stringify(analyzeCiHistory(Array.isArray(input)?input:input.workflow_runs),null,2));
}
