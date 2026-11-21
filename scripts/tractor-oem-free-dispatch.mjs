// GitHub Actions -> private Supabase OEM collector (zero paid API calls).
// Never exposes URLs, models, excerpts, passwords or tokens in logs.
import {appendFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {assertAnonJwt} from "./tractor-research-batch.mjs";
export const COLLECTOR_URL=
 "https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/tractor-oem-free-collector";
export function validateReceipt(body){
 if(!body||body.success!==true||!Number.isSafeInteger(body.processed)||
  body.processed<0||body.processed>3||body.paid_ai_calls!==0||
  body.published!==0||body.specifications_modified!==0||
  !body.states||typeof body.states!=="object"||
  !Number.isSafeInteger(body.eligible_drafts)||
  !Number.isSafeInteger(body.trusted_urls))throw Error("Collector receipt failed safety contract.");
 const allowed=new Set(["fetched_html","pdf_pending_parse","redirect_review",
  "http_error","unsupported_type","too_large","fetch_error","robots_blocked"]);
 let sum=0;
 for(const [name,count] of Object.entries(body.states)){
  if(!allowed.has(name)||!Number.isSafeInteger(count)||count<0)
   throw Error("Collector receipt has an invalid status.");
  sum+=count;
 }
 if(sum!==body.processed)throw Error("Collector receipt count mismatch.");
 return {processed:body.processed,states:body.states,
  draft_targets:body.eligible_drafts,trusted_sources:body.trusted_urls,
  cache_hits:body.cache_hits||0,deferred:body.deferred_sources||0,
  paid_ai_calls:0,published:0};
}
export async function runFreeCollector({jwt,queueSecret,fetchFn=fetch}){
 if(!jwt||!queueSecret)throw Error("Collector Actions secrets missing.");
 assertAnonJwt(jwt);
 const result=await fetchFn(COLLECTOR_URL,{
  method:"POST",
  headers:{
   apikey:jwt,Authorization:"Bearer "+jwt,
   "x-queue-secret":queueSecret,"Content-Type":"application/json"
  },
  body:JSON.stringify({action:"collect"}),
  signal:AbortSignal.timeout(65000)
 });
 if(!result.ok)throw Error("Free collector endpoint rejected request: HTTP "+result.status);
 return validateReceipt(await result.json());
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const rec=await runFreeCollector({
   jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT,
   queueSecret:process.env.TRACTORVS_QUEUE_SECRET
  });
  const line="TractorVS FREE OEM collector: "+JSON.stringify(rec);
  console.log(line);
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
   "### Private manufacturer document collector\n\n"+
   "- Source documents requested: "+rec.processed+"\n"+
   "- Cached/already checked: "+rec.cache_hits+"\n"+
   "- Upstream draft targets: "+rec.draft_targets+"\n"+
   "- Paid AI calls: **0**; published models: **0**\n"+
   "- All technical values remain unverified and private until separate review.\n");
 }catch{
  console.error("TractorVS OEM collector stopped safely; check private endpoint/configuration.");
  process.exitCode=1;
 }
}
