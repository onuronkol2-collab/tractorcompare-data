/**
 * Bounded public-site rebuild request when the independent live audit has
 * proven a published forum topic is missing from production.
 *
 * GitHub contents write only. Never changes Supabase data or author status.
 * At most 2 retries in 24 hours, and at least 2 hours between retries.
 */
import {validateScope} from "./tractor-forum-publication-autosync.mjs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const REPO="onuronkol2-collab/tractorcompare-data";
const REVISION="site/src/data/public-forum-sync.json";
const PROJECT="aaufxtcvnzgavtlintiv";
const API="https://api.github.com/repos/"+REPO+"/contents/"+REVISION;
const HOUR=60*60*1000;
export async function requestBoundedForumRecovery({
 repo,ref,token,now=new Date(),fetchFn=fetch,dryRun=false
}){
 validateScope(repo,ref);
 if(!token)throw Error("Repository-scoped GitHub token required.");
 const headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json"};
 const response=await fetchFn(API+"?ref=main",{headers,signal:AbortSignal.timeout(16000)});
 if(response.status!==200)throw Error("Cannot inspect current public forum revision: HTTP "+response.status);
 const file=await response.json();
 if(typeof file.sha!=="string"||file.encoding!=="base64"||typeof file.content!=="string")
  throw Error("Invalid public forum revision metadata.");
 const record=JSON.parse(Buffer.from(file.content.replace(/\s/g,""),"base64").toString("utf8"));
 if(record.scope!==PROJECT||typeof record.fingerprint!=="string"||!/^[a-f0-9]{64}$/.test(record.fingerprint))
  throw Error("Public forum revision provenance cannot be verified.");
 const info=record.delivery_recovery||{};
 const nowMs=now.getTime(),firstMs=Date.parse(info.window_start||"");
 const freshWindow=Number.isFinite(firstMs)&&nowMs>=firstMs&&nowMs-firstMs<24*HOUR;
 const used=freshWindow&&Number.isInteger(info.count)?info.count:0;
 const last=Date.parse(info.last_attempt||"");
 if(Number.isFinite(last)&&nowMs>=last&&nowMs-last<2*HOUR)
  return {committed:false,reason:"recovery_cooldown",used};
 if(used>=2)return {committed:false,reason:"recovery_daily_cap",used};
 if(dryRun)return {committed:false,reason:"dry_run",used};
 const payload=JSON.stringify({...record,delivery_recovery:{
  window_start:freshWindow?info.window_start:now.toISOString(),
  count:used+1,last_attempt:now.toISOString(),
  reason:"Independent live forum audit proved missing or stale public content"
 }},null,2)+"\n";
 const request={message:"chore(forum): bounded recovery build after failed live release audit",
  branch:"main",sha:file.sha,content:Buffer.from(payload).toString("base64")};
 const put=await fetchFn(API,{method:"PUT",headers:{...headers,"Content-Type":"application/json"},
  body:JSON.stringify(request),signal:AbortSignal.timeout(20000)});
 if(put.status!==200&&put.status!==201)throw Error("Forum recovery commit failed: HTTP "+put.status);
 const saved=await put.json();
 if(typeof saved?.commit?.sha!=="string")throw Error("Recovery commit was not confirmed.");
 return {committed:true,reason:"bounded_cloudflare_rebuild_requested",used:used+1,sha:saved.commit.sha};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await requestBoundedForumRecovery({
  repo:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,
  token:process.env.GITHUB_TOKEN
 });
 console.log("TRACTORVS_FORUM_RECOVERY "+JSON.stringify(result));
}
