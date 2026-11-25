// Read-only GitHub check evidence, bound to the reviewed repository and SHA.
// A successful build is necessary here, but never substitutes for served SHA.
const API="https://api.github.com/repos/onuronkol2-collab/tractorcompare-data";
const SHA=/^[a-f0-9]{40}$/;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function classifyWorkersBuild(payload,sha){
 if(typeof sha!=="string"||!SHA.test(sha)||!Array.isArray(payload?.check_runs))throw Error("Invalid Workers build evidence");
 const matches=payload.check_runs.filter(x=>x?.name==="Workers Builds: tractorvs-site"&&x?.head_sha===sha&&x?.app?.slug==="cloudflare-workers-and-pages");
 if(!matches.length)return {status:"pending",reason:"check-not-reported"};
 // REST check-runs is ordered by latest first. Explicit ID selection also
 // avoids accepting an older success after a retry on the same SHA.
 const newest=matches.reduce((best,x)=>Number(x.id)>Number(best.id)?x:best);
 if(newest.status!=="completed")return {status:"pending",reason:"build-"+newest.status};
 return newest.conclusion==="success"?{status:"ready",checkId:newest.id}:{status:"failed",reason:"build-"+newest.conclusion,checkId:newest.id};
}
export async function waitForWorkersBuild({sha,token,fetchFn=fetch,pause=sleep,attempts=36,intervalMs=15000,log=()=>{}}={}){
 if(typeof sha!=="string"||!SHA.test(sha)||!token||!Number.isInteger(attempts)||attempts<1||attempts>36||!Number.isInteger(intervalMs)||intervalMs<0||intervalMs>15000)throw Error("Invalid Workers build readiness configuration");
 for(let attempt=1;attempt<=attempts;attempt++){
  const res=await fetchFn(API+"/commits/"+sha+"/check-runs?filter=latest&per_page=100",{redirect:"error",signal:AbortSignal.timeout(12000),headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json"}});
  if(res.status===429||res.headers.get("retry-after")||res.headers.get("x-ratelimit-remaining")==="0")throw Error("GitHub check lookup rate limited; honor cooldown");
  if(!res.ok)throw Error("GitHub check lookup HTTP "+res.status);
  const result=classifyWorkersBuild(await res.json(),sha);
  log({attempt,sha,...result});
  if(result.status==="ready")return result;
  if(result.status==="failed")throw Error("PREVIEW_BUILD_FAILED: "+result.reason);
  if(attempt<attempts)await pause(intervalMs);
 }
 throw Error("PREVIEW_BUILD_PENDING: Cloudflare check did not report success; no remote image checks performed");
}
