import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {REPO,APP_ID,assertPilotContext,appJwt} from "./tractorvs-secure-publisher-pilot.mjs";
const shaOk=v=>typeof v==="string"&&/^[a-f0-9]{40}$/.test(v);
const runOk=v=>typeof v==="string"&&/^[1-9][0-9]{0,19}$/.test(v);
const check=(ok)=>{if(!ok)throw Error("Pilot invariant failed");};
const root="/repos/"+REPO;
const slug="tractorvs-secure-publisher";
export async function runWritePilot({env,fetchFn=fetch,mask=()=>{},diagnostic=()=>{},now=Date.now()}){
 let stage="CONTEXT",status=null,token;
 try{
  assertPilotContext(env);
  check(shaOk(env.GITHUB_SHA)&&runOk(env.GITHUB_RUN_ID));
  const base=env.GITHUB_SHA, branch="ops/secure-publisher-pilot/"+env.GITHUB_RUN_ID;
  const path="site/docs/secure-publisher-pilot-"+env.GITHUB_RUN_ID+".md";
  stage="SIGN";
  const jwt=appJwt(env.APP_PRIVATE_KEY,env.APP_ID,now);mask(jwt);
  async function request(path,credential,method="GET",body,allow404=false){
   status=null;
   const r=await fetchFn("https://api.github.com"+path,{method,redirect:"error",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+credential,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
   if(allow404&&r.status===404)return null;
   if(!r.ok){status=Number.isInteger(r.status)&&r.status>=400&&r.status<=599?r.status:null;throw Error("API request failed");}
   return r.status===204?null:r.json();
  }
  stage="APP";const app=await request("/app",jwt);
  check(app.id===Number(APP_ID)&&app.slug===slug);
  stage="INSTALLATION";const installation=await request(root+"/installation",jwt);
  check(installation.app_id===Number(APP_ID)&&Number.isSafeInteger(installation.id)&&installation.id>0&&!installation.suspended_at&&installation.repository_selection==="selected");
  const perms=installation.permissions??{};
  check(perms.contents==="write"&&perms.pull_requests==="write"&&perms.metadata==="read"&&Object.keys(perms).every(k=>["contents","pull_requests","metadata"].includes(k)));
  stage="GRANT";const grant=await request("/app/installations/"+installation.id+"/access_tokens",jwt,"POST",{repositories:["tractorcompare-data"],permissions:{contents:"write",pull_requests:"write"}});
  token=grant?.token;check(typeof token==="string"&&token.length>0);mask(token);
  try{
   stage="SCOPE";check(grant.permissions?.contents==="write"&&grant.permissions?.pull_requests==="write"&&Object.entries(grant.permissions).every(([k,v])=>["contents","pull_requests","metadata"].includes(k)&&(k==="metadata"?v==="read":v==="write")));
   const access=await request("/installation/repositories?per_page=100",token);
   check(access.total_count===1&&access.repositories?.length===1&&access.repositories[0].full_name===REPO);
   stage="FRESH_BASE";const main=await request(root+"/git/ref/heads/main",token);check(main.object?.sha===base);
   stage="UNIQUE";check(await request(root+"/git/ref/heads/"+branch,token,"GET",undefined,true)===null);
   check(await request(root+"/contents/"+path+"?ref="+base,token,"GET",undefined,true)===null);
   const original=await request(root+"/git/commits/"+base,token);check(shaOk(original.tree?.sha)&&original.sha===base);
   stage="TREE";const tree=await request(root+"/git/trees",token,"POST",{base_tree:original.tree.sha,tree:[{path,mode:"100644",type:"blob",content:"# Secure publisher event pilot\n\nThis inert draft marker tests App-origin pull_request delivery only. Never merge this pilot.\n"}]});
   check(shaOk(tree.sha)&&tree.sha!==original.tree.sha);
   stage="COMMIT";const commit=await request(root+"/git/commits",token,"POST",{message:"chore: isolated secure publisher event pilot (do not merge)",tree:tree.sha,parents:[base]});check(shaOk(commit.sha));
   stage="FRESH_BASE";check((await request(root+"/git/ref/heads/main",token)).object?.sha===base);
   stage="REF";const ref=await request(root+"/git/refs",token,"POST",{ref:"refs/heads/"+branch,sha:commit.sha});
   check(ref.ref==="refs/heads/"+branch&&ref.object?.sha===commit.sha);
   stage="DIFF";const diff=await request(root+"/compare/"+base+"..."+commit.sha,token);
   check(diff.status==="ahead"&&diff.ahead_by===1&&diff.behind_by===0&&diff.files?.length===1&&diff.files[0].filename===path&&diff.files[0].status==="added");
   stage="FRESH_BASE";check((await request(root+"/git/ref/heads/main",token)).object?.sha===base);
   stage="PR";const pr=await request(root+"/pulls",token,"POST",{title:"QA only: secure publisher App event pilot (do not merge)",body:"Isolated draft PR; inert documentation marker only. Verify event delivery and close without merging.",head:branch,base:"main",draft:true,maintainer_can_modify:false});
   check(Number.isSafeInteger(pr.number)&&pr.number>0&&pr.state==="open"&&pr.draft===true&&pr.head?.sha===commit.sha&&pr.head?.ref===branch&&pr.head?.repo?.full_name===REPO&&pr.base?.ref==="main"&&pr.base?.sha===base&&pr.base?.repo?.full_name===REPO&&pr.user?.login===slug+"[bot]");
   return {number:pr.number,head:commit.sha,branch,base};
  }finally{
   const prior=stage,priorStatus=status;stage="REVOKE";
   await request("/installation/token",token,"DELETE");stage=prior;status=priorStatus;
  }
 }catch{
  diagnostic({stage,status});throw Error("Secure write pilot failed; no automatic retry or cleanup");
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const r=await runWritePilot({env:process.env,mask:v=>console.log("::add-mask::"+v),diagnostic:({stage,status})=>console.error("Write pilot diagnostic: "+stage+(status===null?"":" HTTP "+status))});
  console.log("Draft PR created by scoped App; token revoked; NEVER MERGE. "+JSON.stringify(r));
 }catch{console.error("Write pilot failed. Inspect isolated ref/PR before retrying.");process.exitCode=1;}
}
