// Trusted-main candidate pilot. Never merges or writes production directly.
import {readFileSync,writeFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {isDeepStrictEqual} from "node:util";
import {REPO,candidatePlan,openPublicationCandidate} from "./tractorvs-publication-candidate.mjs";
import {APP_ID,assertPilotContext,appJwt} from "./tractorvs-secure-publisher-pilot.mjs";
import {fingerprintPublicViewWithBoundedRetry,guardMassUnpublish} from "./tractor-publication-autosync.mjs";
import {fingerprintPublicForum} from "./tractor-forum-publication-autosync.mjs";
import {extractPublishedUrls,significantContentDigest,auditBuiltSitemap,ROOT} from "./tractor-sitemap-history.mjs";
import {validateCandidateIdentity,verifyFreshPublicSnapshot,verifySitemapTransition} from "./tractorvs-publication-evidence.mjs";
const PATHS={catalog:["site/src/data/public-catalog-sync.json"],forum:["site/src/data/public-forum-sync.json"],sitemap:["seo/sitemap-content-history.json","site/src/data/sitemap-lastmod.json"]};
const bot="tractorvs-secure-publisher[bot]",context="TractorVS / independent publication evidence";
const ok=(v,message)=>{if(!v)throw Error(message);};
const sha=v=>typeof v==="string"&&/^[a-f0-9]{40}$/.test(v);
const validKind=k=>Object.hasOwn(PATHS,k);
const read=p=>readFileSync(join(ROOT,p),"utf8");
const json=p=>JSON.parse(read(p));
export function validateEnvironment(env,mode){
 ok(env.GITHUB_REPOSITORY===REPO&&env.GITHUB_REF==="refs/heads/main"&&sha(env.GITHUB_SHA),"Untrusted main execution");
 ok(mode==="verify"?["pull_request_target","workflow_dispatch"].includes(env.GITHUB_EVENT_NAME):env.GITHUB_EVENT_NAME==="workflow_dispatch","Unexpected event");
}
export function validatePayload(payload,kind,base){
 ok(validKind(kind)&&payload?.kind===kind&&payload.baseSha===base&&sha(base),"Candidate payload context mismatch");
 return candidatePlan({kind,baseSha:base,files:payload.files});
}
export function sitemapTimestamp(previous,history,now=new Date()){
 const times=new Set(Object.entries(history.pages??{}).filter(([u,p])=>previous.pages?.[u]?.digest!==p.digest&&p.modified!=null).map(([,p])=>p.modified));
 ok(times.size<=1,"Inconsistent sitemap change timestamp");
 return [...times][0]??now.toISOString();
}
function gh(token,fetchFn=fetch){
 ok(typeof token==="string"&&token.length>0,"Missing GitHub credential");
 return async(path,method="GET",body,raw=false)=>{
  const r=await fetchFn("https://api.github.com"+path,{method,redirect:"error",signal:AbortSignal.timeout(25000),headers:{Authorization:"Bearer "+token,Accept:raw?"application/vnd.github.raw+json":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error("GitHub request failed HTTP "+r.status);
  if(r.status===204)return null;
  if(raw){const s=await r.text();ok(Buffer.byteLength(s)<=30000000,"Oversize candidate file");return s;}
  ok(!/rel="next"/.test(r.headers.get("link")??""),"Incomplete API inventory");
  return r.json();
 };
}
const repoPath="/repos/"+REPO;
async function mainIs(api,base){ok((await api(repoPath+"/git/ref/heads/main")).object?.sha===base,"Main changed; rebuild evidence");}
export async function withAppToken(env,work,{fetchFn=fetch,mask=()=>{}}={}){
 assertPilotContext(env);
 const jwt=appJwt(env.APP_PRIVATE_KEY,env.APP_ID);mask(jwt);
 const api=gh(jwt,fetchFn),app=await api("/app"),installation=await api(repoPath+"/installation");
 ok(app.id===Number(APP_ID)&&app.slug==="tractorvs-secure-publisher"&&installation.app_id===Number(APP_ID)&&Number.isSafeInteger(installation.id)&&installation.id>0&&!installation.suspended_at&&installation.repository_selection==="selected","Unexpected App installation");
 const p=installation.permissions??{};
 ok(p.contents==="write"&&p.pull_requests==="write"&&p.metadata==="read"&&Object.keys(p).every(k=>["contents","pull_requests","metadata"].includes(k)),"Unexpected installed permissions");
 const grant=await api("/app/installations/"+installation.id+"/access_tokens","POST",{repositories:["tractorcompare-data"],permissions:{contents:"write",pull_requests:"write"}});
 const token=grant?.token;ok(typeof token==="string"&&token.length>0,"Token grant failed");mask(token);
 const scoped=gh(token,fetchFn);
 try{
  ok(grant.permissions?.contents==="write"&&grant.permissions?.pull_requests==="write"&&Object.entries(grant.permissions).every(([k,v])=>["contents","pull_requests","metadata"].includes(k)&&(k==="metadata"?v==="read":v==="write")),"Unexpected token permissions");
  const access=await scoped("/installation/repositories?per_page=100");
  ok(access.total_count===1&&access.repositories?.length===1&&access.repositories[0].full_name===REPO,"Token repository mismatch");
  return await work(token);
 }finally{await scoped("/installation/token","DELETE");}
}
function renderedPages(){
 const dist=join(ROOT,"site/dist");
 return extractPublishedUrls(dist).map(url=>[url,significantContentDigest(readFileSync(join(dist,new URL(url).pathname.slice(1),"index.html"),"utf8"),url)]);
}
async function prepare(env){
 validateEnvironment(env,"prepare");const kind=env.PILOT_KIND,base=env.GITHUB_SHA;
 ok(validKind(kind),"Unsupported candidate kind");const api=gh(env.GH_TOKEN);await mainIs(api,base);
 const before=PATHS[kind].map(path=>({path,content:read(path)}));
 let files;
 if(kind==="sitemap"){
  auditBuiltSitemap();
  files=PATHS[kind].map(path=>({path,content:read(path)}));
  if(!isDeepStrictEqual(before,files)){
   const previous=JSON.parse(before[0].content),history=JSON.parse(files[0].content);
   verifySitemapTransition({previous,history,lastmod:JSON.parse(files[1].content),renderedPages:renderedPages(),generatedAt:sitemapTimestamp(previous,history)});
  }
 }else{
  const previous=JSON.parse(before[0].content);
  const reader=kind==="catalog"?fingerprintPublicViewWithBoundedRetry:fingerprintPublicForum;
  const observed=await reader({jwt:env.TRACTORVS_SUPABASE_ANON_JWT});
  if(observed.fingerprint===previous.fingerprint)files=before;
  else{
   if(kind==="catalog")guardMassUnpublish(previous,observed);
   const submitted={...observed,generated_at:new Date().toISOString()};
   await verifyFreshPublicSnapshot({kind,previous,submitted,jwt:env.TRACTORVS_SUPABASE_ANON_JWT});
   files=[{path:PATHS[kind][0],content:JSON.stringify(submitted,null,2)+"\n"}];
  }
 }
 await mainIs(api,base);
 const changed=!isDeepStrictEqual(before,files);
 if(changed){validatePayload({kind,baseSha:base,files},kind,base);writeFileSync(env.PAYLOAD_PATH,JSON.stringify({kind,baseSha:base,files}));}
 writeFileSync(env.GITHUB_OUTPUT,"changed="+changed+"\n",{flag:"a"});
 console.log(changed?"Real public change confirmed; candidate payload prepared.":"No genuine public change; no PR will be created.");
}
async function publish(env){
 validateEnvironment(env,"publish");ok(env.PILOT_CREATE==="true","Candidate creation not authorized");
 const payload=JSON.parse(readFileSync(env.PAYLOAD_PATH,"utf8")),kind=env.PILOT_KIND,base=env.GITHUB_SHA;
 validatePayload(payload,kind,base);
 const result=await withAppToken(env,token=>openPublicationCandidate({repo:REPO,ref:env.GITHUB_REF,kind,baseSha:base,files:payload.files,token,dryRun:false}),{mask:v=>console.log("::add-mask::"+v)});
 console.log("Candidate opened; token revoked; not authorized to merge. "+JSON.stringify({number:result.number,sha:result.sha,kind}));
}
async function verify(env){
 validateEnvironment(env,"verify");const n=Number(env.PILOT_PR),api=gh(env.GH_TOKEN),base=env.GITHUB_SHA;
 ok(Number.isSafeInteger(n)&&n>0,"Invalid PR number");
 const get=()=>api(repoPath+"/pulls/"+n);
 const pr=await get(),head=pr.head?.sha;
 const kind=Object.keys(PATHS).find(k=>pr.head?.ref?.startsWith("ops/publication-candidate/"+k+"/"));
 ok(kind&&kind===env.PILOT_KIND&&pr.user?.login===bot&&pr.state==="open"&&!pr.draft&&sha(head)&&pr.head.repo.full_name===REPO&&pr.base.repo.full_name===REPO&&pr.base.ref==="main","Not an App publication candidate");
 const status=async(state,description)=>{
  const current=await get();
  ok(current.state==="open"&&current.head.sha===head&&current.base.ref==="main","Candidate changed before status");
  await api(repoPath+"/statuses/"+head,"POST",{state,context,description,target_url:"https://github.com/"+REPO+"/actions/runs/"+env.GITHUB_RUN_ID});
 };
 try{
  await mainIs(api,base);
  const commit=await api(repoPath+"/git/commits/"+head),changedFiles=await api(repoPath+"/pulls/"+n+"/files?per_page=100");
  const files=await Promise.all(PATHS[kind].map(async path=>({path,content:await api(repoPath+"/contents/"+path+"?ref="+head,"GET",undefined,true)})));
  validateCandidateIdentity({pr,commit,changedFiles,files,main:base,kind});
  if(kind==="sitemap"){
   const previous=json(PATHS[kind][0]),history=JSON.parse(files[0].content);
   verifySitemapTransition({previous,history,lastmod:JSON.parse(files[1].content),renderedPages:renderedPages(),generatedAt:sitemapTimestamp(previous,history)});
  }else await verifyFreshPublicSnapshot({kind,previous:json(PATHS[kind][0]),submitted:JSON.parse(files[0].content),jwt:env.TRACTORVS_SUPABASE_ANON_JWT});
  await mainIs(api,base);
  await status("success","Exact App candidate independently verified against current main and public source");
  console.log("Independent evidence passed for "+kind+" exact head "+head+"; no merge authorized.");
 }catch(e){
  await status("failure","Independent source or exact-base evidence failed; no automatic publication");
  throw e;
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const mode=process.argv[2];
  if(mode==="prepare")await prepare(process.env);
  else if(mode==="publish")await publish(process.env);
  else if(mode==="verify")await verify(process.env);
  else throw Error("Unknown pilot mode");
 }catch{console.error("Publication candidate pilot failed closed; inspect scope, freshness and source evidence.");process.exitCode=1;}
}
