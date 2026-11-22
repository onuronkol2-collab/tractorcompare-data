/**
 * One explicit, nine-language synthetic Cloudflare M2M100 trial.
 * Fixed public-safe sentence, max nine sequential API calls, no retry/fallback.
 * No Supabase database access; no forum queue, consent data, or publication.
 */
import {assertCloudflareFreePilotAllowed,CLOUDFLARE_MODEL} from "./cloudflare-m2m100.ts";
import {sameNumericFacts,samePhysicalUnitFacts,syntheticTractorTerminologyPresent} from "./translation-quality.ts";
import {SMOKE_SOURCE} from "./cloudflare-smoke.ts";

export const BATCH_TARGETS=[
 {locale:"en",code:"en"},{locale:"zh",code:"zh"},{locale:"hi",code:"hi"},
 {locale:"pt-br",code:"pt"},{locale:"fr",code:"fr"},{locale:"de",code:"de"},
 {locale:"ru",code:"ru"},{locale:"ja",code:"ja"},{locale:"es",code:"es"}
] as const;
type Fetcher=typeof fetch;
type BatchRow={
 locale:string;status:"ok"|"error";
 translated_preview?:string;numeric_facts_preserved?:boolean;
 physical_units_preserved?:boolean;technical_terms_present?:boolean;
 target_script_detected?:boolean|null;error?:string
};
function scriptDetected(locale:string,translated:string):boolean|null {
 if(locale==="ru")return /[А-Яа-яЁё]/u.test(translated);
 if(locale==="zh")return /[\u4e00-\u9fff]/u.test(translated);
 if(locale==="ja")return /[\u3040-\u30ff\u4e00-\u9fff]/u.test(translated);
 if(locale==="hi")return /[\u0900-\u097f]/u.test(translated);
 // Latin script alone is not evidence of the right European language.
 return null;
}
export async function runCloudflareSyntheticBatch({
 accountId,apiToken,enabled,freePlanVerified,fetchFn=fetch
}:{
 accountId:string;apiToken:string;enabled:boolean;freePlanVerified:boolean;
 fetchFn?:Fetcher
}):Promise<{model:string;source_lang:"tr";max_request_count:9;
 request_count:number;completed:boolean;results:BatchRow[]}> {
 // Validate the two independent gates BEFORE any external model calls.
 assertCloudflareFreePilotAllowed({accountId,apiToken,enabled,freePlanVerified});
 const endpoint="https://api.cloudflare.com/client/v4/accounts/"+
  accountId+"/ai/run/"+CLOUDFLARE_MODEL;
 const results:BatchRow[]=[];
 let requestCount=0;
 for(const target of BATCH_TARGETS){
  requestCount++;
  let response:Response;
  try{
   response=await fetchFn(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiToken},
    body:JSON.stringify({text:SMOKE_SOURCE,source_lang:"tr",target_lang:target.code}),
    signal:AbortSignal.timeout(10000)
   });
  }catch{
   results.push({locale:target.locale,status:"error",error:"network_or_timeout"});
   break; // No retries, no fallback and no further paid-capable calls.
  }
  if(!response.ok){
   results.push({locale:target.locale,status:"error",error:"HTTP_"+response.status});
   break;
  }
  let payload:unknown;
  try{payload=await response.json()}catch{
   results.push({locale:target.locale,status:"error",error:"invalid_json"});
   break;
  }
  const envelope=payload as {success?:boolean;result?:{translated_text?:unknown}};
  const raw=envelope?.result?.translated_text;
  if(envelope?.success!==true||typeof raw!=="string"||
     !raw.trim()||raw.trim().length>400||/[\u0000-\u001f\u007f]/u.test(raw.trim())){
   results.push({locale:target.locale,status:"error",error:"invalid_output"});
   break;
  }
  const translation=raw.trim();
  results.push({
   locale:target.locale,status:"ok",translated_preview:translation,
   numeric_facts_preserved:sameNumericFacts(SMOKE_SOURCE,translation,target.locale),
   physical_units_preserved:samePhysicalUnitFacts(SMOKE_SOURCE,translation),
   technical_terms_present:syntheticTractorTerminologyPresent(target.locale,translation),
   target_script_detected:scriptDetected(target.locale,translation)
  });
 }
 return {
  model:CLOUDFLARE_MODEL,source_lang:"tr",max_request_count:9,
  request_count:requestCount,
  completed:results.length===BATCH_TARGETS.length&&results.every(r=>r.status==="ok"),
  results
 };
}
