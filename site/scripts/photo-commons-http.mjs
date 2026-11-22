/**
 * Wikimedia Commons courtesy-aware JSON fetch. Respect 429/503 Retry-After,
 * use bounded retries and stop (rather than hammering) on long cooldowns.
 * Per Wikimedia rate-limit guidance (2026): mediawiki.org/wiki/Wikimedia_APIs/Rate_limits
 */
import {requireCommonsQueryResponse} from "./photo-source-response.mjs";

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export class CommonsCooldownError extends Error {
  constructor(status,retryMs) {
    super("Commons HTTP "+status+" cooldown; further requests paused"+
      (retryMs!=null?" (Retry-After "+Math.ceil(retryMs/1000)+"s)":""));
    this.name="CommonsCooldownError";
    this.status=status;
    this.retryMs=retryMs;
  }
}

export function parseRetryAfterMs(value,now=Date.now()){
  const raw=String(value||"").trim();
  if(!raw)return null;
  if(/^\d+$/.test(raw)){
    const seconds=Number(raw);
    return Number.isFinite(seconds)?Math.ceil(seconds*1000):null;
  }
  const date=Date.parse(raw);
  if(Number.isNaN(date))return null;
  return Math.max(0,date-now);
}

export async function fetchCommonsJson(url,{
  fetchImpl=fetch,sleep=wait,now=()=>Date.now(),
  maxAttempts=3,maxWaitMs=90000,
  userAgent="TractorVS/1.0 (https://tractorvs.com/; public photo rights research)"
}={}){
  let last;
  for(let i=0;i<maxAttempts;i++){
    try{
      const response=await fetchImpl(url,{
        headers:{"User-Agent":userAgent,"Accept":"application/json"},
        signal:AbortSignal.timeout(30000)
      });
      if(response.status===429 || response.status===503){
        const supplied=parseRetryAfterMs(response.headers?.get?.("retry-after"),now());
        const cooldown=Math.max(5000,supplied??(5000*2**i));
        if(cooldown>maxWaitMs || i===maxAttempts-1)
          throw new CommonsCooldownError(response.status,cooldown);
        await sleep(cooldown);
        continue;
      }
      if(!response.ok)throw Error("Commons HTTP "+response.status);
      return requireCommonsQueryResponse(await response.json());
    }catch(e){
      if(e instanceof CommonsCooldownError)throw e;
      last=e;
      if(i<maxAttempts-1)await sleep(Math.min(20000,5000*2**i));
    }
  }
  throw last||Error("Commons API retry budget exhausted");
}
