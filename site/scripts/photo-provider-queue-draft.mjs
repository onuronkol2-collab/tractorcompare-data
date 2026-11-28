/** Offline planning module. Does not fetch, grant rights, publish or mutate a DB.
 * Input must come from summarizePublishedPhotoCoverage() or equivalent verified public inventory.
 * Persist state privately with atomic writes, one writer, and an explicit retention policy.
 */
const MAX_DELAY = 30 * 24 * 60 * 60 * 1000;
const DAY = 86400000;
const HOUR = 3600000;
const providers = Object.freeze(['commons','openverse','flickr','europeana','geograph','finna','loc','manufacturer','contributor']);
const dispositions = new Set(['no_match','candidate_found','retryable','rate_limited','access_blocked','rights_rejected','identity_rejected','permission_pending']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const boundedInt=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
function safeTime(now){if(!boundedInt(now,Number.MAX_SAFE_INTEGER-MAX_DELAY))throw Error('Invalid clock');return now;}
function keyFor(id,provider){if(!uuid.test(id)||!providers.includes(provider))throw Error('Invalid queue identity');return `${id.toLowerCase()}|${provider}`;}
function stateMaps(state){
 if(state?.version!==1||!Array.isArray(state.jobs)||!Array.isArray(state.cooldowns))throw Error('Invalid queue state');
 const jobs=new Map(),cooldowns=new Map();
 for(const j of state.jobs){const k=keyFor(j.tractorId,j.provider);if(jobs.has(k)||!dispositions.has(j.disposition)||!boundedInt(j.attempts,1000000)||!boundedInt(j.nextAt,Number.MAX_SAFE_INTEGER)||!boundedInt(j.lastAt,Number.MAX_SAFE_INTEGER))throw Error('Invalid job record');jobs.set(k,j);}
 for(const c of state.cooldowns){if(!providers.includes(c.provider)||cooldowns.has(c.provider)||!boundedInt(c.until,Number.MAX_SAFE_INTEGER))throw Error('Invalid provider cooldown');cooldowns.set(c.provider,c.until);}
 return {jobs,cooldowns};
}
export const emptyQueueState=()=>({version:1,jobs:[],cooldowns:[]});
export function planPhotoJobs(coverage,state,{now,enabledProviders,budgets}){
 safeTime(now);const {jobs,cooldowns}=stateMaps(state);
 if(!Array.isArray(coverage?.missing_models)||!Array.isArray(enabledProviders)||!budgets||typeof budgets!=='object')throw Error('Incomplete queue inputs');
 const enabled=[...new Set(enabledProviders)];if(enabled.some(p=>!providers.includes(p)||!boundedInt(budgets[p],10000)))throw Error('Unknown provider or missing authorized budget');
 const seen=new Set(),items=[];
 for(const m of coverage.missing_models){if(typeof m.brand!=='string'||!m.brand.trim()||typeof m.model!=='string'||!m.model.trim()||!Array.isArray(m.missingTractorIds)||!m.missingTractorIds.length)throw Error('Invalid public missing model');
  for(const id of m.missingTractorIds){if(!uuid.test(id)||seen.has(id.toLowerCase()))throw Error('Invalid/duplicate public UUID');seen.add(id.toLowerCase());items.push({tractorId:id.toLowerCase(),brand:m.brand,model:m.model});}}
 if(coverage.missing!==items.length)throw Error('Incomplete coverage count');
 const selected=[],providerStatus=[];
 for(const provider of enabled){const until=cooldowns.get(provider)||0;if(until>now){providerStatus.push({provider,status:'cooldown',until});continue;}
  const eligible=items.map(i=>({i,j:jobs.get(keyFor(i.tractorId,provider))})).filter(({j})=>!j||(['no_match','retryable','rate_limited'].includes(j.disposition)&&j.nextAt<=now));
  // Never repeatedly inspect rejected, pending or candidate-found jobs without a separately reviewed reset/new evidence.
  // Oldest attempted job first, then stable identity. New entries precede previously attempted ones.
  eligible.sort((a,b)=>(a.j?.lastAt??-1)-(b.j?.lastAt??-1)||a.i.tractorId.localeCompare(b.i.tractorId));
  const groups=new Map();for(const {i} of eligible){const k=JSON.stringify([i.brand,i.model]);if(!groups.has(k))groups.set(k,{provider,brand:i.brand,model:i.model,tractorIds:[]});groups.get(k).tractorIds.push(i.tractorId);}
  const batch=[...groups.values()].slice(0,budgets[provider]);selected.push(...batch);providerStatus.push({provider,status:'ready',eligibleQueries:groups.size,selectedQueries:batch.length});}
 return {publicationAuthorized:false,scope:'published-missing-uuid-only',missing:items.length,jobs:selected,providers:providerStatus};
}
export function recordPhotoOutcome(state,outcome,{now}){
 safeTime(now);const {jobs,cooldowns}=stateMaps(state);
 const {provider,tractorIds,disposition,retryAfterMs,evidenceRef}=outcome||{};
 if(!providers.includes(provider)||!dispositions.has(disposition)||!Array.isArray(tractorIds)||!tractorIds.length||new Set(tractorIds.map(x=>String(x).toLowerCase())).size!==tractorIds.length)throw Error('Invalid outcome');
 if(!['retryable','rate_limited'].includes(disposition)&&(!evidenceRef||typeof evidenceRef!=='string'||evidenceRef.length>500))throw Error('Outcome evidence required');
 if(retryAfterMs!=null&&!boundedInt(retryAfterMs,Number.MAX_SAFE_INTEGER-now))throw Error('Invalid retry-after');
 // Never shorten a provider-specified cooldown. No retry loop or network in this module.
 const base=disposition==='no_match'?14*DAY:disposition==='retryable'?HOUR:disposition==='rate_limited'?DAY:0;
 for(const id of tractorIds){const k=keyFor(id,provider),prior=jobs.get(k);if(prior&&!['no_match','retryable','rate_limited'].includes(prior.disposition))throw Error('Reviewed reset required before changing held outcome');
  const attempts=(prior?.attempts||0)+1;if(attempts>1000000)throw Error('Attempt count overflow');
  const delay=Math.max(base,retryAfterMs??0,disposition==='retryable'?Math.min(DAY,HOUR*2**Math.min(5,attempts-1)):0);
  if(!Number.isSafeInteger(now+delay))throw Error('Retry time overflow');
  jobs.set(k,{tractorId:id.toLowerCase(),provider,disposition,attempts,lastAt:now,nextAt:now+delay,evidenceRef:evidenceRef??null});}
 if(disposition==='rate_limited'){const until=now+Math.max(DAY,retryAfterMs??0);cooldowns.set(provider,Math.max(cooldowns.get(provider)||0,until));}
 return {version:1,jobs:[...jobs.values()],cooldowns:[...cooldowns].map(([provider,until])=>({provider,until}))};
}
