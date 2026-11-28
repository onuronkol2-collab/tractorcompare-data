// Trusted-main only. Automatic execution is OFF unless explicitly enabled.
import {appendFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {validateCandidateIdentity,verifyFreshPublicSnapshot} from "./tractorvs-publication-evidence.mjs";
import {verifyRecovery} from "./tractorvs-forum-recovery-evidence.mjs";
import {withAppToken,sitemapTimestamp} from "./tractorvs-integrated-publication-pilot.mjs";
import {REPO,assertProtectedReleaseRule,evaluateCandidateChecks,actionRunId} from "./tractorvs-protected-candidate-policy.mjs";
import {inspectProductionBarrier,assertProductionSettled} from "./tractorvs-production-barrier.mjs";
const bot="tractorvs-secure-publisher[bot]",root="/repos/"+REPO;
const paths={catalog:["site/src/data/public-catalog-sync.json"],forum:["site/src/data/public-forum-sync.json"],"forum-recovery":["site/src/data/public-forum-sync.json"],sitemap:["seo/sitemap-content-history.json","site/src/data/sitemap-lastmod.json"]};
const sha=x=>typeof x==="string"&&/^[a-f0-9]{40}$/.test(x);
const ok=(x,m)=>{if(!x)throw Error(m);};
export function candidateKind(pr){
 if(pr?.state!=="open"||pr.draft||pr.user?.login!==bot||pr.base?.ref!=="main"||pr.head?.repo?.full_name!==REPO||pr.base?.repo?.full_name!==REPO||!sha(pr.head.sha))return null;
 const m=pr.head.ref?.match(/^ops\/publication-candidate\/(catalog|forum|forum-recovery|sitemap)\/[a-f0-9]{12}-[a-f0-9]{16}$/);
 return m&&pr.title==="Publication candidate: "+m[1]?m[1]:null;
}
export function assertExecutionContext(env){
 ok(env.GITHUB_REPOSITORY===REPO&&env.GITHUB_REF==="refs/heads/main"&&sha(env.GITHUB_SHA)&&["schedule","workflow_dispatch"].includes(env.GITHUB_EVENT_NAME),"Untrusted executor context");
}
export function assertExecutionEnabled(env){
 assertExecutionContext(env);
 ok(env.CUTOVER_ENABLED==="true"&&env.EXECUTE_RELEASE==="true","Release execution not enabled");
}
function client(token,fetchFn=fetch){
 ok(typeof token==="string"&&token.length>0,"Missing GitHub token");
 return async(path,method="GET",body,raw=false)=>{
  const r=await fetchFn("https://api.github.com"+root+path,{method,redirect:"error",signal:AbortSignal.timeout(25000),headers:{Authorization:"Bearer "+token,Accept:raw?"application/vnd.github.raw+json":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error("GitHub API HTTP "+r.status);
  if(raw){const v=await r.text();ok(Buffer.byteLength(v)<=30000000,"Oversize candidate");return {data:v,more:false};}
  return {data:r.status===204?null:await r.json(),more:/rel="next"/.test(r.headers.get("link")??"")};
 };
}
async function pages(api,path,key){
 const out=[];
 for(let page=1;page<=5;page++){
  const {data,more}=await api(path+(path.includes("?")?"&":"?")+"per_page=100&page="+page);
  const rows=key?data?.[key]:data;ok(Array.isArray(rows),"Invalid inventory");out.push(...rows);if(!more)return out;
 }
 throw Error("Incomplete inventory");
}
const get=async(api,path)=>(await api(path)).data;
const readFile=async(api,path,ref)=>(await api("/contents/"+path+"?ref="+ref,"GET",undefined,true)).data;
const statusRunId=s=>{const m=typeof s?.target_url==="string"&&s.target_url.match(/^https:\/\/github\.com\/onuronkol2-collab\/tractorcompare-data\/actions\/runs\/([1-9][0-9]*)$/);return m&&Number.isSafeInteger(Number(m[1]))?Number(m[1]):null;};
async function currentMain(api){return (await get(api,"/git/ref/heads/main")).object?.sha;}
async function inspect(api,n,base,now=Date.now()){
 const pr=await get(api,"/pulls/"+n),kind=candidateKind(pr);
 if(!kind||pr.base.sha!==base)return {state:"blocked",reason:"Not an exact-current-base App candidate"};
 const head=pr.head.sha,commit=await get(api,"/git/commits/"+head);
 const changedFiles=await pages(api,"/pulls/"+n+"/files"),files=await Promise.all(paths[kind].map(async path=>({path,content:await readFile(api,path,head)})));
 validateCandidateIdentity({pr,commit,changedFiles,files,main:base,kind});
 const checks=await pages(api,"/commits/"+head+"/check-runs?filter=latest","check_runs"),statuses=await pages(api,"/commits/"+head+"/statuses");
 const latest=[...new Map(statuses.slice().reverse().map(s=>[s.context,s])).values()];
 const ids=[...new Set([...checks.map(actionRunId),...latest.map(statusRunId)].filter(v=>v!==null))];
 ok(ids.length<=50,"Unexpected run inventory");
 const runs=await Promise.all(ids.map(id=>get(api,"/actions/runs/"+id)));
 const decision=evaluateCandidateChecks({number:n,kind,sha:head,base,checks,statuses,runs,now});
 if(decision.state!=="success")return decision;
 const reviews=await pages(api,"/pulls/"+n+"/reviews");
 const reviewByUser=new Map(reviews.filter(r=>r.user?.login&&["APPROVED","CHANGES_REQUESTED","DISMISSED"].includes(r.state)).map(r=>[r.user.login,r.state]));
 if([...reviewByUser.values()].includes("CHANGES_REQUESTED")||pr.requested_reviewers?.length||pr.requested_teams?.length)return {state:"blocked",reason:"Outstanding review"};
 if(pr.mergeable!==true||!["clean","unstable","has_hooks"].includes(pr.mergeable_state))return {state:"pending",reason:"GitHub mergeability not confirmed"};
 const records=await Promise.all(paths[kind].map(async path=>JSON.parse(await readFile(api,path,base))));
 const submitted=files.map(f=>JSON.parse(f.content));
 const at=kind==="sitemap"?sitemapTimestamp(records[0],submitted[0],new Date(pr.created_at)):kind==="forum-recovery"?submitted[0]?.delivery_recovery?.last_attempt:submitted[0]?.generated_at;
 if(!Number.isFinite(Date.parse(at))||Date.parse(at)>now+1000||now-Date.parse(at)>20*60000)return {state:"blocked",reason:"Candidate source timestamp expired"};
 return {state:"ready",number:n,head,base,kind,previous:records[0],submitted:submitted[0]};
}
export async function mergeExact({api,writeApi,selection,check=inspect,recheckSource=async()=>{},productionBarrier=assertProductionSettled,now=Date.now()}){
 const {number,head,base,kind}=selection;
 ok(Number.isSafeInteger(number)&&number>0&&sha(head)&&sha(base)&&Object.hasOwn(paths,kind),"Invalid release selection");
 assertProtectedReleaseRule(await get(api,"/rulesets/28247144"));
 ok(await currentMain(api)===base,"Main changed");
 const candidate=await check(api,number,base,now);
 ok(candidate.state==="ready"&&candidate.head===head&&candidate.kind===kind,"Fresh exact candidate evidence unavailable");
 await recheckSource(candidate);
 // Re-read checks after the source query, before using the short-lived App token.
 const latest=await check(api,number,base,Date.now());
 ok(latest.state==="ready"&&latest.head===head&&latest.kind===kind,"Release evidence changed");
 assertProtectedReleaseRule(await get(writeApi,"/rulesets/28247144"));
 ok(await currentMain(writeApi)===base,"Main advanced before merge");
 const pr=await get(writeApi,"/pulls/"+number);
 ok(candidateKind(pr)===kind&&pr.head.sha===head&&pr.base.sha===base&&pr.mergeable===true,"PR changed before merge");
 // Strict GitHub up-to-date rule closes the base race; expected SHA closes head race.
 await productionBarrier(api,base);
 const merged=await getResult(writeApi,"/pulls/"+number+"/merge","PUT",{sha:head,merge_method:"squash",commit_title:"chore(publication): verified "+kind+" release (#"+number+")"});
 ok(merged?.merged===true&&sha(merged.sha),"Merge not confirmed");
 const final=await get(writeApi,"/pulls/"+number);
 ok(final.merged===true&&final.merge_commit_sha===merged.sha&&final.head.sha===head,"Merged PR identity not confirmed");
 return {number,head,base,kind,mergedSha:merged.sha};
}
async function getResult(api,path,method,body){return (await api(path,method,body)).data;}
async function scan(env){
 assertExecutionContext(env);
 const api=client(env.GH_TOKEN),base=env.GITHUB_SHA;
 if(await currentMain(api)!==base){console.log("Main moved; skip stale release scan");return;}
 const prs=await pages(api,"/pulls?state=open&base=main"),candidates=prs.filter(candidateKind).sort((a,b)=>a.number-b.number);
 console.log("Exact App candidate inventory: "+candidates.length);
 for(const pr of candidates){
  let result;
  try{result=await inspect(api,pr.number,base);}catch{console.log("Candidate #"+pr.number+" evidence unavailable; no merge");continue;}
  if(result.state!=="ready"){console.log("Candidate #"+pr.number+": "+result.state);continue;}
  if(env.EXECUTE_RELEASE!=="true"||env.CUTOVER_ENABLED!=="true"){console.log("Ready candidate #"+pr.number+" (read-only preview; execution disabled)");return;}
  assertProtectedReleaseRule(await get(api,"/rulesets/28247144"));
  const barrier=await inspectProductionBarrier(api,base);
  if(barrier.state!=="ready"){console.log("PRODUCTION_QA_PENDING: "+barrier.reason+"; no merge this scan");return;}
  appendFileSync(env.GITHUB_OUTPUT,["ready=true","number="+result.number,"head="+result.head,"base="+result.base,"kind="+result.kind].join("\n")+"\n");return;
 }
 console.log("No independently verified, current candidate ready for release.");
}
async function execute(env){
 assertExecutionEnabled(env);
 const selection={number:Number(env.RELEASE_PR),head:env.RELEASE_HEAD,base:env.GITHUB_SHA,kind:env.RELEASE_KIND};
 const api=client(env.GH_TOKEN);
 await assertProductionSettled(api,selection.base);
 // The App key is consumed only in this trusted-main job; no candidate code/build.
 const result=await withAppToken({...env,PILOT_AUTOMATIC:"true"},token=>mergeExact({api,writeApi:client(token),selection,recheckSource:async c=>{
  if(c.kind==="forum-recovery")await verifyRecovery({previous:c.previous,submitted:c.submitted,jwt:env.TRACTORVS_SUPABASE_ANON_JWT});
  else if(c.kind!=="sitemap")await verifyFreshPublicSnapshot({kind:c.kind,previous:c.previous,submitted:c.submitted,jwt:env.TRACTORVS_SUPABASE_ANON_JWT});
  // Sitemap has independently rendered exact-base evidence within its bounded freshness window.
 }}),{mask:v=>console.log("::add-mask::"+v)});
 appendFileSync(env.GITHUB_OUTPUT,"merged_sha="+result.mergedSha+"\n");
 console.log("Protected candidate merged and App token revoked: "+JSON.stringify(result));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(process.argv[2]==="scan")await scan(process.env);else if(process.argv[2]==="execute")await execute(process.env);else throw Error("Unknown release mode");}
 catch{console.error("Protected release stopped; no further write attempted. Inspect exact candidate and rule.");process.exitCode=1;}
}
