// Read-only preflight: never treat an old deployment as a content failure.
import {verifiedReleaseSha,hasReleaseSha} from "../src/lib/release-provenance.mjs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const origin="https://tractorvs.com",api="https://api.github.com/repos/onuronkol2-collab/tractorcompare-data";
export function releaseFromHtml(html){
 const m=[...String(html).matchAll(/<meta\s+name="tractorvs-release-sha"\s+content="([a-f0-9]{40})"/g)];
 return m.length===1&&hasReleaseSha(html,m[0][1])?m[0][1]:null;
}
export async function waitForProductionRelease({target,fetchFn=fetch,acceptDescendant=async()=>false,sleep=ms=>new Promise(r=>setTimeout(r,ms)),attempts=16,intervalMs=20000,log=()=>{}}={}){
 const expected=verifiedReleaseSha(target);
 if(!expected||!Number.isInteger(attempts)||attempts<1||attempts>16||!Number.isInteger(intervalMs)||intervalMs<0||intervalMs>20000)throw Error("Invalid readiness configuration");
 let observed=null,reason="unavailable";
 for(let attempt=1;attempt<=attempts;attempt++){
  let res;
  try{res=await fetchFn(origin+"/",{redirect:"error",signal:AbortSignal.timeout(12000),headers:{Accept:"text/html","Cache-Control":"no-cache"}});}
  catch{reason="network unavailable";}
  if(res){
   if(res.status===429||res.headers.get("retry-after"))throw Error("Production rate limited or Retry-After; honor cooldown");
   if(res.status===200){
    if(!/^text\/html(?:;|$)/i.test(res.headers.get("content-type")||""))throw Error("Unexpected production homepage MIME");
    observed=releaseFromHtml(await res.text());reason=observed?"different deployed version":"missing or duplicate release marker";
    if(observed&&(observed===expected||await acceptDescendant(expected,observed))){
     const result={status:"ready",expected,observed,attempt,contentChecks:0};log(result);return result;
    }
   }else if([404,500,502,503,504].includes(res.status)){reason="transient HTTP "+res.status;}
   else throw Error("Unexpected production HTTP "+res.status);
  }
  log({status:"deployment_pending",expected,observed,attempt,reason,contentChecks:0});
  if(attempt<attempts)await sleep(intervalMs);
 }
 return {status:"deployment_pending",expected,observed,reason,contentChecks:0};
}
export function mainDescendantVerifier({fetchFn=fetch,token=""}={}){
 const positive=new Set();
 async function get(path){
  const res=await fetchFn(api+path,{redirect:"error",signal:AbortSignal.timeout(12000),headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(token?{Authorization:"Bearer "+token}:{})}});
  if(!res.ok)throw Error("GitHub ancestry check unavailable: HTTP "+res.status);
  return res.json();
 }
 const ahead=(c,sha)=>c.status==="ahead"&&c.behind_by===0&&c.merge_base_commit?.sha===sha;
 return async(expected,observed)=>{
  if(!verifiedReleaseSha(expected)||!verifiedReleaseSha(observed))return false;
  const k=expected+":"+observed;if(positive.has(k))return true;
  if(!ahead(await get("/compare/"+expected+"..."+observed),expected))return false;
  const main=verifiedReleaseSha((await get("/branches/main")).commit?.sha);
  if(!main||main!==observed&&!ahead(await get("/compare/"+observed+"..."+main),observed))return false;
  positive.add(k);return true;
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const result=await waitForProductionRelease({target:process.argv[2],acceptDescendant:mainDescendantVerifier({token:process.env.GITHUB_TOKEN||""}),log:row=>console.log("TRACTORVS_RELEASE_READINESS "+JSON.stringify(row))});
  if(result.status!=="ready"){console.error("::error::DEPLOYMENT_PENDING: requested release not visible; no content assertions performed");process.exitCode=2;}
 }catch(e){console.error("::error::RELEASE_READINESS_BLOCKED: "+String(e.message));process.exitCode=1;}
}
