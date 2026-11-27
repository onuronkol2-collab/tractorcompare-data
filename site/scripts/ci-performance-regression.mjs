import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
const valid=n=>typeof n==="number"&&Number.isFinite(n)&&n>0;
const median=values=>{const a=[...values].sort((a,b)=>a-b);const mid=Math.floor(a.length/2);return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;};
// Same inventory/environment/data fingerprints are supplied by the
// benchmark owner; this function never infers equivalence from timing alone.
export function comparePerformance({baseline,candidate,metric,thresholdPct=15}){
 if(typeof metric!=="string"||!metric||!valid(thresholdPct)||thresholdPct>100)throw Error("Invalid performance policy");
 if(!Array.isArray(baseline)||!Array.isArray(candidate)||baseline.length<3||candidate.length<3)return {status:"insufficient-samples"};
 const all=[...baseline,...candidate],keys=["scope","environment","inventory","data"];
 const same=keys.every(k=>typeof all[0]?.[k]==="string"&&all[0][k]&&all.every(r=>r[k]===all[0][k]));
 if(!same||all.some(r=>r.success!==true||r.flaky!==0||!Number.isSafeInteger(r.skipped)||r.skipped!==all[0].skipped||!valid(r.metrics?.[metric])))return {status:"incomparable"};
 const ids=all.map(r=>r.id);
 if(ids.some(id=>typeof id!=="string"||!id)||new Set(ids).size!==ids.length)return {status:"incomparable"};
 const before=median(baseline.map(r=>r.metrics[metric])),after=median(candidate.map(r=>r.metrics[metric]));
 const changePct=(after-before)/before*100;
 return {status:changePct>thresholdPct?"regression":changePct< -thresholdPct?"improvement":"within-threshold",metric,before,after,changePct,thresholdPct,baselineSamples:baseline.length,candidateSamples:candidate.length};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const result=comparePerformance(JSON.parse(readFileSync(process.argv[2],"utf8")));
 console.log(JSON.stringify(result,null,2));
 // Diagnostic only. Never replace required CI, security or release gates.
}
