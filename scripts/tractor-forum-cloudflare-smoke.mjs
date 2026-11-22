// Explicitly user-triggered Cloudflare M2M100 synthetic check (one request).
// Neither this script nor the endpoint reads forum user content or queue jobs.
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {appendFileSync} from "node:fs";
import {assertAnonJwt} from "./tractor-research-batch.mjs";
const URL="https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/tractor-forum-translate";
export function validateSyntheticReceipt(data){
 if(data?.success!==true||data.kind!=="synthetic_only"||
  data.model!=="@cf/meta/m2m100-1.2b"||
  data.source_lang!=="tr"||data.target_lang!=="en"||
  data.request_count!==1||
  typeof data.numeric_facts_preserved!=="boolean"||
  typeof data.translated_preview!=="string"||
  data.translated_preview.trim().length<4||
  data.translated_preview.length>400||
  /[\u0000-\u001f\u007f]/u.test(data.translated_preview))
  throw Error("Cloudflare synthetic receipt invalid");
 return {
  model:data.model,requestCount:1,
  numericFactsPreserved:data.numeric_facts_preserved,
  translatedPreview:data.translated_preview
 };
}
export async function runSyntheticOnly({jwt,secret,fetchFn=fetch}){
 if(!jwt||!secret)throw Error("Missing translation GitHub Actions secrets");
 assertAnonJwt(jwt);
 const response=await fetchFn(URL,{
  method:"POST",
  headers:{"content-type":"application/json","apikey":jwt,
   "Authorization":"Bearer "+jwt,"x-queue-secret":secret},
  body:JSON.stringify({action:"test_cloudflare_synthetic"}),
  signal:AbortSignal.timeout(25000)
 });
 if(!response.ok){
  // A non-2xx receipt is not proof that tokens, account, or quota work.
  throw Error("Cloudflare synthetic status HTTP "+response.status);
 }
 return validateSyntheticReceipt(await response.json());
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const result=await runSyntheticOnly({
   jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT,
   secret:process.env.TRACTORVS_QUEUE_SECRET
  });
  console.log("Cloudflare M2M100 one-request synthetic result "+JSON.stringify(result));
  if(process.env.GITHUB_STEP_SUMMARY){
   const summary="# TractorVS Cloudflare synthetic test (one provider request)\n\n"+
    "- Provider: `"+result.model+"`\n"+
    "- Synthetic translated preview: `"+result.translatedPreview.replaceAll("`","")+"`\n"+
    "- Original numeric facts preserved: "+result.numericFactsPreserved+"\n"+
    "- Exactly one short synthetic request; no forum content, queue changes, or publication.\n";
   appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
  }
  if(!result.numericFactsPreserved)process.exitCode=1;
 }catch(error){
  console.error("Cloudflare synthetic test failed safely: "+
   String(error?.message||"unavailable").slice(0,120));
  process.exitCode=1;
 }
}
