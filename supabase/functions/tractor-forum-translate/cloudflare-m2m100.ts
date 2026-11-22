/**
 * Zero-billing-risk-by-default Cloudflare M2M100 forum translation adapter.
 *
 * Requires TWO independent private gates plus private account credentials
 * before even the first AI request. Do not enable until the actual Cloudflare
 * Workers FREE plan is checked; on Workers Paid, overage CAN be chargeable.
 *
 * Translate each prose span individually to preserve Markdown boundaries.
 * This is a limited PILOT. Publication remains needs_review without an
 * independent linguistic review, even when all numeric/URL checks pass.
 *
 * Official: https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/
 */
import {markdownSpans} from "./azure-translator.ts";

type Fetcher=typeof fetch;
export const CLOUDFLARE_MODEL="@cf/meta/m2m100-1.2b";
const CODE:Record<string,string>={
 tr:"tr",en:"en",zh:"zh",hi:"hi","pt-br":"pt",
 fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"
};
const MAX_CHARS=2600;
const MAX_REQUESTS=24;
const MAX_TOTAL_MS=85000;

/**
 * This explicit gate is independent of account credentials. A production
 * deploy by itself is never permission to consume a billed AI service.
 */
export function assertCloudflareFreePilotAllowed(config:{
 accountId:string;apiToken:string;enabled:boolean;freePlanVerified:boolean;
}):void{
 if(!config.enabled||!config.freePlanVerified)
  throw Error("Cloudflare AI pilot disabled: free-plan verification required");
 if(!/^[a-f0-9]{32}$/i.test(config.accountId)||!config.apiToken.trim())
  throw Error("Cloudflare AI private credentials unavailable");
}
type Span={text:string;translate:boolean};
type Item={index:number;text:string;left:string;right:string};
function proseItems(spans:Span[]):Item[]{
 const items:Item[]=[];
 spans.forEach((part,index)=>{
  if(!part.translate||!/\p{L}/u.test(part.text))return;
  const left=/^\s*/u.exec(part.text)?.[0]||"";
  const right=/\s*$/u.exec(part.text)?.[0]||"";
  const core=part.text.slice(left.length,part.text.length-right.length);
  if(!core.trim())return;
  items.push({index,text:core,left,right});
 });
 return items;
}
export function previewCloudflareTranslation(title:string,body:string){
 if(!title.trim()||title.length>240||!body.trim()||body.length>MAX_CHARS)
  throw Error("Cloudflare M2M100 source exceeds bounded section size");
 const titleSpans=markdownSpans(title);
 const bodySpans=markdownSpans(body);
 const all=[...titleSpans,...bodySpans];
 const items=proseItems(all);
 if(!items.length||items.length>MAX_REQUESTS)
  throw Error("Cloudflare M2M100 section request budget exceeded");
 return {requests:items.length,inputCharacters:items.reduce((n,x)=>n+x.text.length,0),
  spans:all.map(x=>x.text).join(""),model:CLOUDFLARE_MODEL};
}

export async function translateCloudflareArticle({
 title,body,target,sourceLocale="tr",accountId,apiToken,
 enabled=false,freePlanVerified=false,fetchFn=fetch,timeoutMs=MAX_TOTAL_MS
}:{
 title:string;body:string;target:string;sourceLocale?:string;
 accountId:string;apiToken:string;enabled?:boolean;freePlanVerified?:boolean;
 fetchFn?:Fetcher;timeoutMs?:number;
}):Promise<{value:{title:string;body:string};model:string}>{
 assertCloudflareFreePilotAllowed({accountId,apiToken,enabled,freePlanVerified});
 const from=CODE[sourceLocale],to=CODE[target];
 if(!from||!to||from===to)throw Error("Unsupported M2M100 language pair");
 const titleSpans=markdownSpans(title),bodySpans=markdownSpans(body);
 // Verify strict limits and call count BEFORE any provider calls.
 previewCloudflareTranslation(title,body);
 const all=[...titleSpans,...bodySpans];
 const output=all.map(x=>x.text);
 const items=proseItems(all);
 const url="https://api.cloudflare.com/client/v4/accounts/"+
  accountId+"/ai/run/"+CLOUDFLARE_MODEL;
 const begin=Date.now();
 for(const part of items){
  const remaining=timeoutMs-(Date.now()-begin);
  if(remaining<3500)throw Error("Cloudflare M2M100 time budget exhausted");
  let response:Response;
  try{
   response=await fetchFn(url,{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiToken},
    body:JSON.stringify({text:part.text,source_lang:from,target_lang:to}),
    signal:AbortSignal.timeout(Math.min(remaining,9000))
   });
  }catch{throw Error("Cloudflare M2M100 timeout or network failure")}
  // No cross-provider fallback. In particular never consume paid services
  // to work around Cloudflare 403/429/quota/billing errors.
  if(!response.ok)throw Error("Cloudflare M2M100 HTTP "+response.status);
  let data:unknown;
  try{data=await response.json()}catch{throw Error("Cloudflare M2M100 response invalid JSON")}
  const envelope=data as {success?:boolean;result?:{translated_text?:unknown}};
  if(envelope?.success!==true||typeof envelope.result?.translated_text!=="string")
   throw Error("Cloudflare M2M100 translation envelope invalid");
  const translated=envelope.result.translated_text;
  if(!translated.trim()||translated.length>Math.max(part.text.length*4,180))
   throw Error("Cloudflare M2M100 translation text invalid");
  output[part.index]=part.left+translated+part.right;
 }
 const translatedTitle=output.slice(0,titleSpans.length).join("");
 const translatedBody=output.slice(titleSpans.length).join("");
 if(!translatedTitle.trim()||!translatedBody.trim())
  throw Error("Cloudflare M2M100 translation empty");
 return {value:{title:translatedTitle,body:translatedBody},model:CLOUDFLARE_MODEL};
}
