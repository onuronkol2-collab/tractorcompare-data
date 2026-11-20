import type {Locale} from "./locales.ts";
export interface ForumTopic {
 id:string;topic_id:string;locale:Locale;original_locale:Locale;slug:string;
 category:"questions"|"maintenance"|"reviews"|"news"|"comparison"|"general";
 tractor_id:string|null;title:string;body:string;status:string;
 created_at:string;updated_at:string;seo_ready:boolean;machine_translated:boolean;
}
export interface ForumReply {
 id:string;topic_id:string;locale:Locale;original_locale:Locale;
 status:string;body:string;created_at:string;machine_translated:boolean;
}
let topicsCache:Promise<ForumTopic[]>|undefined;
let repliesCache:Promise<ForumReply[]>|undefined;
function config() {
 const site=process.env.SITE_URL||"";
 if(site!=="https://tractorvs.com"||process.env.PUBLIC_INDEXING_ENABLED!=="true")return null;
 const base=(process.env.SUPABASE_URL||"").trim().replace(/\/$/,"");
 const key=(process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||"").trim();
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base))
  throw new Error("Production community requires a verified Supabase HTTPS project URL.");
 if(!key||key.startsWith("sb_secret_")||key.startsWith("eyJ")&&(()=>{
  try{return JSON.parse(Buffer.from(key.split(".")[1]||"","base64url").toString()).role!=="anon"}
  catch{return true}
 })())throw new Error("Never include a secret/service-role key in public community pages.");
 return {url:base,key};
}
export function publicForumClientConfig() {return config();}
async function loadRows<T>(table:string,select:string):Promise<T[]> {
 const cfg=config();
 if(!cfg)return [];
 const path="/rest/v1/"+table+"?select="+encodeURIComponent(select)+"&order=created_at.desc&limit=1000";
 const headers:Record<string,string>={"apikey":cfg.key,"Accept":"application/json"};
 if(cfg.key.split(".").length===3)headers.Authorization="Bearer "+cfg.key;
 const response=await fetch(cfg.url+path,{headers,signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw new Error("Public forum API request failed ("+response.status+"), refusing an incomplete production build.");
 const rows=await response.json();
 if(!Array.isArray(rows))throw new Error("Public forum API did not return a list.");
 return rows as T[];
}
const validLocale=new Set(["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]);
const slugPattern=/^[a-z0-9][a-z0-9-]{10,259}$/;
export function isSafeForumTopic(v:ForumTopic):boolean {
 return Boolean(v&&validLocale.has(v.locale)&&v.status==="published"&&
  typeof v.slug==="string"&&slugPattern.test(v.slug)&&
  typeof v.title==="string"&&v.title.trim().length>=12&&v.title.length<=160&&
  typeof v.body==="string"&&v.body.trim().length>=40&&v.body.length<=12000&&
  typeof v.id==="string"&&/^[a-f0-9-]{36}$/.test(v.id));
}
export async function allPublicForumTopics():Promise<ForumTopic[]> {
 if(!topicsCache)topicsCache=loadRows<ForumTopic>("tc_forum_localized_topics",
  "id,topic_id,locale,original_locale,slug,category,tractor_id,created_at,updated_at,status,title,body,seo_ready,machine_translated")
  .then(rows=>rows.filter(isSafeForumTopic));
 return topicsCache;
}
export async function publishedForumTopics(lang:Locale):Promise<ForumTopic[]> {
 return (await allPublicForumTopics()).filter(x=>x.locale===lang);
}
export async function allPublicForumReplies():Promise<ForumReply[]>{
 if(!repliesCache)repliesCache=loadRows<ForumReply>("tc_forum_localized_replies",
  "id,topic_id,locale,original_locale,created_at,status,body,machine_translated")
  .then(rows=>rows.filter(x=>x&&x.status==="published"&&validLocale.has(x.locale)&&
    typeof x.body==="string"&&x.body.trim().length>=10&&x.body.length<=6000));
 return repliesCache;
}
export async function publishedForumReplies(lang:Locale,topicId:string):Promise<ForumReply[]> {
 return (await allPublicForumReplies()).filter(x=>x.locale===lang&&x.topic_id===topicId)
  .sort((a,b)=>a.created_at.localeCompare(b.created_at));
}
export function forumDate(value:string,lang:Locale):string {
 try{return new Intl.DateTimeFormat(lang==="zh"?"zh-CN":lang==="pt-br"?"pt-BR":lang,{
  year:"numeric",month:"short",day:"numeric",timeZone:"UTC"
 }).format(new Date(value))}catch{return ""}
}
