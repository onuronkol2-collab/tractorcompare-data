/**
 * One-request, no-user-content connectivity check for Cloudflare M2M100.
 * Never touches the forum queue or data. No retries. No fallback.
 */
import {assertCloudflareFreePilotAllowed,CLOUDFLARE_MODEL} from "./cloudflare-m2m100.ts";
import {sameNumericFacts} from "./translation-quality.ts";
export const SMOKE_SOURCE="Bu traktörün motor gücü 75 hp ve hidrolik kaldırma kapasitesi 3000 kg'dır.";
type Fetcher=typeof fetch;

export async function runCloudflareSyntheticSmoke({
 accountId,apiToken,enabled,freePlanVerified,fetchFn=fetch
}:{
 accountId:string;apiToken:string;enabled:boolean;freePlanVerified:boolean;
 fetchFn?:Fetcher
}):Promise<{model:string;source_lang:string;target_lang:string;
 request_count:1;translated_preview:string;numeric_facts_preserved:boolean}>{
 // Both flags and credentials must be valid before ANY external request.
 assertCloudflareFreePilotAllowed({accountId,apiToken,enabled,freePlanVerified});
 const endpoint="https://api.cloudflare.com/client/v4/accounts/"+
  accountId+"/ai/run/"+CLOUDFLARE_MODEL;
 let response:Response;
 try{
  response=await fetchFn(endpoint,{
   method:"POST",
   headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiToken},
   body:JSON.stringify({text:SMOKE_SOURCE,source_lang:"tr",target_lang:"en"}),
   signal:AbortSignal.timeout(12000)
  });
 }catch{throw Error("Cloudflare synthetic check network failure")}
 // Do not return or log raw provider errors: they may expose request metadata.
 if(!response.ok)throw Error("Cloudflare synthetic check HTTP "+response.status);
 let parsed:unknown;
 try{parsed=await response.json()}catch{throw Error("Cloudflare synthetic check invalid JSON")}
 const result=parsed as {success?:boolean;result?:{translated_text?:unknown}};
 if(result?.success!==true||typeof result.result?.translated_text!=="string")
  throw Error("Cloudflare synthetic check invalid response");
 const translation=result.result.translated_text.trim();
 if(!translation||translation.length>400)
  throw Error("Cloudflare synthetic check unexpected output");
 return {
  model:CLOUDFLARE_MODEL,source_lang:"tr",target_lang:"en",request_count:1,
  translated_preview:translation,
  numeric_facts_preserved:sameNumericFacts(SMOKE_SOURCE,translation,"en")
 };
}
