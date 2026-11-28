/** Read-only source discovery. Never downloads remote image bytes, grants rights or publishes. */
import {readFile, mkdir, writeFile, rename, open, unlink} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {planPhotoJobs,recordPhotoOutcome,emptyQueueState} from './photo-provider-queue-draft.mjs';
import {matchesPhotoFileModel} from './photo-model-identity.mjs'; // existing main dependency
const DAY=86400000;
const UA='TractorVS/1.0 (https://tractorvs.com/; public photo research)';
export const PROVIDERS=['finna','loc'];
export function buildArchiveURL(provider,{brand,model}) {
  if(typeof brand!=='string'||typeof model!=='string'||!brand.trim()||!model.trim()||brand.length>100||model.length>150)throw Error('invalid target');
  const q=`${brand} ${model}`;
  if(provider==='finna'){
    const u=new URL('https://api.finna.fi/v1/search');
    u.searchParams.set('lookfor',q);u.searchParams.set('type','AllFields');u.searchParams.set('limit','20');
    u.searchParams.append('filter[]','format:"0/Image/"');u.searchParams.append('filter[]','online_boolean:"1"');
    for(const f of ['id','title','images','imageRights','summary','subjects'])u.searchParams.append('field[]',f);
    return u;
  }
  if(provider==='loc'){
    const u=new URL('https://www.loc.gov/photos/');u.searchParams.set('q',q);u.searchParams.set('fo','json');u.searchParams.set('c','20');return u;
  }
  throw Error('unsupported provider');
}
export function retryAfter(v,now){if(!v)return 0;if(/^\d+$/.test(v)){const n=Number(v)*1000;return Number.isSafeInteger(n)?n:0;}const t=Date.parse(v);return Number.isFinite(t)?Math.max(0,t-now):0;}
function boundedString(v,max=400){return typeof v==='string'?v.slice(0,max):'';}
function locPage(v){try{const u=new URL(v);if(u.protocol==='https:'&&['www.loc.gov','loc.gov'].includes(u.hostname)&&!u.username&&!u.password&&!u.port&&u.pathname.startsWith('/item/'))return u.href;}catch{}return null;}
export function archiveLeads(provider,data,target){
  const rows=provider==='finna'?data?.records:data?.results;
  if(!Array.isArray(rows))throw Error('malformed result');
  if(provider==='finna'&&data.status!=='OK')throw Error('unexpected Finna status');
  const leads=[];
  for(const row of rows.slice(0,20)){
    if(!row||typeof row!=='object')continue;
    const title=boundedString(row.title);
    const descriptions=[row.summary,row.description,row.subjects,row.subject].flat(2).filter(v=>typeof v==='string').slice(0,30).map(v=>v.slice(0,300));
    const evidence=matchesPhotoFileModel(target.brand,target.model,title)?'title':descriptions.some(v=>matchesPhotoFileModel(target.brand,target.model,v))?'description_or_subject':null;
    if(!evidence)continue;
    const source=provider==='finna'&&typeof row.id==='string'&&row.id.length<=250?`https://finna.fi/Record/${encodeURIComponent(row.id)}`:locPage(row.id||row.url);
    if(!source)continue;
    leads.push({provider,source,title,metadataMatch:evidence,brand:target.brand,model:target.model,tractorIds:target.tractorIds,rightsClaim:boundedString(provider==='finna'?row.imageRights?.copyright:row.rights_advisory),rightsVerified:false,identityVerified:false,publishable:false});
  }
  return [...new Map(leads.map(x=>[x.source,x])).values()];
}
async function boundedJson(response){
 if(!response.headers.get('content-type')?.includes('json'))throw Error('unexpected content type');
 const cap=2*1024*1024;let total=0;const chunks=[];
 const reader=response.body?.getReader();if(!reader)throw Error('missing response body');
 try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>cap)throw Error('response cap');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function discover(coverage,initial,{now=Date.now,fetchFn=fetch,delay=ms=>new Promise(r=>setTimeout(r,ms)),onState=async()=>{},budgets={finna:8,loc:8}}={}){
 // The starting inventory comes from the existing exact-UUID coverage implementation.
 const plan=planPhotoJobs(coverage,initial,{now:now(),enabledProviders:PROVIDERS,budgets});let state=initial;
 const paused=new Set(), outcomes=[], leads=[];
 for(const target of plan.jobs){
  if(paused.has(target.provider))continue;
  const timestamp=now();let outcome={provider:target.provider,tractorIds:target.tractorIds};
  let evidence={provider:target.provider,brand:target.brand,model:target.model,tractorIds:target.tractorIds};
  let found=[];
  try{
   const url=buildArchiveURL(target.provider,target);
   const response=await fetchFn(url,{headers:{Accept:'application/json','User-Agent':UA},redirect:'error',signal:AbortSignal.timeout(20000)});
   evidence.http=response.status;
   if([429,503].includes(response.status)){
    outcome.disposition='rate_limited';outcome.retryAfterMs=Math.max(DAY,retryAfter(response.headers.get('retry-after'),timestamp));paused.add(target.provider);
   }else if([401,403].includes(response.status)){
    outcome.disposition='rate_limited';outcome.retryAfterMs=7*DAY; evidence.reason='access_denied_pause_no_evasion';paused.add(target.provider);
   }else if(!response.ok){outcome.disposition='retryable';}
   else {const data=await boundedJson(response);found=archiveLeads(target.provider,data,target);outcome.disposition=found.length?'candidate_found':'no_match';evidence.leadCount=found.length;}
  }catch(e){outcome.disposition='retryable';evidence.reason='network_or_invalid_response';paused.add(target.provider);}
  // Evidence hash binds report content, not rights or identity. Keep report with state.
  evidence.disposition=outcome.disposition;evidence.leads=found;
  outcome.evidenceRef='sha256:'+createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
  state=recordPhotoOutcome(state,outcome,{now:timestamp});outcomes.push({...evidence,evidenceRef:outcome.evidenceRef});leads.push(...found);
  await onState(state,{publicationAuthorized:false,outcomes,leads,providerPlan:plan.providers});
  await delay(2000);
 }
 return {state,report:{publicationAuthorized:false,outcomes,leads,providerPlan:plan.providers}};
}
async function atomicJSON(path,data){const tmp=path+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(tmp,path);}
async function main(){
 const [coveragePath,statePath,reportPath]=process.argv.slice(2);if(!coveragePath||!statePath||!reportPath)throw Error('usage: script coverage.json private-state.json report.json');
 for(const path of [statePath,reportPath])await mkdir(dirname(resolve(path)),{recursive:true,mode:0o700});
 const lockPath=statePath+'.lock';const lock=await open(lockPath,'wx',0o600);
 try{
  const coverage=JSON.parse(await readFile(coveragePath,'utf8'));let state;
  try{state=JSON.parse(await readFile(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state=emptyQueueState();}
  // Store state and evidence together; report is an optional derived snapshot. Never interpret an absent report as approval.
  const persist=async(s,report)=>{await atomicJSON(reportPath,report);await atomicJSON(statePath,s);};
  const result=await discover(coverage,state,{onState:persist});await persist(result.state,result.report);
  console.log(JSON.stringify({publicationAuthorized:false,attempts:result.report.outcomes.length,leads:result.report.leads.length,providers:result.report.providerPlan}));
 }finally{await lock.close();await unlink(lockPath);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
