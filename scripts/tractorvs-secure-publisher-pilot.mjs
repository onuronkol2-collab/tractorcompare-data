import {createSign} from "node:crypto";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const REPO="onuronkol2-collab/tractorcompare-data";
export const APP_ID="5948328";
const API="https://api.github.com";
const shaOk=s=>typeof s==="string"&&/^[a-f0-9]{40}$/.test(s);
const idOk=n=>Number.isSafeInteger(n)&&n>0;
const fail=message=>{throw Error(message)};
export function assertPilotContext(env){
 if(env.GITHUB_REPOSITORY!==REPO||env.GITHUB_REF!=="refs/heads/main"||env.GITHUB_EVENT_NAME!=="workflow_dispatch")
  fail("Only explicit trusted-main pilot allowed");
 if(env.APP_ID!==APP_ID||!env.APP_PRIVATE_KEY)fail("App credential missing or unexpected ID");
}
export function appJwt(key,id=APP_ID,now=Date.now()){
 if(id!==APP_ID||!Number.isFinite(now))fail("Unexpected app identity");
 const t=Math.floor(now/1000),enc=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
 const payload=enc({alg:"RS256",typ:"JWT"})+"."+enc({iat:t-60,exp:t+480,iss:id});
 return payload+"."+createSign("RSA-SHA256").update(payload).end().sign(key).toString("base64url");
}
export async function runReadonlyPilot({env,fetchFn=fetch,mask=()=>{},now=Date.now()}){
 assertPilotContext(env);
 const jwt=appJwt(env.APP_PRIVATE_KEY,env.APP_ID,now);
 mask(jwt);
 async function request(path,credential,method="GET",body){
  const r=await fetchFn(API+path,{method,redirect:"error",signal:AbortSignal.timeout(15000),
   headers:{Authorization:"Bearer "+credential,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)fail("GitHub API rejected "+method+" "+path+" ("+r.status+")");
  return r.status===204?null:r.json();
 }
 const app=await request("/app",jwt);
 if(app?.id!==Number(APP_ID)||typeof app.slug!=="string"||!app.slug)fail("Unexpected GitHub App identity");
 const installation=await request("/repos/"+REPO+"/installation",jwt);
 if(installation.app_id!==Number(APP_ID)||!idOk(installation.id)||installation.suspended_at||installation.repository_selection!=="selected")
  fail("Unexpected installation scope");
 if(installation.permissions?.contents!=="write"||installation.permissions?.pull_requests!=="write"||installation.permissions?.metadata!=="read"||
    Object.keys(installation.permissions??{}).some(p=>!["contents","pull_requests","metadata"].includes(p)))
  fail("Unexpected installed permissions");
 let token;
 try{
  const grant=await request("/app/installations/"+installation.id+"/access_tokens",jwt,"POST",{repositories:["tractorcompare-data"],permissions:{contents:"read",pull_requests:"read"}});
  token=grant?.token;
  if(typeof token!=="string"||!token)fail("No installation token");
  mask(token);
  if(grant.permissions?.contents!=="read"||grant.permissions?.pull_requests!=="read"||Object.values(grant.permissions??{}).some(v=>v!=="read"))
   fail("Token is not strictly read only");
  const access=await request("/installation/repositories?per_page=100",token);
  if(access.total_count!==1||access.repositories?.length!==1||access.repositories[0].full_name!==REPO)fail("Token repository scope mismatch");
  const branch=await request("/repos/"+REPO+"/branches/main",token);
  if(!shaOk(branch.commit?.sha))fail("Cannot read trusted main SHA");
  return {appId:app.id,appSlug:app.slug,installationId:installation.id,main:branch.commit.sha};
 }finally{if(typeof token==="string"&&token)await request("/installation/token",token,"DELETE");}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const result=await runReadonlyPilot({env:process.env,mask:v=>console.log("::add-mask::"+v)});
  console.log("Read-only installation pilot: one repository, read-only token revoked; main SHA accessible.");
  console.log(JSON.stringify(result));
 }catch{
  console.error("Secure publisher pilot failed; inspect configuration without revealing credentials.");
  process.exitCode=1;
 }
}
