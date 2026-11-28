/** Shared request budget for the existing trusted main Commons metadata lane.
 * Public counters only. The runner must serialize this lane and restore its
 * latest checkpoint. No network requests, authorization or publication here. */
import {readFile,writeFile,rename,open,unlink,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
const DAY=86400000;
export const initialBudget=()=>({version:1,provider:'commons',requests:[],cooldownUntil:0});
export function validateBudget(s){
 if(s?.version!==1||s.provider!=='commons'||!Array.isArray(s.requests)||s.requests.length>10000||s.requests.some(t=>!Number.isSafeInteger(t)||t<0)||!Number.isSafeInteger(s.cooldownUntil)||s.cooldownUntil<0)throw Error('invalid Commons budget checkpoint');
 return s;
}
export function reserveBudget(s,now,cap=120){
 validateBudget(s);if(!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(cap)||cap<1||cap>1000)throw Error('invalid budget configuration');
 if(s.requests.some(t=>t>now))throw Error('clock moved backwards: pause Commons');
 const requests=s.requests.filter(t=>t>now-DAY).sort((a,b)=>a-b);
 if(s.cooldownUntil>now)return {state:{...s,requests},allowed:false,retryMs:s.cooldownUntil-now};
 if(requests.length>=cap)return {state:{...s,requests},allowed:false,retryMs:Math.max(1,requests[requests.length-cap]+DAY-now)};
 return {state:{...s,requests:[...requests,now]},allowed:true};
}
export function pauseBudget(s,now,ms){validateBudget(s);if(!Number.isSafeInteger(now)||!Number.isSafeInteger(ms)||now<0||ms<0||!Number.isSafeInteger(now+ms))throw Error('invalid cooldown');return {...s,cooldownUntil:Math.max(s.cooldownUntil,now+ms)};}
export async function atomicBudgetUpdate(path,fn){
 const absolute=resolve(path);await mkdir(dirname(absolute),{recursive:true,mode:0o700});
 const lock=await open(absolute+'.lock','wx',0o600);let temp;
 try{const bytes=await readFile(absolute);if(bytes.length>1024*1024)throw Error('checkpoint cap');const result=fn(validateBudget(JSON.parse(bytes.toString('utf8'))));validateBudget(result.state);temp=absolute+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(result.state)+'\n',{mode:0o600,flag:'wx'});await rename(temp,absolute);temp=null;return result;}
 finally{if(temp)await unlink(temp).catch(()=>{});await lock.close();await unlink(absolute+'.lock');}
}
export async function reserveSharedCommons(now=Date.now()){
 const path=process.env.TRACTORVS_COMMONS_BUDGET_FILE;
 if(!path){if(process.env.TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET==='1')throw Error('shared Commons budget is mandatory');return {allowed:true};}
 return atomicBudgetUpdate(path,s=>reserveBudget(s,now));
}
export async function pauseSharedCommons(ms,now=Date.now()){
 const path=process.env.TRACTORVS_COMMONS_BUDGET_FILE;if(!path){if(process.env.TRACTORVS_REQUIRE_SHARED_COMMONS_BUDGET==='1')throw Error('shared Commons budget is mandatory');return;}
 await atomicBudgetUpdate(path,s=>({state:pauseBudget(s,now,ms)}));
}
