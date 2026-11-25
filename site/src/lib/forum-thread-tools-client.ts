import {discussionLink,replyMatches,appendReplyQuote} from "./forum-thread-tools.mjs";
import type {Locale} from "./locales.ts";
import {THREAD_TOOLS} from "./forum-thread-tools-i18n.ts";
export function initForumThreadTools(root:HTMLElement){
 const lang=root.dataset.threadToolsLang as Locale;
 const labels=THREAD_TOOLS[lang];
 const canonical=root.dataset.threadCanonical||"";
 if(!labels)return;
 try{discussionLink(canonical)}catch{return}
 const query=<T extends HTMLElement>(selector:string)=>root.querySelector<T>(selector);
 const status=query<HTMLElement>("[data-thread-tools-status]");
 const fallback=query<HTMLInputElement>("[data-thread-copy-fallback]");
 const filter=query<HTMLInputElement>("[data-thread-reply-search]");
 const filterPanel=query<HTMLElement>("[data-thread-reply-filter]");
 const filterStatus=query<HTMLElement>("[data-thread-filter-status]");
 const grid=query<HTMLElement>("[data-live-reply-grid]");
 const composer=query<HTMLElement>("#forum-compose");
 const say=(message:string)=>{if(status)status.textContent=message};
 const feedback=query<HTMLElement>(".forum-thread-feedback");
 const replyText=(body:Element|null)=>body?[...body.querySelectorAll("p:not(.forum-table-hint),li,blockquote,h2,h3,h4,th,td")].map(el=>el.textContent||"").join(" "):"";
 const all=()=>[...root.querySelectorAll<HTMLElement>("[data-static-reply-id],.forum-live-reply")];
 const permalink=(reply:HTMLElement)=>discussionLink(canonical,reply.id);
 let initialReplyHash=location.hash.startsWith("#reply-")?location.hash.slice(1):"";
 async function copy(url:string){
  try{
   if(!navigator.clipboard?.writeText)throw Error();
   await navigator.clipboard.writeText(url);
   if(fallback)fallback.hidden=true;
   say(labels.copied);
  }catch{
   if(fallback){fallback.hidden=false;fallback.value=url;fallback.focus();fallback.select()}
   say(labels.copyFailed);
  }
 }
 async function share(){
  const url=discussionLink(canonical);
  if(typeof navigator.share==="function"){
   try{await navigator.share({url});return}
   catch(error){if(error instanceof Error&&error.name==="AbortError")return}
  }
  await copy(url);
 }
 function quote(reply:HTMLElement){
  const body=reply.querySelector<HTMLElement>("[data-thread-reply-body]");
  const form=composer?.querySelector<HTMLFormElement>("[data-forum-post]");
  if(!form||form.hidden){
   const gate=composer?.querySelector<HTMLDetailsElement>("[data-forum-auth-gate]");
   if(gate&&!gate.hidden){gate.open=true;gate.querySelector<HTMLElement>("summary")?.focus()}
   else composer?.focus();
   say(labels.login);return;
  }
  const field=form.querySelector<HTMLTextAreaElement>('textarea[name="body"]');
  if(!field||!body)return;
  const text=replyText(body);
  const value=appendReplyQuote(field.value,text,permalink(reply),field.maxLength);
  if(value===null){say(labels.limit);return}
  const preview=form.querySelector<HTMLButtonElement>("[data-editor-preview]");
  if(preview?.getAttribute("aria-pressed")==="true")preview.click();
  field.value=value;
  field.dispatchEvent(new Event("input",{bubbles:true}));
  field.focus();field.setSelectionRange(value.length,value.length);
  say("");
 }
 function decorateLive(){
  for(const reply of root.querySelectorAll<HTMLElement>(".forum-live-reply")){
   if(reply.querySelector("[data-thread-reply-actions]"))continue;
   const body=reply.querySelector<HTMLElement>("div[lang]");
   if(!body)continue;
   body.dataset.threadReplyBody="";
   const tools=document.createElement("div");
   tools.className="forum-reply-tools";tools.dataset.threadReplyActions="";
   const link=document.createElement("a");
   link.href="#"+reply.id;link.textContent=labels.link;tools.append(link);
   for(const [action,label] of [["copy-reply",labels.copy],["quote",labels.quote]]){
    const button=document.createElement("button");
    button.type="button";button.dataset.threadAction=action;button.textContent=label;tools.append(button);
   }
   reply.append(tools);
  }
 }
 function filterReplies(){
  const replies=all();
  if(filterPanel)filterPanel.hidden=!replies.length;
  const term=filter?.value||"";
  let shown=0;
  for(const reply of replies){
   const body=reply.querySelector("[data-thread-reply-body]");
   const matches=replyMatches(replyText(body),term,lang);
   reply.hidden=!matches;if(matches)shown++;
  }
  if(filterStatus)filterStatus.textContent=term.trim()?(shown?labels.shown+": "+shown+"/"+replies.length:labels.noResults):"";
 }
 function revealAnchor(){
  const id=location.hash.slice(1);
  if(!/^reply-[a-f0-9-]{36}$/i.test(id))return;
  const reply=document.getElementById(id);
  if(!reply||!root.contains(reply))return;
  if(reply.hidden&&filter){filter.value="";filterReplies()}
  if(initialReplyHash===id){initialReplyHash="";reply.scrollIntoView({block:"start"})}
 }
 root.addEventListener("click",event=>{
  if(!(event.target instanceof Element))return;
  const button=event.target.closest<HTMLButtonElement>("button[data-thread-action]");
  if(!button||!root.contains(button))return;
  const action=button.dataset.threadAction;
  if(action!=="clear"&&feedback){
   const group=button.closest(".forum-public-tools,.forum-reply-tools");
   if(group&&feedback.parentElement!==group)group.append(feedback);
   if(fallback)fallback.hidden=true;say("");
  }
  if(action==="share")void share();
  else if(action==="copy-topic")void copy(discussionLink(canonical));
  else if(action==="print")window.print();
  else if(action==="clear"&&filter){filter.value="";filterReplies();filter.focus()}
  else if(action==="copy-reply"||action==="quote"){
   const reply=button.closest<HTMLElement>("[data-static-reply-id],.forum-live-reply");
   if(reply){try{if(action==="copy-reply")void copy(permalink(reply));else quote(reply)}catch{}}
  }
 });
 filter?.addEventListener("input",filterReplies);
 window.addEventListener("hashchange",()=>{initialReplyHash=location.hash.slice(1);revealAnchor()});
 root.querySelectorAll<HTMLElement>("[data-thread-js]").forEach(el=>el.hidden=false);
 decorateLive();filterReplies();revealAnchor();
 if(grid)new MutationObserver(()=>{decorateLive();filterReplies();revealAnchor()}).observe(grid,{childList:true});
}
