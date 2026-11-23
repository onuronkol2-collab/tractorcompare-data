/**
 * Provenance-only sitemap lastmod checkpoint.
 *
 * A lastmod date is recorded only when a *significant rendered HTML page*
 * appears or materially changes relative to a persisted, previously built
 * production baseline. The first run seeds hashes and invents NO dates.
 * Never stamp every URL with today's date merely because a build ran.
 */
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve,join,dirname} from "node:path";
import {fileURLToPath} from "node:url";

export const ROOT=resolve(fileURLToPath(new URL("../",import.meta.url)));
export const ORIGIN="https://tractorvs.com";
export const HISTORY_FILE=join(ROOT,"seo/sitemap-content-history.json");
export const LASTMOD_FILE=join(ROOT,"site/src/data/sitemap-lastmod.json");

// PR #497 changed the visible source-provenance explanation on all 3,880
// published model pages. The existing 85% mass-change guard correctly paused
// automatic lastmod updates for manual review. This is a one-time, narrowly
// scoped approval for the audited exact ui.ts Git blob (not a generic bypass).
const REVIEWED_PR497_UI_BLOB="28211dd60814f9e7dfbe95e6527ae38d90eace45";
// PR #467 visibly corrected the introductory source-provenance text on each
// of the 3,900 model pages (390 per locale) and reviewed exact technical labels.
// Only these exact public code blobs, together with the already consumed
// PR #497 checkpoint, can authorize a ONE-TIME, narrowly bounded reconciliation.
const REVIEWED_PR467_BLOBS={
  "site/src/lib/ui.ts":"3d637a7b937bda114133d20f714dfefd48607e57",
  "site/src/lib/published-spec-translations.ts":"a1b7db7dc788eb9786aea5ccd81b33d192321047",
  "site/src/lib/reviewed-live-technical-headings-20261122.ts":"68ce6719ffcf203a4f4353d9ec64ab942fbb18f8",
};
const PR467_LOCALES=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
function hasReviewedPr467Sources(){
  try{
    return Object.entries(REVIEWED_PR467_BLOBS).every(([path,expected])=>
      execFileSync("git",["rev-parse","HEAD:"+path],{
        cwd:ROOT,encoding:"utf8",stdio:["ignore","pipe","ignore"]
      }).trim()===expected);
  }catch{return false;}
}
const isModelPage=url=>/^https:\/\/tractorvs\.com\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?tractors\/[a-z0-9-]+\/$/.test(url);
function hasReviewedPr497Source(){
  try{
    const sha=execFileSync("git",["rev-parse","HEAD:site/src/lib/ui.ts"],{
      cwd:ROOT,encoding:"utf8",stdio:["ignore","pipe","ignore"]
    }).trim();
    return sha===REVIEWED_PR497_UI_BLOB;
  }catch{return false;}
}

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
  // Astro scoped CSS can append a data-astro-cid-* attribute after this ID,
  // so the identity marker is not necessarily the final attribute before '>'.
  // Strip exactly ONE well-formed marker from ONLY the audited spec-card tag,
  // preserving unrelated source, accessibility, CSS and visible attributes.
  const significantMain=normalize(main).replace(/<article\b[^>]*>/gi,tag=>{
    const classValue=tag.match(/(?:^|\s)class=(["'])(.*?)\1/i)?.[2]||"";
    if(!classValue.split(/\s+/).includes("model-spec-card"))return tag;
    const idAttribute=/\s+data-spec-id="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"(?=\s|\/?>)/gi;
    if([...tag.matchAll(idAttribute)].length!==1)return tag;
    return tag.replace(idAttribute,"");
  });
  return createHash("sha256").update([normalize(title),normalize(desc),significantMain].join("\n")).digest("hex");
}
export function deriveHistory({pages,previous,now=new Date(),minPages=100,reviewedPr497Copy=false,reviewedPr467Copy=false}){
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
  const oldModelUrls=Object.keys(previous.pages).filter(isModelPage);
  const changedOldModels=new Set();
  let changedOldOther=0;
  const timestamp=now.toISOString();
  for(const [url,digest] of pages){
    if(!/^[0-9a-f]{64}$/.test(digest))reject("Invalid rendered content digest");
    const old=previous.pages[url];
    const modified=baseline?null:old?.digest===digest?old.modified:(timestamp);
    if(!baseline&&old?.digest!==digest){
      changed++;
      if(!old)added++;
      else if(isModelPage(url))changedOldModels.add(url);
      else changedOldOther++;
    }
    if(modified!==null && modified!==undefined){
      if(!Number.isFinite(Date.parse(modified))||Date.parse(modified)>now.getTime()+1000)
        reject("Invalid/future lastmod record for "+url);
      dates.dates[new URL(url).pathname]=modified;
    }
    updated.pages[url]={digest,modified:modified??null};
  }
  if(existing && changed>Math.max(100,Math.floor(pages.length*0.85))){
    // Fail closed unless the previously reviewed PR #497 ui.ts blob is still
    // byte-identical AND every pre-existing model page changed. Normal minor
    // releases (at most 100 other/new pages) may coexist. This exception is
    // permanently consumed when the next provenance checkpoint is saved.
    const reviewed=reviewedPr497Copy &&
      previous.reviewedBulkCopyPr497!==true &&
      oldModelUrls.length>=3000 &&
      changedOldModels.size===oldModelUrls.length &&
      oldModelUrls.every(url=>changedOldModels.has(url)) &&
      changedOldOther<=100 && added<=100;
    const modelLocaleCounts=Object.fromEntries(PR467_LOCALES.map(lang=>[lang,0]));
    for(const url of changedOldModels){
      const part=new URL(url).pathname.split("/")[1];
      const lang=PR467_LOCALES.includes(part)&&part!=="en"?part:"en";
      modelLocaleCounts[lang]++;
    }
    const reviewed467=reviewedPr467Copy &&
      previous.reviewedBulkCopyPr497===true &&
      previous.reviewedBulkCopyPr467!==true &&
      oldModelUrls.length===3900 && changedOldModels.size===3900 &&
      PR467_LOCALES.every(lang=>modelLocaleCounts[lang]===390) &&
      added===0 && changedOldOther<=25;
    if(!reviewed&&!reviewed467){
      // Diagnostics only: never bypass the SEO provenance gate. Count the
      // affected locales without leaking page text, credentials or hashes.
      const localeCounts={};
      for(const url of changedOldModels){
        const pathLocale=new URL(url).pathname.split("/")[1];
        const locale=["tr","zh","hi","pt-br","fr","de","ru","ja","es"].includes(pathLocale)?pathLocale:"en";
        localeCounts[locale]=(localeCounts[locale]||0)+1;
      }
      reject("Unusually broad rendered content changes, manual SEO review required: "+
        JSON.stringify({changed,pages:pages.length,changedOldModels:changedOldModels.size,
          changedOldOther,added,localeCounts}));
    }
    if(reviewed)updated.reviewedBulkCopyPr497=true;
    if(reviewed467)updated.reviewedBulkCopyPr467=true;
  }
  if(previous.reviewedBulkCopyPr497===true)updated.reviewedBulkCopyPr497=true;
  if(previous.reviewedBulkCopyPr467===true)updated.reviewedBulkCopyPr467=true;
  return {history:updated,lastmod:dates,summary:{baseline,pages:pages.length,significant_changes:changed,new_pages:added,dated_pages:Object.keys(dates.dates).length,reviewed_bulk_copy_pr497:updated.reviewedBulkCopyPr497===true,reviewed_bulk_copy_pr467:updated.reviewedBulkCopyPr467===true}};
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
  const result=deriveHistory({pages,previous,now,minPages,reviewedPr497Copy:hasReviewedPr497Source(),reviewedPr467Copy:hasReviewedPr467Sources()});
  // Write only on successful full inspection; no silent partial sitemap.
  writeFileSync(historyPath,JSON.stringify(result.history,null,2)+"\n");
  writeFileSync(lastmodPath,JSON.stringify(result.lastmod,null,2)+"\n");
  return result.summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log("TRACTORVS_CONTENT_VERIFIED_LASTMOD "+JSON.stringify(auditBuiltSitemap()));}
  catch(e){console.error(e);process.exitCode=1;}
}
