/**
 * Early public-forum reading for human visitors, while Astro/Cloudflare
 * prepares permanent, SEO-eligible HTML. The underlying source is exclusively
 * Supabase's anon-RLS-approved public view.
 *
 * No hidden/private posts, passwords, user profiles, writes, tracking events,
 * raw innerHTML, dynamic scripts or speculative permanent links.
 */
import {forumBlocks,forumSeoDescription} from "./forum-format.mjs";
import type {Locale} from "./locales.ts";
import {FORUM_LIVE_TEXT} from "./forum-live-i18n.ts";

type PubRow={
 id:string;topic_id:string;locale:string;original_locale:string;status:string;
 title:string;body:string;slug:string;category:string;created_at:string;
 machine_translated:boolean
};
type PublicConfig={url:string;key:string;lang:Locale};
type Part={type:string;text:string};
const LOCALES=new Set(["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]);
const CATEGORIES=new Set(["questions","maintenance","reviews","news","comparison","general"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const slug=/^[a-z0-9][a-z0-9-]{10,259}$/;
const make=<K extends keyof HTMLElementTagNameMap>(name:K)=>document.createElement(name);

function safeRow(row:PubRow,lang:string):boolean{
 return !!row&&row.status==="published"&&row.locale===lang&&
  LOCALES.has(row.original_locale)&&uuid.test(row.topic_id)&&uuid.test(row.id)&&
  typeof row.slug==="string"&&slug.test(row.slug)&&
  CATEGORIES.has(row.category)&&typeof row.created_at==="string"&&
  Number.isFinite(Date.parse(row.created_at))&&
  typeof row.title==="string"&&row.title.trim().length>=(row.machine_translated?4:12)&&
  row.title.length<=(row.machine_translated?240:160)&&
  typeof row.body==="string"&&row.body.trim().length>=(row.machine_translated?5:40)&&
  row.body.length<=(row.machine_translated?30000:12000);
}
function drawInline(parts:Part[],node:HTMLElement){
 for(const p of parts){
  if(p.type==="url"){
   const a=make("a");
   a.href=p.text;a.textContent=p.text;
   a.target="_blank";a.rel="ugc nofollow noopener noreferrer";
   node.append(a);
  }else if(p.type==="bold"||p.type==="italic"||p.type==="code"){
   const element=make(p.type==="bold"?"strong":p.type==="italic"?"em":"code");
   element.textContent=p.text;node.append(element);
  }else node.append(document.createTextNode(p.text));
 }
}
function richBody(body:string,into:HTMLElement){
 for(const block of forumBlocks(body)){
  if(block.type==="table"){
   const wrapper=make("div");wrapper.className="forum-live-table";wrapper.tabIndex=0;
   const table=make("table"),head=make("thead"),hr=make("tr"),tbody=make("tbody");
   for(const cells of block.header){const th=make("th");th.scope="col";drawInline(cells,th);hr.append(th)}
   head.append(hr);
   for(const cells of block.rows){
    const tr=make("tr");for(const cell of cells){const td=make("td");drawInline(cell,td);tr.append(td)}
    tbody.append(tr);
   }
   table.append(head,tbody);wrapper.append(table);into.append(wrapper);continue;
  }
  const el=make(block.type==="heading"?block.level===2?"h4":"h5":
   block.type==="list"?"ul":block.type==="quote"?"blockquote":"p");
  for(const item of block.items){
   const child=block.type==="list"?make("li"):el;
   drawInline(item,child);
   if(block.type==="list")el.append(child);
  }
  into.append(el);
 }
}
/** Called once from the ForumHub client script. Also refreshes on same-tab post. */
export function initForumLive(root:HTMLElement):void{
 const grid=root.querySelector<HTMLElement>("[data-forum-live-grid]");
 const status=root.querySelector<HTMLElement>("[data-forum-live-status]");
 const heading=root.querySelector<HTMLElement>("[data-forum-live-heading]");
 if(!grid||!status||!heading)return;
 let cfg:PublicConfig|null=null;
 try{cfg=JSON.parse(root.dataset.forumLiveConfig||"null")}catch{return}
 if(!cfg||!LOCALES.has(cfg.lang)||typeof cfg.key!=="string"||!cfg.key||
   typeof cfg.url!=="string"||
   (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url)&&
    !(cfg.url==="http://127.0.0.1:4173/forum-test-api"&&cfg.key==="inert-browser-fixture")))return;
 const text=FORUM_LIVE_TEXT[cfg.lang];
 let call=0;
 async function refresh(showPending=false){
  const current=++call;
  if(showPending){root.hidden=false;status.textContent=text.pending;}
  const query=new URLSearchParams({
   select:"id,topic_id,locale,original_locale,slug,category,status,created_at,title,body,machine_translated",
   locale:"eq."+cfg!.lang,status:"eq.published",order:"created_at.desc",limit:"60"
  });
  try{
   const headers:Record<string,string>={"apikey":cfg!.key,Accept:"application/json"};
   if(cfg!.key.split(".").length===3)headers.Authorization="Bearer "+cfg!.key;
   const res=await fetch(cfg!.url+"/rest/v1/tc_forum_localized_topics?"+query,{
    method:"GET",headers,cache:"no-store",signal:AbortSignal.timeout(12000)
   });
   if(!res.ok)throw Error("Forum public view unavailable");
   const raw:unknown=await res.json();
   if(!Array.isArray(raw))throw Error("Invalid public forum response");
   if(current!==call)return;
   const staticIds=new Set([...document.querySelectorAll<HTMLElement>("[data-forum-topic][data-forum-topic-id]")]
    .map(el=>el.dataset.forumTopicId||""));
   const approved=(raw as PubRow[]).filter(row=>safeRow(row,cfg!.lang) && !staticIds.has(row.topic_id));
   const byId=new Map<string,PubRow>();
   for(const row of approved)if(!byId.has(row.topic_id))byId.set(row.topic_id,row);
   grid.replaceChildren();
   for(const row of byId.values()){
    const article=make("article");article.className="community-topic forum-live-topic";
    article.dataset.forumTopic="";article.dataset.forumTopicId=row.topic_id;
    article.dataset.forumTopicCategory=row.category;
    article.dataset.forumSearch=(row.title+" "+row.body).toLocaleLowerCase();
    const meta=make("p");meta.className="forum-live-meta";
    const time=make("time");time.dateTime=row.created_at;
    time.textContent=new Intl.DateTimeFormat(cfg!.lang==="zh"?"zh-CN":cfg!.lang==="pt-br"?"pt-BR":cfg!.lang,{
     year:"numeric",month:"short",day:"numeric",timeZone:"UTC"
    }).format(new Date(row.created_at));meta.append(time);
    const title=make("h3");title.textContent=row.title;
    const excerpt=make("p");excerpt.textContent=forumSeoDescription(row.body,230);
    const details=make("details"),summary=make("summary");summary.textContent=text.read;
    const note=make("p");note.className="forum-live-note";note.textContent=text.summary;
    const body=make("div");body.className="forum-live-body";richBody(row.body,body);
    details.append(summary,note,body);
    article.append(meta,title,excerpt,details);grid.append(article);
   }
   const hasNew=byId.size>0;
   heading.hidden=!hasNew;grid.hidden=!hasNew;root.hidden=!hasNew;
   status.textContent="";
   const empty=document.querySelector<HTMLElement>(".community-empty");
   const starters=document.querySelector<HTMLElement>(".community-starter");
   if(empty)empty.hidden=hasNew;
   if(starters)starters.hidden=hasNew;
   document.dispatchEvent(new Event("tractorvs-forum-live-updated"));
  }catch{
   if(current!==call)return;
   // Keep server-rendered content intact: an outage must never erase it.
   status.textContent=text.failed;root.hidden=false;
  }
 }
 document.addEventListener("tractorvs-forum-topic-saved",()=>void refresh(true));
 void refresh();
}
