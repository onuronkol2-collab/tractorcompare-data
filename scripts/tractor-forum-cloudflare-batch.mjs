// Manually dispatched nine-language synthetic check. One Edge invocation,
// at most nine short Cloudflare API requests. No queue, retry, fallback or publication.
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {appendFileSync} from "node:fs";
import {assertAnonJwt} from "./tractor-research-batch.mjs";
const URL="https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/tractor-forum-translate";
const LANGS=["en","zh","hi","pt-br","fr","de","ru","ja","es"];
export function validateBatchReceipt(data){
 if(data?.success!==true||data.kind!=="synthetic_batch_only"||
    data.model!=="@cf/meta/m2m100-1.2b"||data.source_lang!=="tr"||
    data.max_request_count!==9||!Number.isInteger(data.request_count)||
    data.request_count<1||data.request_count>9||!Array.isArray(data.results)||
    data.results.length!==data.request_count)throw Error("Cloudflare batch receipt invalid");
 const results=data.results.map((row,i)=>{
  if(row?.locale!==LANGS[i]||!["ok","error"].includes(row?.status))
   throw Error("Cloudflare batch receipt invalid");
  if(row.status==="error"){
   if(typeof row.error!=="string"||!/^(HTTP_[0-9]{3}|network_or_timeout|invalid_json|invalid_output)$/.test(row.error))
    throw Error("Cloudflare batch receipt invalid");
   return {locale:row.locale,status:"error",error:row.error};
  }
  if(typeof row.translated_preview!=="string"||row.translated_preview.trim().length<4||
     row.translated_preview.length>400||/[\u0000-\u001f\u007f]/u.test(row.translated_preview)||
     typeof row.numeric_facts_preserved!=="boolean"||
     typeof row.physical_units_preserved!=="boolean"||
     typeof row.technical_terms_present!=="boolean"||
     !(row.target_script_detected===null||typeof row.target_script_detected==="boolean"))
   throw Error("Cloudflare batch receipt invalid");
  return {
   locale:row.locale,status:"ok",translation:row.translated_preview,
   numericFactsPreserved:row.numeric_facts_preserved,
   physicalUnitsPreserved:row.physical_units_preserved,
   technicalTermsPresent:row.technical_terms_present,
   scriptDetected:row.target_script_detected
  };
 });
 if(data.completed!==(
  data.request_count===9&&results.every(r=>r.status==="ok")
 ))throw Error("Cloudflare batch receipt invalid");
 return {model:data.model,requestCount:data.request_count,completed:data.completed,results};
}
export async function runBatchOnly({jwt,secret,fetchFn=fetch}){
 if(!jwt||!secret)throw Error("Missing GitHub Actions translation credentials");
 assertAnonJwt(jwt);
 const response=await fetchFn(URL,{
  method:"POST",
  headers:{"content-type":"application/json","apikey":jwt,
   "Authorization":"Bearer "+jwt,"x-queue-secret":secret},
  body:JSON.stringify({action:"test_cloudflare_batch"}),
  signal:AbortSignal.timeout(125000)
 });
 if(!response.ok)throw Error("Cloudflare synthetic batch HTTP "+response.status);
 return validateBatchReceipt(await response.json());
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const r=await runBatchOnly({
   jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT,
   secret:process.env.TRACTORVS_QUEUE_SECRET
  });
  console.log("Cloudflare nine-language synthetic results "+JSON.stringify(r));
  if(process.env.GITHUB_STEP_SUMMARY){
   const safe=x=>String(x).replaceAll("|","\\|").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll("\n"," ");
   const rows=r.results.map(x=>"| "+x.locale+" | "+x.status+" | "+
    (x.status==="ok"?safe(x.translation):safe(x.error))+" | "+
    (x.status==="ok"?x.numericFactsPreserved:"-")+" | "+
    (x.status==="ok"?x.physicalUnitsPreserved:"-")+" | "+
    (x.status==="ok"?x.technicalTermsPresent:"-")+" | "+
    (x.status==="ok"?x.scriptDetected:"-")+" |").join("\n");
   appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    "# TractorVS: one nine-language synthetic translation trial\n\n"+
    "One fixed non-user sentence, max nine model calls; never reads or writes forum data.\n\n"+
    "| Locale | Status | Machine translation | Numbers | Units | Tractor/hydraulic terms | Target script |\n"+
    "| --- | --- | --- | --- | --- | --- | --- |\n"+rows+"\n\n"+
    "Calls attempted: "+r.requestCount+"/9. Completed: "+r.completed+
    ". Full linguistic quality not established; nothing published.\n");
  }
  if(!r.completed||r.results.some(x=>x.status!=="ok"||
    !x.numericFactsPreserved||!x.physicalUnitsPreserved||
    !x.technicalTermsPresent||x.scriptDetected===false))process.exitCode=1;
 }catch(error){
  console.error("Cloudflare synthetic batch failed safely: "+
   String(error?.message||"unavailable").slice(0,120));
  process.exitCode=1;
 }
}
