/**
 * Provenance-only sitemap lastmod checkpoint.
 *
 * A lastmod date is recorded only when a *significant rendered HTML page*
 * appears or materially changes relative to a persisted, previously built
 * production baseline. The first run seeds hashes and invents NO dates.
 * Never stamp every URL with today's date merely because a build ran.
 */
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve,join,dirname} from "node:path";
import {fileURLToPath} from "node:url";

export const ROOT=resolve(fileURLToPath(new URL("../",import.meta.url)));
export const ORIGIN="https://tractorvs.com";
export const HISTORY_FILE=join(ROOT,"seo/sitemap-content-history.json");
export const LASTMOD_FILE=join(ROOT,"site/src/data/sitemap-lastmod.json");

function reject(reason){throw Error("[TractorVS lastmod] "+reason);}
function loadJson(path,fallback){
  if(!existsSync(path))return fallback;
  try{return JSON.parse(readFileSync(path,"utf8"));}
  catch{reject("Invalid JSON checkpoint: "+path);}
}
function locs(xml){return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));}
export function extractPublishedUrls(dist){
  const index=readFileSync(join(dist,"sitemap-index.xml"),"utf8");
  if(!index.includes("<sitemapindex"))reject("Missing generated sitemap index");
  const files=locs(index);
  if(files.length<3||files.length>30)reject("Unexpected number of sitemaps");
  const seen=new Set();
  const seenChildren=new Set();
  let htmlChildCount=0;
  for(const file of files){
    const u=new URL(file);
    if(u.origin!==ORIGIN||u.search||u.hash||
       !/^\/(?:sitemap-[0-9]+|forum-sitemap|image-sitemap)\.xml$/.test(u.pathname))
      reject("Unexpected sitemap child URL: "+file);
    if(seenChildren.has(u.pathname))reject("Duplicate sitemap child URL: "+file);
    seenChildren.add(u.pathname);
    const content=readFileSync(join(dist,u.pathname.slice(1)),"utf8");
    if(!/<urlset(?:\s|>)/.test(content))reject("Missing generated urlset: "+file);
    // Moderated forum entries and licensed image entries have their own
    // sitemap rules; the rendered-HTML content hash ledger intentionally
    // tracks Astro-generated page routes only. This prevents forum/image
    // duplicates from creating artificial lastmod changes.
    if(u.pathname==="/forum-sitemap.xml"||u.pathname==="/image-sitemap.xml")continue;
    htmlChildCount++;
    for(const url of locs(content)){
      const parsed=new URL(url);
      if(parsed.origin!==ORIGIN||parsed.search||parsed.hash||!parsed.pathname.endsWith("/"))
        reject("Noncanonical published URL "+url);
      if(seen.has(url))reject("Duplicate sitemap URL "+url);
      seen.add(url);
      if(seen.size>20000)reject("Generated sitemap unexpectedly large");
    }
  }
  if(!htmlChildCount||!seenChildren.has("/forum-sitemap.xml")||
     !seenChildren.has("/image-sitemap.xml"))
    reject("Root sitemap must contain HTML, image and forum child documents");
  if(!seen.size)reject("No HTML page URL listed in generated sitemaps");
  return [...seen].sort();
}
export function significantContentDigest(html,url){
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  const title=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const desc=html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0]||"";
  if(!main||!title)reject("Missing significant visible content/title: "+url);
  if(/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))
    reject("Noindex page included in sitemap: "+url);
  if(!html.includes('rel="canonical" href="'+url+'"'))
    reject("Noncanonical published sitemap page: "+url);
  // HTML data-spec-id is only a source-identity marker for cross-language
  // QA; it is not visible editorial content and cannot justify a new sitemap
  // modification date. Exclude ONLY this precisely scoped, valid UUID added
  // to the model-spec-card opening tag (never values, links, microdata, titles,
  // other attributes or visible HTML). Historic hashes were made before this
  // attribute existed; preserving their inputs avoids fictitious mass lastmod.
  const normalize=s=>s.replace(/\s+/g," ").trim();
  const significantMain=normalize(main).replace(
    /(<article\s+class="model-spec-card")\s+data-spec-id="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"(?=>)/gi,
    "$1"
  );
  return createHash("sha256").update([normalize(title),normalize(desc),significantMain].join("\n")).digest("hex");
}
export function deriveHistory({pages,previous,now=new Date(),minPages=100}){
  if(!previous||previous.version!==1||!previous.pages||typeof previous.pages!=="object")
    reject("Invalid previous history checkpoint");
  if(pages.length<minPages)reject("Too few generated pages to update sitemap history");
  const existing=Object.keys(previous.pages).length;
  if(existing && pages.length<Math.ceil(existing*0.95))
    reject("Public sitemap shrinking over 5%; manual review required");
  const baseline=existing===0;
  const updated={version:1,pages:{}};
  const dates={version:1,dates:{}};
  let changed=0,added=0;
  const timestamp=now.toISOString();
  for(const [url,digest] of pages){
    if(!/^[0-9a-f]{64}$/.test(digest))reject("Invalid rendered content digest");
    const old=previous.pages[url];
    const modified=baseline?null:old?.digest===digest?old.modified:(timestamp);
    if(!baseline&&old?.digest!==digest){
      changed++;
      if(!old)added++;
    }
    if(modified!==null && modified!==undefined){
      if(!Number.isFinite(Date.parse(modified))||Date.parse(modified)>now.getTime()+1000)
        reject("Invalid/future lastmod record for "+url);
      dates.dates[new URL(url).pathname]=modified;
    }
    updated.pages[url]={digest,modified:modified??null};
  }
  if(existing && changed>Math.max(100,Math.floor(pages.length*0.85)))
    reject("Unusually broad rendered content changes, manual SEO review required");
  return {history:updated,lastmod:dates,summary:{baseline,pages:pages.length,significant_changes:changed,new_pages:added,dated_pages:Object.keys(dates.dates).length}};
}
export function auditBuiltSitemap({dist=join(ROOT,"site/dist"),historyPath=HISTORY_FILE,lastmodPath=LASTMOD_FILE,now=new Date(),minPages=100}={}){
  const urls=extractPublishedUrls(dist);
  const pages=urls.map(url=>{
    const u=new URL(url);
    const htmlPath=join(dist,u.pathname.substring(1),"index.html");
    if(!existsSync(htmlPath))reject("Sitemap page not generated: "+url);
    const html=readFileSync(htmlPath,"utf8");
    return [url,significantContentDigest(html,url)];
  });
  const previous=loadJson(historyPath,{version:1,pages:{}});
  const result=deriveHistory({pages,previous,now,minPages});
  // Write only on successful full inspection; no silent partial sitemap.
  writeFileSync(historyPath,JSON.stringify(result.history,null,2)+"\n");
  writeFileSync(lastmodPath,JSON.stringify(result.lastmod,null,2)+"\n");
  return result.summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log("TRACTORVS_CONTENT_VERIFIED_LASTMOD "+JSON.stringify(auditBuiltSitemap()));}
  catch(e){console.error(e);process.exitCode=1;}
}
