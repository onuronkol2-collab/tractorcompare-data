/** Bounded, non-invasive fetch for read-only public photo health checks.
 * Transient 5xx may be retried, persistent errors remain failures.
 * HTTP 429/4xx are *not* evaded by alternate origins or repeated requests.
 */
const RETRYABLE=new Set([500,502,503,504]);
export async function fetchPublicImageAsset(url,{
 fetchFn=fetch,
 sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
 attempts=5,
 timeoutMs=22000,
 onRetry=()=>{},
}={}){
 if(!Number.isInteger(attempts)||attempts<1||attempts>5)
  throw Error("Invalid bounded asset retry count");
 let lastError;
 for(let i=0;i<attempts;i++){
  try{
   const response=await fetchFn(url,{signal:AbortSignal.timeout(timeoutMs),redirect:"follow"});
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(RETRYABLE.has(response.status) && i<attempts-1){
    onRetry({attempt:i+1,status:response.status,url});
   }else return {r:response,bytes,attemptsUsed:i+1};
   lastError=new Error("Transient photo HTTP "+response.status+": "+url);
  }catch(e){lastError=e;if(i<attempts-1)onRetry({attempt:i+1,error:String(e),url});}
  if(i<attempts-1)await sleep(Math.min(4000,500*2**i));
 }
 throw lastError||Error("Asset fetch failed");
}
export function publicImageMimeOk(mime,bytes){
 const type=String(mime||"").split(";")[0].trim().toLowerCase();
 if(!(bytes instanceof Uint8Array)||bytes.length<1000)return false;
 if(type==="image/jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==="image/png")return bytes.length>=8&&
  [137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x);
 if(type==="image/webp")return bytes.length>=12&&
  String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&
  String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 return false;
}
