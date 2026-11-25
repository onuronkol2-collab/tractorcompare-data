// Read-only preflight: never treat an old deployment as a content failure.
import {verifiedReleaseSha,hasReleaseSha} from "../src/lib/release-provenance.mjs";
import {resolve} from "node:path";
import {appendFileSync} from "node:fs";
import {readWorkersBuild} from "./workers-build-readiness.mjs";
import {fileURLToPath} from "node:url";
const origin="https://tractorvs.com",api="https://api.github.com/repos/onuronkol2-collab/tractorcompare-data";
export function releaseFromHtml(html){
 const m=[...String(html).matchAll(/<meta\s+name="tractorvs-release-sha"\s+content="([a-f0-9]{40})"/g)];
 return m.length===1&&hasReleaseSha(html,m[0][1])?m[0][1]:null;
}
export async function waitForProductionRelease({target,fetchFn=fetch,acceptDescendant=async()=>false,sleep=ms=>new Promise(r=>setTimeout(r,ms)),attempts=16,intervalMs=20000,paths=["/"],confirmRelease=async()=>true,log=()=>{}}={}){
 const expected=verifiedReleaseSha(target);
 if(!expected||!Number.isInteger(attempts)||attempts<1||attempts>46||!Number.isInteger(intervalMs)||intervalMs<0||intervalMs>20000)throw Error("Invalid readiness configuration");
 if(!Array.isArray(paths)||!paths.length||paths.length>10||paths.some(path=>typeof path!=="string"||!/^\/(?:[a-z0-9-]+\/)*$/.test(path)))throw Error("Invalid readiness routes");
 let observed=null,reason="unavailable";
 for(let attempt=1;attempt<=attempts;attempt++){
  let common=null,allReady=true;
  // Require one coherent, verified release across every requested public route.
  for(const path of paths){
   let res;
   try{res=await fetchFn(origin+path,{redirect:"error",signal:AbortSignal.timeout(12000),headers:{Accept:"text/html","Cache-Control":"no-cache"}});}
   catch{reason="network unavailable: "+path;allReady=false;break;}
   if(res.status===429||res.headers.get("retry-after"))throw Error("Production rate limited or Retry-After; honor cooldown");
   if(res.status===200){
    if(!/^text\/html(?:;|$)/i.test(res.headers.get("content-type")||""))throw Error("Unexpected production page MIME: "+path);
    observed=releaseFromHtml(await res.text());
    if(!observed){reason="missing or duplicate release marker: "+path;allReady=false;break;}
    if(common&&common!==observed){reason="mixed deployed versions: "+path;allReady=false;break;}
    if(!common&&observed!==expected&&!await acceptDescendant(expected,observed)){reason="different deployed version: "+path;allReady=false;break;}
    common=observed;
   }else if([404,500,502,503,504].includes(res.status)){reason="transient HTTP "+res.status+": "+path;allReady=false;break;}
   else throw Error("Unexpected production HTTP "+res.status+": "+path);
  }
  if(allReady&&common&&!await confirmRelease(common)){
   reason="trusted Workers build not ready: "+common;allReady=false;
  }
  if(allReady&&common){
   const result={status:"ready",expected,observed:common,attempt,contentChecks:0};log(result);return result;
  }
  log({status:"deployment_pending",expected,observed,attempt,reason,contentChecks:0});
  if(attempt<attempts)await sleep(intervalMs);
 }
 return {status:"deployment_pending",expected,observed,reason,contentChecks:0};
}
export function mainDescendantVerifier({fetchFn=fetch,token=""}={}){
 const positive=new Set(),notDescendants=new Set();
 async function get(path){
  const res=await fetchFn(api+path,{redirect:"error",signal:AbortSignal.timeout(12000),headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(token?{Authorization:"Bearer "+token}:{})}});
  if(!res.ok)throw Error("GitHub ancestry check unavailable: HTTP "+res.status);
  return res.json();
 }
 const ahead=(c,sha)=>c.status==="ahead"&&c.behind_by===0&&c.merge_base_commit?.sha===sha;
 return async(expected,observed)=>{
  if(!verifiedReleaseSha(expected)||!verifiedReleaseSha(observed))return false;
  const k=expected+":"+observed;if(positive.has(k))return true;
  if(notDescendants.has(k))return false;
  if(!ahead(await get("/compare/"+expected+"..."+observed),expected)){notDescendants.add(k);return false;}
  const main=verifiedReleaseSha((await get("/branches/main")).commit?.sha);
  if(!main||main!==observed&&!ahead(await get("/compare/"+observed+"..."+main),observed))return false;
  positive.add(k);return true;
 };
}
// Require the actual served SHA's trusted Cloudflare check, not a different
// preview or a successful older build. No deployment or secret writes.
export function trustedWorkersRelease({token,fetchFn=fetch}={}){
 return async sha=>{
  const result=await readWorkersBuild({sha,token,fetchFn});
  if(result.status==="failed")throw Error("PRODUCTION_BUILD_FAILED: "+result.reason);
  return result.status==="ready";
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const token=process.env.GITHUB_TOKEN||"";
  const strict=process.env.TRACTORVS_EXACT_SNAPSHOT==="true";
  const requireBuild=process.env.TRACTORVS_REQUIRE_WORKERS_BUILD==="true";
  const start=Date.now();
  const result=await waitForProductionRelease({
   target:process.argv[2],paths:process.argv.length>3?process.argv.slice(3):["/"],
   attempts:strict?1:requireBuild?46:16,
   acceptDescendant:strict?async()=>false:mainDescendantVerifier({token}),
   confirmRelease:requireBuild?trustedWorkersRelease({token}):async()=>true,
   log:row=>console.log("TRACTORVS_RELEASE_READINESS "+JSON.stringify(row))
  });
  console.log("TRACTORVS_RELEASE_TIMING "+JSON.stringify({status:result.status,elapsedMs:Date.now()-start,expected:result.expected,observed:result.observed}));
  if(result.status!=="ready"){console.error("::error::DEPLOYMENT_PENDING: requested release not visible; no content assertions performed");process.exitCode=2;}
  else if(process.env.GITHUB_OUTPUT&&requireBuild)appendFileSync(process.env.GITHUB_OUTPUT,"release_sha="+result.observed+"\n");
 }catch(e){console.error("::error::RELEASE_READINESS_BLOCKED: "+String(e.message));process.exitCode=1;}
}
