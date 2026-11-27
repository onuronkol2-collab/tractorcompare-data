/**
 * Optional, bounded forum session persistence on this device.
 * Supabase Auth's browser client normally persists rotating tokens in
 * localStorage. We preserve the existing tab-scoped storage as a fallback,
 * and never store a password, email, profile or post draft persistently.
 *
 * Browser storage is JavaScript-accessible: maintain strict CSP/XSS hygiene.
 * Shared-device users can uncheck "remember me"; signing out clears both.
 */
export const FORUM_SESSION_KEY="tractorvs.forum.session.v2";
export const FORUM_ACCESS_KEY="tractorvs_forum_access";
export const FORUM_REFRESH_KEY="tractorvs_forum_refresh";
export const SESSION_MAX_AGE_MS=7*24*60*60*1000;

function nonemptyToken(value){
 return typeof value==="string"&&value.length>0&&value.length<=12000;
}
function storage(name){try{return window[name]}catch{return null}}
// A storage object may be accessible while individual operations throw
// (browser privacy policies, disabled storage, or sandboxed contexts).
function readItem(store,key){try{return store?.getItem(key)??null}catch{return null}}
function removeItem(store,key){try{store?.removeItem(key)}catch{}}
function parseSaved(raw,now=Date.now()){
 try{
  const data=JSON.parse(raw||"null");
  if(!data||data.v!==2||!nonemptyToken(data.access)||
   !nonemptyToken(data.refresh)||!Number.isFinite(data.until)||
   data.until<=now||data.until>now+SESSION_MAX_AGE_MS)return null;
  return {access:data.access,refresh:data.refresh,remember:true};
 }catch{return null}
}
export function readForumSession(){
 const durable=storage("localStorage");
 const raw=readItem(durable,FORUM_SESSION_KEY);
 const record=parseSaved(raw);
 if(!record&&raw)removeItem(durable,FORUM_SESSION_KEY);
 const tab=storage("sessionStorage");
 const access=readItem(tab,FORUM_ACCESS_KEY)||"";
 const refresh=readItem(tab,FORUM_REFRESH_KEY)||"";
 // A valid shared record wins if another tab rotated the refresh token.
 if(record)return record;
 return nonemptyToken(access)?{access,refresh:nonemptyToken(refresh)?refresh:"",remember:false}:null;
}
export function rememberForumSession(access,refresh,remember=false){
 if(!nonemptyToken(access))return false;
 const tab=storage("sessionStorage");
 try{
  tab?.setItem(FORUM_ACCESS_KEY,access);
  if(nonemptyToken(refresh))tab?.setItem(FORUM_REFRESH_KEY,refresh);
  else tab?.removeItem(FORUM_REFRESH_KEY);
 }catch{}
 const durable=storage("localStorage");
 try{
  if(remember&&nonemptyToken(refresh)){
   const current=parseSaved(readItem(durable,FORUM_SESSION_KEY));
   // Do not write identical tokens on every /auth/v1/user success: in
   // multiple open tabs, a storage event would otherwise trigger another
   // verification + write in the sibling tab, creating a feedback loop.
   if(current?.access!==access||current?.refresh!==refresh)
    durable?.setItem(FORUM_SESSION_KEY,JSON.stringify({
     v:2,access,refresh,until:Date.now()+SESSION_MAX_AGE_MS
    }));
  }else durable?.removeItem(FORUM_SESSION_KEY);
 }catch{}
 return true;
}
export function clearForumSession({persistent=true}={}){
 const tab=storage("sessionStorage");
 removeItem(tab,FORUM_ACCESS_KEY);
 removeItem(tab,FORUM_REFRESH_KEY);
 if(persistent)removeItem(storage("localStorage"),FORUM_SESSION_KEY);
}
export function isForumRemembered(){
 return Boolean(parseSaved(readItem(storage("localStorage"),FORUM_SESSION_KEY)));
}
