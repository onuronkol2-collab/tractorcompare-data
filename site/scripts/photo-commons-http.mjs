/**
 * Wikimedia Commons courtesy-aware JSON fetch. Respect 429/503 Retry-After,
 * use bounded retries and stop (rather than hammering) on long cooldowns.
 * Per Wikimedia rate-limit guidance (2026): mediawiki.org/wiki/Wikimedia_APIs/Rate_limits
 */
import {requireCommonsQueryResponse} from "./photo-source-response.mjs";

import {reserveSharedCommons,pauseSharedCommons} from "./photo-shared-commons-budget.mjs";

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
    const shared=Boolean(process.env.TRACTORVS_COMMONS_BUDGET_FILE)||process.env.TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET==='1';
    if(shared){
      const reservation=await reserveSharedCommons(now());
      if(!reservation.allowed)throw new CommonsCooldownError(429,reservation.retryMs);
    }
    try{
      const response=await fetchImpl(url,{
        headers:{"User-Agent":userAgent,"Accept":"application/json"},
        signal:AbortSignal.timeout(30000)
      });
      if(response.status===429 || response.status===503){
        const supplied=parseRetryAfterMs(response.headers?.get?.("retry-after"),now());
        const cooldown=Math.max(5000,supplied??(5000*2**i));
        if(shared){await pauseSharedCommons(Math.max(86400000,cooldown),now());throw new CommonsCooldownError(response.status,Math.max(86400000,cooldown));}
        if(cooldown>maxWaitMs || i===maxAttempts-1)
          throw new CommonsCooldownError(response.status,cooldown);
        await sleep(cooldown);
        continue;
      }
      if(shared && [401,403].includes(response.status)){await pauseSharedCommons(7*86400000,now());throw new CommonsCooldownError(response.status,7*86400000);}
      if(!response.ok)throw Error("Commons HTTP "+response.status);
      const body=await response.json();
      // The Action API may also describe quota/replica-lag limits in an HTTP
      // 200 JSON "error", not only via an HTTP 429/503 response.
      const logicalCode=body?.error?.code;
      if(logicalCode==="ratelimited"||logicalCode==="maxlag"){
        const supplied=parseRetryAfterMs(response.headers?.get?.("retry-after"),now());
        const cooldown=Math.max(5000,supplied??(5000*2**i));
        if(shared){await pauseSharedCommons(Math.max(86400000,cooldown),now());throw new CommonsCooldownError(logicalCode==="maxlag"?503:429,Math.max(86400000,cooldown));}
        if(cooldown>maxWaitMs||i===maxAttempts-1)
          throw new CommonsCooldownError(logicalCode==="maxlag"?503:429,cooldown);
        await sleep(cooldown);
        continue;
      }
      return requireCommonsQueryResponse(body);
    }catch(e){
      if(e instanceof CommonsCooldownError||shared)throw e;
      last=e;
      if(i<maxAttempts-1)await sleep(Math.min(20000,5000*2**i));
    }
  }
  throw last||Error("Commons API retry budget exhausted");
}
