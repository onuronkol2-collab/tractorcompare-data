/** Private metadata collection, only inside the existing Commons research lane.
 * No photo acquisition, rights approval, database writes, or publication. */
import {readFile,writeFile,rename,mkdir,open,unlink} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {planMetadataRequests} from './photo-commons-metadata-requests.mjs';
const DAY=86400000,uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const empty=()=>({version:1,cooldownUntil:0,files:{}});
export function currentLeads(coverage,ledger){
 if(!Array.isArray(coverage?.missing_models)||!Array.isArray(ledger?.candidates)||!Array.isArray(ledger?.preservedRejectionsAndHolds))throw Error('missing coverage or hold ledger');
 const targets=new Map();
 for(const m of coverage.missing_models){if(!Array.isArray(m.missingTractorIds)||!m.brand||!m.model)throw Error('invalid target');for(const id of m.missingTractorIds){if(!uuid.test(id)||targets.has(id))throw Error('invalid UUID');targets.set(id,{tractor_id:id,brand:m.brand,model:m.model,status:'published',has_approved_photo:false});}}
 if(targets.size!==coverage.missing)throw Error('incomplete coverage');
 const held=new Set(ledger.preservedRejectionsAndHolds.map(r=>r.source));
 const leads=[];
 for(const l of ledger.candidates){if(l.previous_rejection!==undefined&&typeof l.previous_rejection!=='boolean')throw Error('invalid hold flag');if(l.previous_rejection||held.has(l.source)||!Array.isArray(l.tractorIds))continue;
 const matched=l.tractorIds.map(id=>targets.get(id)).filter(t=>t&&t.brand===l.brand&&t.model===l.model);
 if(matched.length)leads.push({...l,tractorIds:matched.map(t=>t.tractor_id),targets:matched});}
 return leads;
}
export async function collect(coverage,ledger,state,{fetchJSON,now=Date.now,limit=12,persist=async()=>{},delay=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 if(typeof fetchJSON!=='function'||state?.version!==1||!Number.isSafeInteger(state.cooldownUntil)||state.cooldownUntil<0||!state.files||Array.isArray(state.files)||!Number.isSafeInteger(limit)||limit<1||limit>50)throw Error('invalid collector configuration');
 const leads=currentLeads(coverage,ledger);const result={publicationAuthorized:false,packets:[],outcomes:[]};
 const providerPaused=state.cooldownUntil>now();
 const groups=new Map();for(const l of leads){const plan=planMetadataRequests([l],1)[0];if(!plan)continue;const k=plan.filename;if(!groups.has(k))groups.set(k,{...plan,leads:[]});groups.get(k).leads.push(l);}
 let attempts=0;
 for(const [name,plan] of groups){const key=hash(name);const prior=state.files[key];if(prior&&(!Number.isSafeInteger(prior.nextAt)||prior.nextAt<0))throw Error('invalid file checkpoint');if(prior?.nextAt>now()||providerPaused||attempts>=limit){if(prior?.status==='metadata_review_required'&&prior.snapshot){for(const lead of plan.leads)for(const target of lead.targets)result.packets.push({lead,target,snapshot:prior.snapshot,publicationAuthorized:false,cached:true});}continue;}
 attempts++;
 try{const snapshot=await fetchJSON(plan.url);const pages=snapshot?.query?.pages;if(snapshot?.error||!Array.isArray(pages)||pages.length!==1)throw Error('ambiguous Commons response');
 const page=pages[0];if(page.title?.replaceAll(' ','_')!=='File:'+name)throw Error('file mismatch');
 const status=page.missing?'source_missing':'metadata_review_required';if(!page.missing&&(!Array.isArray(page.imageinfo)||page.imageinfo.length!==1))throw Error('missing imageinfo');
 if(!page.missing){if(JSON.stringify(snapshot).length>1024*1024)throw Error('snapshot cap');for(const lead of plan.leads)for(const target of lead.targets)result.packets.push({lead,target,snapshot,publicationAuthorized:false});}
 state.files[key]={status,nextAt:now()+14*DAY,...(!page.missing?{snapshot}: {})};result.outcomes.push({filename:name,status});
 }catch(e){const cooldown=e?.name==='CommonsCooldownError'||[429,503].includes(e?.status);const denied=[401,403].includes(e?.status)||/Commons HTTP (401|403)\b/.test(String(e?.message));const status=cooldown?'provider_cooldown':denied?'access_denied':'retryable';const retry=Number.isSafeInteger(e?.retryMs)&&e.retryMs>0?e.retryMs:DAY;const nextAt=now()+(denied?7*DAY:Math.max(DAY,retry));state.files[key]={status,nextAt};result.outcomes.push({filename:name,status});if(cooldown||denied)state.cooldownUntil=nextAt;await persist(state,result);if(cooldown||denied)break;continue;}
 await persist(state,result);await delay(2000);
 }
 return {...result,status:providerPaused?'cooldown':'completed',state};
}
async function readJSON(path){const raw=await readFile(path);if(raw.length>8*1024*1024)throw Error('input cap');return JSON.parse(raw);}
async function atomic(path,data){const tmp=path+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(tmp,path);}
async function main(){const [coverage,ledger,statePath,reportPath]=process.argv.slice(2);if(!coverage||!ledger||!statePath||!reportPath)throw Error('usage: coverage ledger state report');if(process.env.TRACTORVS_SHARED_COMMONS_LANE!=='1')throw Error('must be invoked in existing shared Commons research lane');for(const p of [statePath,reportPath])await mkdir(dirname(resolve(p)),{recursive:true,mode:0o700});const lock=await open(statePath+'.lock','wx',0o600);try{let state;try{state=await readJSON(statePath)}catch(e){if(e.code!=='ENOENT'||process.env.TRACTORVS_EXPLICIT_STATE_BOOTSTRAP!=='1')throw e;state=empty();}const {fetchCommonsJson}=await import('./photo-commons-http.mjs');const persist=async(s,r)=>{if(Buffer.byteLength(JSON.stringify(s))>8*1024*1024)throw Error('state cap; archive reviewed evidence before continuing');await atomic(statePath,s);await atomic(reportPath,r);};const r=await collect(await readJSON(coverage),await readJSON(ledger),state,{fetchJSON:fetchCommonsJson,persist});await persist(r.state,r);}finally{await lock.close();await unlink(statePath+'.lock');}}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
