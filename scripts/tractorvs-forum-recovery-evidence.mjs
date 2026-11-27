// A recovery candidate changes only bounded delivery metadata, not public content.
import {isDeepStrictEqual} from "node:util";
import {fingerprintPublicForum} from "./tractor-forum-publication-autosync.mjs";
import {auditForumVisibility} from "./tractor-forum-live-visibility-audit.mjs";
const HOUR=3600000;
const assert=(v,m)=>{if(!v)throw Error(m);};
const reason="Independent live forum audit proved missing or stale public content";
const stamp=t=>typeof t==="string"&&Number.isFinite(Date.parse(t))&&new Date(t).toISOString()===t;
export function recoveryRecord(previous,at){
 assert(stamp(at)&&previous?.scope==="aaufxtcvnzgavtlintiv"&&previous.source==="anon_public_forum_views"&&/^[a-f0-9]{64}$/.test(previous.fingerprint??""),"Invalid recovery base");
 const info=previous.delivery_recovery??{},now=Date.parse(at),first=Date.parse(info.window_start??""),last=Date.parse(info.last_attempt??"");
 if(previous.delivery_recovery!=null)assert(stamp(info.window_start)&&stamp(info.last_attempt)&&Number.isInteger(info.count)&&info.count>=1&&info.count<=2&&first<=last&&last<=now,"Invalid previous recovery window");
 const fresh=Number.isFinite(first)&&now-first<24*HOUR;
 if(Number.isFinite(last)&&now-last<2*HOUR||fresh&&info.count>=2)return null;
 return {...previous,delivery_recovery:{window_start:fresh?info.window_start:at,count:(fresh?info.count:0)+1,last_attempt:at,reason}};
}
export function confirmedDeliveryDrift(audit){
 return audit?.ok===false&&Array.isArray(audit.errors)&&audit.errors.some(e=>typeof e==="string"&&/^(Non-indexable or hidden forum URL remains in sitemap: |Missing sitemap URL: |Public forum hub does not link published topic: |Published reply missing from live topic: |Published photo missing from live topic: )/.test(e));
}
export async function assessRecovery({previous,jwt,now=Date.now(),readPublic=fingerprintPublicForum,audit=auditForumVisibility}){
 const {generated_at,delivery_recovery,...record}=previous;
 const first=await readPublic({jwt}),second=await readPublic({jwt});
 // A real changed public fingerprint belongs to the normal forum writer.
 if(!isDeepStrictEqual(first,second)||!isDeepStrictEqual(record,second))return null;
 const proposed=recoveryRecord(previous,new Date(now).toISOString());if(!proposed)return null;
 const result=await audit({jwt});
 if(!confirmedDeliveryDrift(result))return null;
 return proposed;
}
export async function verifyRecovery({previous,submitted,jwt,now=Date.now(),readPublic=fingerprintPublicForum,audit=auditForumVisibility}){
 const at=submitted?.delivery_recovery?.last_attempt;
 assert(stamp(at)&&Date.parse(at)<=now+1000&&now-Date.parse(at)<=20*60000,"Stale recovery candidate");
 const expected=await assessRecovery({previous,jwt,now:Date.parse(at),readPublic,audit});
 assert(expected&&isDeepStrictEqual(expected,submitted),"Recovery evidence or exact metadata mismatch");
 return true;
}
