/**
 * TractorVS end-to-end forum release audit.
 * Compares public anon-RLS-approved Supabase rows against LIVE Cloudflare.
 * No private posts, author data, service role or write operations.
 */
import {fetchPublicRows} from "../site/src/lib/forum-public-rows.mjs";
import {validateAnon} from "./tractor-forum-publication-autosync.mjs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {appendFileSync} from "node:fs";

const PROJECT="aaufxtcvnzgavtlintiv";
const API="https://"+PROJECT+".supabase.co/rest/v1";
const DEFAULT_ORIGIN="https://tractorvs.com";
const ALLOWED_ORIGINS=new Set([DEFAULT_ORIGIN,"https://tractorvs-site.onuronkol2.workers.dev"]);
const LOCALES=new Set(["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]);
export const GRACE_MINUTES=45;

const hrefFor=(row,origin)=>origin+(row.locale==="en"?"":"/"+row.locale)+"/forum/"+row.slug+"/";
const hubFor=(row,origin)=>origin+(row.locale==="en"?"":"/"+row.locale)+"/forum/";
const pubEligible=row=>row&&row.status==="published"&&row.seo_ready===true&&
 LOCALES.has(row.locale)&&typeof row.slug==="string"&&/^[a-z0-9][a-z0-9-]{10,259}$/.test(row.slug)&&
 (row.machine_translated===true||(
  typeof row.title==="string"&&row.title.trim().length>=12&&
  typeof row.body==="string"&&row.body.trim().length>=150));

async function getText(url,fetchFn,timeout=16000){
 const response=await fetchFn(url,{
  signal:AbortSignal.timeout(timeout),redirect:"follow",cache:"no-store",
  headers:{"User-Agent":"TractorVS-forum-release-audit/1.0","Accept":"text/html, application/xml"}
 });
 if(!response.ok)throw Error("Live endpoint returned HTTP "+response.status+": "+new URL(url).pathname);
 const body=(await response.text()).slice(0,4_000_000);
 return {status:response.status,body,contentType:response.headers.get("content-type")||""};
}
export async function auditForumVisibility({
 jwt,fetchFn=fetch,now=new Date(),origin=DEFAULT_ORIGIN,graceMinutes=GRACE_MINUTES,
 maxTopics=12
}){
 validateAnon(jwt);
 if(!ALLOWED_ORIGINS.has(origin))throw Error("Only approved TractorVS live origins may be audited.");
 if(!Number.isFinite(graceMinutes)||graceMinutes<5||graceMinutes>180)throw Error("Invalid grace minutes.");
 const all=await fetchPublicRows({
  api:API,table:"tc_forum_localized_topics",
  fields:"id,topic_id,locale,original_locale,slug,category,tractor_id,status,created_at,updated_at,title,body,seo_ready,machine_translated",
  headers:{apikey:jwt,Authorization:"Bearer "+jwt},fetchFn
 });
 const expected=all.filter(pubEligible);
 const expectedURLs=new Set(expected.map(t=>hrefFor(t,origin)));
 const cutoff=now.getTime()-graceMinutes*60_000;
 const matureAll=expected.filter(t=>{
  const changed=Date.parse(t.updated_at||t.created_at);
  return Number.isFinite(changed)&&changed<=cutoff;
 });
 const matured=matureAll.sort((a,b)=>Date.parse(b.updated_at||b.created_at)-Date.parse(a.updated_at||a.created_at))
  .slice(0,maxTopics);
 const sitemap=await getText(origin+"/forum-sitemap.xml",fetchFn);
 if(!sitemap.contentType.includes("xml"))throw Error("Forum sitemap is not XML.");
 const xmlLocs=[...sitemap.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(x=>x[1].replace(/&amp;/g,"&"));
 const staleUrls=xmlLocs.filter(url=>{
  try{
   const path=new URL(url).pathname;
   return /^\/(?:(?:tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?forum\/[a-z0-9-]+\/$/.test(path)&&
     !expectedURLs.has(url);
  }catch{return false;}
 });
 const errors=staleUrls.map(url=>"Hidden/unapproved forum URL remains in sitemap: "+url);
 const hubs=new Map();
 for(const topic of matured){
  const canonical=hrefFor(topic,origin),hub=hubFor(topic,origin);
  if(!xmlLocs.includes(canonical))errors.push("Missing sitemap URL: "+canonical);
  if(!hubs.has(hub)){
   const html=await getText(hub,fetchFn);
   hubs.set(hub,html.body);
  }
  if(!hubs.get(hub).includes(canonical.replace(origin,"")) &&
    !hubs.get(hub).includes(canonical))
   errors.push("Public forum hub does not link published topic: "+canonical);
  try{
   const html=await getText(canonical,fetchFn);
   if(!html.contentType.includes("html"))errors.push("Topic is not HTML: "+canonical);
   if(!html.body.includes('href="'+canonical+'"'))
    errors.push("Topic canonical absent or incorrect: "+canonical);
   if(!/<meta\b[^>]*name="robots"[^>]*content="index,follow/i.test(html.body))
    errors.push("Indexable topic has missing indexing directive: "+canonical);
   if(!/<h1\b[^>]*>/i.test(html.body))
    errors.push("Topic is missing visible H1: "+canonical);
  }catch(error){errors.push("Topic not publicly reachable: "+canonical+" ("+String(error.message)+")");}
 }
 return {
  ok:errors.length===0,public_topics:all.length,indexable_topics:expected.length,
  checked:matured.length,grace_minutes:graceMinutes,
  not_yet_due:expected.length-matureAll.length,errors
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const results=await auditForumVisibility({jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT});
 const message=JSON.stringify(results);
 console.log("TRACTORVS_FORUM_VISIBILITY "+message);
 if(process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,"## Live forum publishing audit\n\n"+
   (results.ok?"PASS":"FAIL")+" — "+results.checked+" mature topics checked, "+
   results.not_yet_due+" topics inside grace window.\n\n"+
   (results.errors.length?results.errors.map(s=>"- "+s).join("\n"):"No missing or stale public forum pages detected.")+
   "\n\nA database status alone does not prove Cloudflare delivery or Google indexing.\n");
 if(!results.ok)process.exitCode=1;
}
