import {forumBlocks} from "./forum-format.mjs";
import type {Locale} from "./locales.ts";
const locales=new Set(["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type Reply={id:string;topic_id:string;locale:Locale;original_locale:Locale;status:string;created_at:string;body:string;machine_translated:boolean};
type Part={type:string;text:string};
type Config={url:string;key:string;lang:Locale;topicId:string};
const make=<K extends keyof HTMLElementTagNameMap>(name:K)=>document.createElement(name);
export function newPublicReplies(rows:unknown,topicId:string,existing:ReadonlySet<string>):Reply[]{
 if(!Array.isArray(rows))throw Error("Invalid public replies");
 const result=new Map<string,Reply>();
 for(const row of rows){
  if(!row||typeof row.id!=="string"||!uuid.test(row.id)||existing.has(row.id)||
   row.topic_id!==topicId||row.status!=="published"||row.machine_translated!==false||
   !locales.has(row.locale)||row.locale!==row.original_locale||
   typeof row.created_at!=="string"||!Number.isFinite(Date.parse(row.created_at))||
   typeof row.body!=="string"||row.body.trim().length<10||row.body.length>6000)continue;
  if(!result.has(row.id))result.set(row.id,row);
 }
 return [...result.values()].sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at)||a.id.localeCompare(b.id));
}
function inline(parts:Part[],node:HTMLElement){
 for(const p of parts){
  if(p.type==="url"){
   const link=make("a");link.href=p.text;link.textContent=p.text;link.rel="ugc nofollow noopener noreferrer";link.target="_blank";node.append(link);
  }else if(p.type==="bold"||p.type==="italic"||p.type==="code"){
   const el=make(p.type==="bold"?"strong":p.type==="italic"?"em":"code");el.textContent=p.text;node.append(el);
  }else node.append(document.createTextNode(p.text));
 }
}
function renderBody(value:string,container:HTMLElement){
 for(const block of forumBlocks(value)){
  if(block.type==="table"){
   const wrap=make("div");wrap.className="forum-live-reply-table";wrap.tabIndex=0;
   const table=make("table"),head=make("thead"),header=make("tr"),body=make("tbody");
   for(const cell of block.header){const th=make("th");th.scope="col";inline(cell,th);header.append(th)}
   head.append(header);
   for(const row of block.rows){const tr=make("tr");for(const cell of row){const td=make("td");inline(cell,td);tr.append(td)}body.append(tr)}
   table.append(head,body);wrap.append(table);container.append(wrap);continue;
  }
  const el=make(block.type==="heading"?block.level===2?"h3":"h4":block.type==="list"?"ul":block.type==="quote"?"blockquote":"p");
  for(const item of block.items){const target=block.type==="list"?make("li"):el;inline(item,target);if(block.type==="list")el.append(target)}
  container.append(el);
 }
}
export function initForumLiveReplies(root:HTMLElement){
 const grid=root.querySelector<HTMLElement>("[data-live-reply-grid]");
 const heading=root.querySelector<HTMLElement>("[data-live-reply-heading]");
 const status=root.querySelector<HTMLElement>("[data-live-reply-status]");
 const total=document.querySelector<HTMLElement>("[data-forum-reply-total]");
 if(!grid||!heading||!status||!total)return;
 let cfg:Config;
 try{cfg=JSON.parse(root.dataset.liveReplyConfig||"null")}catch{return}
 if(!cfg||!uuid.test(cfg.topicId)||!locales.has(cfg.lang)||typeof cfg.key!=="string"||!cfg.key||
   typeof cfg.url!=="string"||(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url)&&
   !(cfg.url==="http://127.0.0.1:4173/forum-test-api"&&cfg.key==="inert-browser-fixture")))return;
 if(cfg.key==="inert-browser-fixture"&&!new URLSearchParams(location.search).has("live-forum-test"))return;
 const existing=new Set([...document.querySelectorAll<HTMLElement>("[data-static-reply-id]")].map(el=>el.dataset.staticReplyId||""));
 const base=Number(total.dataset.forumReplyTotal)||0;
 const date=new Intl.DateTimeFormat(cfg.lang==="pt-br"?"pt-BR":cfg.lang,{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"});
 let version=0;
 async function refresh(){
  const current=++version;
  const params=new URLSearchParams({select:"id,topic_id,locale,original_locale,status,created_at,body,machine_translated",
   topic_id:"eq."+cfg.topicId,status:"eq.published",machine_translated:"eq.false",order:"created_at.desc,id.desc",limit:"60"});
  try{
   const headers:Record<string,string>={apikey:cfg.key,Accept:"application/json"};
   if(cfg.key.split(".").length===3)headers.Authorization="Bearer "+cfg.key;
   const res=await fetch(cfg.url+"/rest/v1/tc_forum_localized_replies?"+params,{headers,cache:"no-store",signal:AbortSignal.timeout(12000)});
   if(!res.ok)throw Error("Public replies unavailable");
   const rows=newPublicReplies(await res.json(),cfg.topicId,existing);
   if(current!==version)return;
   const fragment=document.createDocumentFragment();
   for(const row of rows){
    const article=make("article");article.className="forum-live-reply";article.id="reply-"+row.id;
    const meta=make("p");meta.className="forum-live-reply-meta";
    const time=make("time");time.dateTime=row.created_at;time.textContent=date.format(new Date(row.created_at));meta.append(time);
    if(row.locale!==cfg.lang){const language=make("bdi");language.lang=row.locale;language.textContent=" · "+row.locale;meta.append(language)}
    const body=make("div");body.lang=row.locale;renderBody(row.body,body);article.append(meta,body);fragment.append(article);
   }
   grid.replaceChildren(fragment);
   total.textContent=String(base+rows.length);
   heading.hidden=!rows.length;grid.hidden=!rows.length;root.hidden=!rows.length;status.textContent="";
  }catch{
   if(current!==version)return;
   // A failed read must not erase previous verified content or fabricate counts.
   root.hidden=false;status.textContent=root.dataset.liveReplyFailed||"";
  }
 }
 document.addEventListener("tractorvs-forum-reply-saved",()=>void refresh());
 void refresh();
}
