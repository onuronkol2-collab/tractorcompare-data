/**
 * TractorVS end-to-end forum release audit. Read-only anon RLS views.
 * A successful DB write or Cloudflare build is NOT proof a post is live.
 */
import {fetchPublicRows} from "../site/src/lib/forum-public-rows.mjs";
import {validateAnon} from "./tractor-forum-publication-autosync.mjs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {appendFileSync} from "node:fs";

const PROJECT="aaufxtcvnzgavtlintiv", API="https://"+PROJECT+".supabase.co/rest/v1";
const DEFAULT_ORIGIN="https://tractorvs.com";
const ALLOWED_ORIGINS=new Set([DEFAULT_ORIGIN,"https://tractorvs-site.onuronkol2.workers.dev"]);
const LOCALES=new Set(["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]);
export const GRACE_MINUTES=45;
const urlFor=(row,origin)=>origin+(row.locale==="en"?"":"/"+row.locale)+"/forum/"+row.slug+"/";
const hubFor=(row,origin)=>origin+(row.locale==="en"?"":"/"+row.locale)+"/forum/";
const safeTopic=row=>row&&row.status==="published"&&LOCALES.has(row.locale)&&
 typeof row.slug==="string"&&/^[a-z0-9][a-z0-9-]{10,259}$/.test(row.slug)&&
 typeof row.title==="string"&&typeof row.body==="string"&&
 row.title.trim().length>=(row.machine_translated?4:12)&&
 row.body.trim().length>=(row.machine_translated?5:40);
const indexableTopic=row=>safeTopic(row)&&row.seo_ready===true&&
 (row.machine_translated===true||(row.title.trim().length>=12&&row.body.trim().length>=150));
const timestamp=row=>Date.parse(row.updated_at||row.created_at||"");
async function getText(url,fetchFn,timeout=16000){
 const response=await fetchFn(url,{
  signal:AbortSignal.timeout(timeout),redirect:"follow",cache:"no-store",
  headers:{"User-Agent":"TractorVS-forum-release-audit/1.0","Accept":"text/html, application/xml"}
 });
 if(!response.ok)throw Error("Live endpoint returned HTTP "+response.status+": "+new URL(url).pathname);
 return {body:(await response.text()).slice(0,4_000_000),
  contentType:response.headers.get("content-type")||""};
}
export async function auditForumVisibility({
 jwt,fetchFn=fetch,now=new Date(),origin=DEFAULT_ORIGIN,graceMinutes=GRACE_MINUTES,
 maxTopics=12,maxReplies=12,maxPhotos=12
}){
 validateAnon(jwt);
 if(!ALLOWED_ORIGINS.has(origin))throw Error("Only approved TractorVS live origins may be audited.");
 if(!Number.isFinite(graceMinutes)||graceMinutes<5||graceMinutes>180)throw Error("Invalid grace minutes.");
 const common={api:API,headers:{apikey:jwt,Authorization:"Bearer "+jwt},fetchFn};
 const [topicRows,replyRows,mediaRows]=await Promise.all([
  fetchPublicRows({...common,table:"tc_forum_localized_topics",
   fields:"id,topic_id,locale,original_locale,slug,category,tractor_id,status,created_at,updated_at,title,body,seo_ready,machine_translated"}),
  fetchPublicRows({...common,table:"tc_forum_localized_replies",
   fields:"id,topic_id,locale,original_locale,status,created_at,body,machine_translated"}),
  fetchPublicRows({...common,table:"tc_forum_public_media",
   fields:"id,topic_id,reply_id,position,alt_text,status,locale,created_at"})
 ]);
 const topics=topicRows.filter(safeTopic),indexed=topics.filter(indexableTopic);
 const cutoff=now.getTime()-graceMinutes*60_000;
 const mature=rows=>rows.filter(x=>Number.isFinite(timestamp(x))&&timestamp(x)<=cutoff);
 const latest=(rows,max)=>mature(rows).sort((a,b)=>timestamp(b)-timestamp(a)).slice(0,max);
 const matureTopics=latest(topics,maxTopics);
 const originalReplies=replyRows.filter(r=>r.status==="published"&&!r.machine_translated&&r.locale===r.original_locale);
 const matureReplies=latest(originalReplies,maxReplies);
 const matureMedia=latest(mediaRows.filter(r=>r.status==="published"),maxPhotos);
 const sitemap=await getText(origin+"/forum-sitemap.xml",fetchFn);
 if(!sitemap.contentType.includes("xml"))throw Error("Forum sitemap is not XML.");
 const xmlLocs=[...sitemap.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(x=>x[1].replace(/&amp;/g,"&"));
 const indexedUrls=new Set(indexed.map(t=>urlFor(t,origin)));
 const errors=xmlLocs.filter(url=>{
  try{
   const path=new URL(url).pathname;
   return /^\/(?:(?:tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?forum\/[a-z0-9-]+\/$/.test(path)&&
    !indexedUrls.has(url);
  }catch{return false;}
 }).map(url=>"Non-indexable or hidden forum URL remains in sitemap: "+url);
 const hubs=new Map(),pages=new Map();
 const getTopicHtml=async(topic)=>{
  const canonical=urlFor(topic,origin);
  if(pages.has(canonical))return pages.get(canonical);
  try{
   const page=await getText(canonical,fetchFn);
   if(!page.contentType.includes("html"))errors.push("Topic is not HTML: "+canonical);
   if(!page.body.includes('href="'+canonical+'"')||!/<link\b[^>]*rel="canonical"/i.test(page.body))
    errors.push("Topic canonical absent or incorrect: "+canonical);
   if(!/<h1\b[^>]*>/i.test(page.body))
    errors.push("Topic is missing visible H1: "+canonical);
   if(indexableTopic(topic)&&!/<meta\b[^>]*name="robots"[^>]*content="index,follow/i.test(page.body))
    errors.push("Indexable topic has missing indexing directive: "+canonical);
   pages.set(canonical,page.body);
   return page.body;
  }catch(err){
   errors.push("Topic not publicly reachable: "+canonical+" ("+String(err.message)+")");
   pages.set(canonical,"");
   return "";
  }
 };
 for(const topic of matureTopics){
  const canonical=urlFor(topic,origin),hub=hubFor(topic,origin);
  if(indexableTopic(topic)&&!xmlLocs.includes(canonical))
   errors.push("Missing sitemap URL: "+canonical);
  if(!hubs.has(hub)){
   try{hubs.set(hub,(await getText(hub,fetchFn)).body)}
   catch(err){errors.push("Public forum hub unavailable: "+hub+" ("+String(err.message)+")");hubs.set(hub,"")}
  }
  if(!hubs.get(hub).includes(canonical.replace(origin,""))&&!hubs.get(hub).includes(canonical))
   errors.push("Public forum hub does not link published topic: "+canonical);
  await getTopicHtml(topic);
 }
 const originals=new Map();
 for(const topic of topics)
  if(topic.locale===topic.original_locale&&!originals.has(topic.topic_id))
   originals.set(topic.topic_id,topic);
 const findTopic=id=>originals.get(id)||topics.find(t=>t.topic_id===id);
 for(const reply of matureReplies){
  const topic=findTopic(reply.topic_id);
  if(!topic){errors.push("Orphaned public reply: "+reply.id);continue}
  const html=await getTopicHtml(topic);
  if(html&&!html.includes('id="reply-'+reply.id+'"'))
   errors.push("Published reply missing from live topic: "+reply.id);
 }
 const replyMap=new Map(originalReplies.map(r=>[r.id,r.topic_id]));
 for(const photo of matureMedia){
  const topic=findTopic(photo.topic_id||replyMap.get(photo.reply_id));
  if(!topic){errors.push("Orphaned public photo: "+photo.id);continue}
  const html=await getTopicHtml(topic);
  if(html&&!html.includes(photo.id))
   errors.push("Published photo missing from live topic: "+photo.id);
 }
 return {
  ok:errors.length===0,public_topics:topics.length,indexable_topics:indexed.length,
  public_replies:originalReplies.length,public_photos:mediaRows.length,
  checked:matureTopics.length,checked_replies:matureReplies.length,checked_photos:matureMedia.length,
  grace_minutes:graceMinutes,not_yet_due:topics.length-mature(topics).length,errors
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await auditForumVisibility({jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT});
 console.log("TRACTORVS_FORUM_VISIBILITY "+JSON.stringify(result));
 if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,"audited=true\n");
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  "## Live forum publishing audit\n\n"+(result.ok?"PASS":"FAIL")+
  " — "+result.checked+" topics, "+result.checked_replies+" replies, "+
  result.checked_photos+" photos checked after "+GRACE_MINUTES+" minute grace window.\n\n"+
  (result.errors.length?result.errors.map(s=>"- "+s).join("\n"):"No public/forum delivery mismatches found.")+
  "\n\nA database status does not prove Cloudflare delivery or Google indexing.\n");
 if(!result.ok)process.exitCode=1;
}
