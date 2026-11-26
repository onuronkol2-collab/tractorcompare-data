import {readForumSession} from "./forum-session-store.mjs";
import {REPORT_REASONS,REPORT_TEXT} from "./forum-reporting-i18n.ts";
import type {Locale} from "./locales.ts";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const validId=(x:unknown):x is string=>typeof x==="string"&&uuid.test(x);
type Config={url:string;key:string;lang:Locale;topicId?:string};
type Report={id:string;topic_id:string;reply_id:string|null;reason:typeof REPORT_REASONS[number];status:"pending";created_at:string};
const path="/rest/v1/tc_forum_content_reports";
const columns="id,topic_id,reply_id,reason,status,created_at";
export function pendingReports(rows:unknown):Report[]{
 if(!Array.isArray(rows)||rows.length>50)throw Error("Invalid queue");
 const ids=new Set<string>();
 return rows.map(row=>{
  if(!validId(row?.id)||ids.has(row.id)||!validId(row.topic_id)||(row.reply_id!==null&&!validId(row.reply_id))||
    !REPORT_REASONS.includes(row.reason)||row.status!=="pending"||typeof row.created_at!=="string"||!Number.isFinite(Date.parse(row.created_at)))throw Error("Invalid report");
  ids.add(row.id);return {id:row.id,topic_id:row.topic_id,reply_id:row.reply_id,reason:row.reason,status:row.status,created_at:row.created_at};
 });
}
function button(label:string){const el=document.createElement("button");el.type="button";el.textContent=label;return el}
export function initForumReporting(root:HTMLElement){
 let cfg:Config;
 try{cfg=JSON.parse(root.dataset.reportingConfig||"null")}catch{return}
 if(!cfg||!Object.hasOwn(REPORT_TEXT,cfg.lang)||!cfg.key||!( /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url)||
   (cfg.url==="http://127.0.0.1:4173/forum-test-api"&&cfg.key==="inert-browser-fixture"&&new URLSearchParams(location.search).has("live-forum-test"))))return;
 const copy=REPORT_TEXT[cfg.lang];
 const queue=root.querySelector<HTMLElement>("[data-report-queue]");
 const list=root.querySelector<HTMLElement>("[data-report-list]");
 const status=root.querySelector<HTMLElement>("[data-report-status]");
 const session=()=>readForumSession()?.access||"";
 let generation=0,ownerToken="",enabled=false,moderator=false,queueVersion=0;
 const active=(token:string,g:number)=>!!token&&token===ownerToken&&token===session()&&generation===g;
 const say=(message:string)=>{if(status)status.textContent=message};
 async function api(route:string,token:string,init:RequestInit={}){
  const res=await fetch(cfg.url+route,{...init,headers:{apikey:cfg.key,Accept:"application/json",Authorization:"Bearer "+token,...init.headers},cache:"no-store",signal:AbortSignal.timeout(12000)});
  const raw=await res.text();let value:any=null;
  try{value=raw?JSON.parse(raw):null}catch{throw Error("Invalid response")}
  if(!res.ok)throw Error(value?.code==="23505"?"duplicate":value?.code==="23514"?"quota":"failed");
  return value;
 }
 function clear(){
  document.querySelectorAll("[data-report-control]").forEach(el=>el.remove());
  if(queue)queue.hidden=true;
  list?.replaceChildren();say("");
 }
 function controls(){
  if(!enabled||!validId(cfg.topicId)||!active(ownerToken,generation))return;
  const token=ownerToken,g=generation;
  const targets=[...document.querySelectorAll<HTMLElement>("[data-report-target]")];
  for(const target of targets){
   const reply=target.dataset.reportTarget||"";
   if(reply&&!validId(reply))continue;
   if(target.querySelector("[data-report-control]"))continue;
   const wrap=document.createElement("div");wrap.dataset.reportControl="";wrap.className="forum-report-control";
   const open=button(copy.report);open.setAttribute("aria-expanded","false");
   const form=document.createElement("form");form.hidden=true;
   const label=document.createElement("label");label.textContent=copy.reason+" ";
   const select=document.createElement("select");
   REPORT_REASONS.forEach((reason,i)=>select.add(new Option(copy.reasons[i],reason)));
   label.append(select);
   const submit=document.createElement("button");submit.type="submit";submit.textContent=copy.send;
   const cancel=button(copy.cancel);
   const message=document.createElement("p");message.setAttribute("role","status");message.setAttribute("aria-live","polite");
   form.append(label,submit,cancel);wrap.append(open,form,message);target.append(wrap);
   const toggle=(show:boolean)=>{form.hidden=!show;open.setAttribute("aria-expanded",String(show));if(show)select.focus();else open.focus()};
   open.addEventListener("click",()=>toggle(form.hidden));cancel.addEventListener("click",()=>toggle(false));
   form.addEventListener("submit",async ev=>{
    ev.preventDefault();if(submit.disabled||!active(token,g)||!enabled||!REPORT_REASONS.includes(select.value as any))return;
    submit.disabled=true;message.textContent="";
    try{
     await api(path,token,{method:"POST",headers:{"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({topic_id:cfg.topicId,reply_id:reply||null,reason:select.value})});
     if(!active(token,g))return;
     toggle(false);message.textContent=copy.success;open.disabled=true;
    }catch(e){if(active(token,g))message.textContent=e instanceof Error&&e.message==="duplicate"?copy.duplicate:e instanceof Error&&e.message==="quota"?copy.quota:copy.failure}
    finally{submit.disabled=false}
   });
  }
 }
 async function loadQueue(){
  const token=ownerToken,g=generation,v=++queueVersion;
  if(!moderator||!list||!queue||!active(token,g))return;
  list.replaceChildren();say("");
  try{
   const rows=pendingReports(await api(path+"?"+new URLSearchParams({select:columns,status:"eq.pending",order:"created_at.asc,id.asc",limit:"50"}),token));
   if(!active(token,g)||v!==queueVersion)return;
   if(!rows.length){say(copy.empty);return}
   // Public, already-approved localized titles are optional; never use arbitrary URLs.
   let topics:any[]=[];
   try{
    const ids=[...new Set(rows.map(r=>r.topic_id))];
    const data=await api("/rest/v1/tc_forum_localized_topics?"+new URLSearchParams({select:"topic_id,slug,title,locale,status",topic_id:"in.("+ids.join(",")+")",locale:"eq."+cfg.lang,status:"eq.published",limit:"50"}),token);
    if(Array.isArray(data))topics=data;
   }catch{/* Queue remains useful when localized topic data is unavailable. */}
   if(!active(token,g)||v!==queueVersion)return;
   for(const row of rows){
    const item=document.createElement("li");
    const info=document.createElement("p");const found=topics.find(t=>t.topic_id===row.topic_id&&t.status==="published"&&t.locale===cfg.lang&&typeof t.title==="string"&&typeof t.slug==="string"&&/^[a-z0-9-]{1,240}$/i.test(t.slug));
    if(found){const link=document.createElement("a");link.href=(cfg.lang==="en"?"":"/"+cfg.lang)+"/forum/"+found.slug+"/"+(row.reply_id?"#reply-"+row.reply_id:"");link.textContent=found.title;info.append(link)}
    else info.textContent=row.topic_id+(row.reply_id?" / "+row.reply_id:"");
    const detail=document.createElement("p");detail.textContent=copy.reasons[REPORT_REASONS.indexOf(row.reason)]+" · "+new Intl.DateTimeFormat(cfg.lang,{dateStyle:"medium",timeZone:"UTC"}).format(new Date(row.created_at));
    item.append(info,detail);
    const review=button(copy.review),dismiss=button(copy.dismiss);item.append(review,dismiss);list.append(item);
    const decide=async(decision:"reviewed"|"dismissed")=>{
     if(!active(token,g)||!moderator||review.disabled||v!==queueVersion)return;
     review.disabled=dismiss.disabled=true;
     try{
      const data=await api(path+"?"+new URLSearchParams({id:"eq."+row.id,status:"eq.pending",select:"id,status"}),token,{method:"PATCH",headers:{"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({status:decision})});
      if(!active(token,g)||v!==queueVersion)return;
      if(!Array.isArray(data)||data.length!==1||data[0]?.id!==row.id||data[0]?.status!==decision)throw Error("Unconfirmed decision");
      await loadQueue();if(active(token,g))say(copy.reviewed);
     }catch{if(active(token,g)&&v===queueVersion){say(copy.failure);review.disabled=dismiss.disabled=false}}
    };
    review.addEventListener("click",()=>void decide("reviewed"));dismiss.addEventListener("click",()=>void decide("dismissed"));
   }
  }catch{if(active(token,g)&&v===queueVersion){list.replaceChildren();say(copy.failure)}}
 }
 async function refresh(){
  const g=++generation,token=session();++queueVersion;ownerToken="";enabled=false;moderator=false;clear();root.hidden=true;
  if(!token)return;
  try{
   const user=await api("/auth/v1/user",token);
   if(g!==generation||token!==session()||!validId(user?.id)||user.is_anonymous!==false)return;
   ownerToken=token;
   const settings=await api("/rest/v1/tc_forum_reporting_settings?select=enabled&singleton=eq.true&limit=1",token);
   if(!active(token,g))return;
   enabled=Array.isArray(settings)&&settings.length===1&&settings[0]?.enabled===true;
   controls();
   if(!queue)return;
   const members=await api("/rest/v1/tc_forum_moderation_members?"+new URLSearchParams({select:"member_id,active",member_id:"eq."+user.id,active:"eq.true",limit:"1"}),token);
   if(!active(token,g)||!Array.isArray(members)||members.length!==1||members[0]?.member_id!==user.id||members[0]?.active!==true)return;
   moderator=true;root.hidden=false;queue.hidden=false;await loadQueue();
  }catch{/* Missing or disabled backend never grants controls. */}
 }
 root.querySelector("[data-report-refresh]")?.addEventListener("click",()=>void refresh());
 window.addEventListener("tractorvs-forum-session",()=>void refresh());
 window.addEventListener("storage",()=>void refresh());
 document.addEventListener("tractorvs-forum-live-replies-updated",controls);
 void refresh();
}
