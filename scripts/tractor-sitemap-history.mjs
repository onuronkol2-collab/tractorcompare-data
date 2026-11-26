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
export const DIGEST_ALGORITHM="astro-market-price-hash-v2";
export function significantContentDigest(html,url,{legacy=false}={}){

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
  // The public checkpoint comparison (run 45649911745) proved that the
  // generated price component module filename changes on every model page
  // even when its static content is identical. Ignore ONLY the cache-busting
  // suffix of this exact empty, local module script. Preserve its presence,
  // component identity, all other attributes, inline JSON, and all content.
  // A rel=nofollow hint on an already-existing visitor-state link does not
  // change editorial content or its destination. Normalize ONLY the exact
  // utility-link forms introduced by PR #753 (compare left ID, forum tractor
  // ID, and catalogue brand search); preserve href, label, every other rel,
  // attributes and all actual page content. Keep old checkpoint hashes valid.
  // This is a digest-only substitution, not HTML rewriting or sanitization.
  const visitorStateMain=legacy?significantMain:significantMain.replace(
    /<a(?=[\s/>])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi,tag=>{
      const route=tag.match(/(?:^<a|\s)href="([^"]*)"(?=\s|>)/i)?.[1];
      if(!route)return tag;
      const path=/^\/(?:(?:tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?(?:(?:compare\/\?left=|forum\/\?tractor=)[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}|tractors\/\?q=(?:[A-Za-z0-9_.!~*'()-]|%[0-9a-f]{2})+)$/i;
      if(!path.test(route))return tag;
      // Require the exact generated adjacent href/rel pair, without consuming
      // any other rel tokens or accepting duplicated rel attributes.
      if([...tag.matchAll(/\srel\s*=/gi)].length!==1)return tag;
      return tag.replace(/(\shref="[^"]*") rel="nofollow"(?=\s|>)/, "$1");
    });
  const stableMain=legacy?visitorStateMain:visitorStateMain.replace(
    /<script(?=[\s/>])[^>]*><\/script(?=[\s/>])[^>]*>/gi,tag=>{
      // Include browser-tolerated end-tag whitespace and attributes
      // (CodeQL js/bad-tag-filter). Keep the original tag and delimiters:
      // this is a digest-only substitution, never an HTML sanitizer.
      if(!/\stype="module"(?=\s|>)/.test(tag))return tag;
      return tag.replace(/(\ssrc="\/_astro\/TractorMarketPrice\.astro_astro_type_script_index_0_lang\.)[A-Za-z0-9_-]{8,32}(\.js")(?=\s|>)/g,"$1__BUILD_HASH__$2");
    });
  return createHash("sha256").update([normalize(title),normalize(desc),stableMain].join("\n")).digest("hex");
}
export function deriveHistory({pages,previous,now=new Date(),minPages=100,reviewedPr497Copy=false,reviewedPr467Copy=false}){
  if(!previous||previous.version!==1||!previous.pages||typeof previous.pages!=="object")
    reject("Invalid previous history checkpoint");
  if(pages.length<minPages)reject("Too few generated pages to update sitemap history");
  const existing=Object.keys(previous.pages).length;
  if(existing && pages.length<Math.ceil(existing*0.95))
    reject("Public sitemap shrinking over 5%; manual review required");
  const baseline=existing===0;
  const updated={version:1,pages:{},...(previous.digestAlgorithm?{digestAlgorithm:previous.digestAlgorithm}:{})};
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
function readPublishedHtml(dist,url){
  const htmlPath=join(dist,new URL(url).pathname.substring(1),"index.html");
  if(!existsSync(htmlPath))reject("Sitemap page not generated: "+url);
  return readFileSync(htmlPath,"utf8");
}
// Reconstruct only the historically published model identities in the
// disposable, pinned checkout. New public models can arrive between builds;
// never alter Supabase or the current production build to recreate history.
export function historicalModelSlugs(previous){
  const urls=Object.keys(previous.pages||{}).filter(isModelPage);
  const slugs=urls.filter(url=>new URL(url).pathname.startsWith("/tractors/"))
    .map(url=>new URL(url).pathname.split("/")[2]).sort();
  const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  const expected=new Set(slugs.flatMap(slug=>locales.map(lang=>ORIGIN+
    (lang==="en"?"":"/"+lang)+"/tractors/"+slug+"/")));
  if(!slugs.length||slugs.some(slug=>!/-[0-9a-f]{8}$/.test(slug))||
    expected.size!==urls.length||urls.some(url=>!expected.has(url)))
    reject("Historical model identity inventory incomplete");
  return slugs;
}
export function prepareHistoricalCatalogSource(source,previous){
  const slugs=historicalModelSlugs(previous);
  const anchor="  const tractors = [...groups.values()].map((tractor) => {";
  if(source.split(anchor).length!==2)reject("Unexpected historical catalogue source");
  const patch="  const historicalSlugs = new Set("+JSON.stringify(slugs)+");\n"+
    "  const historicalTractors = [...groups.values()].filter(tractor => historicalSlugs.has(tractor.slug));\n"+
    "  if (historicalTractors.length !== historicalSlugs.size || new Set(historicalTractors.map(tractor => tractor.slug)).size !== historicalSlugs.size) throw new Error('Historical public catalogue identity mismatch');\n"+
    "  const tractors = historicalTractors.map((tractor) => {";
  return source.replace(anchor,patch);
}
// Migrate only by reconstructing EVERY persisted old hash. Unknown or
// changed historical inputs fail closed; never reset dates or seed over them.
export function migrateDigestCheckpoint(previous,legacyDist){
  if(previous.version!==1||!previous.pages||previous.digestAlgorithm)
    reject("Invalid legacy digest checkpoint");
  if(!legacyDist)reject("Legacy digest migration requires the verified historical build");
  const urls=extractPublishedUrls(legacyDist);
  if(urls.length!==Object.keys(previous.pages).length)
    reject("Legacy digest migration inventory mismatch");
  const pages={};
  for(const url of urls){
    const html=readPublishedHtml(legacyDist,url);
    const old=previous.pages[url];
    if(!old||significantContentDigest(html,url,{legacy:true})!==old.digest)
      reject("Legacy digest migration cannot reproduce checkpoint: "+url);
    pages[url]={...old,digest:significantContentDigest(html,url)};
  }
  return {...previous,pages,digestAlgorithm:DIGEST_ALGORITHM};
}
export function auditBuiltSitemap({dist=join(ROOT,"site/dist"),historyPath=HISTORY_FILE,lastmodPath=LASTMOD_FILE,now=new Date(),minPages=100,legacyDist=process.env.SITEMAP_LEGACY_DIST}={}){
  const urls=extractPublishedUrls(dist);
  const pages=urls.map(url=>[url,significantContentDigest(readPublishedHtml(dist,url),url)]);
  let previous=loadJson(historyPath,{version:1,pages:{}});
  if(previous.version!==1||!previous.pages||typeof previous.pages!=="object")
    reject("Invalid previous history checkpoint");
  if(previous.digestAlgorithm && previous.digestAlgorithm!==DIGEST_ALGORITHM)
    reject("Unknown sitemap digest algorithm");
  if(!previous.digestAlgorithm){
    if(Object.keys(previous.pages).length){
      previous=migrateDigestCheckpoint(previous,legacyDist);
      console.log("TRACTORVS_DIGEST_MIGRATION "+JSON.stringify({verifiedLegacyPages:Object.keys(previous.pages).length,algorithm:DIGEST_ALGORITHM}));
    }else previous={...previous,digestAlgorithm:DIGEST_ALGORITHM};
  }
  const result=deriveHistory({pages,previous,now,minPages,reviewedPr497Copy:hasReviewedPr497Source(),reviewedPr467Copy:hasReviewedPr467Sources()});
  // Write only on successful full inspection; no silent partial sitemap.
  writeFileSync(historyPath,JSON.stringify(result.history,null,2)+"\n");
  writeFileSync(lastmodPath,JSON.stringify(result.lastmod,null,2)+"\n");
  return result.summary;
}
// A second production build can see concurrent public DB changes even
// if Git HEAD never moved. Verify the actual rebuilt HTML and emitted dates
// against the candidate checkpoint before allowing any persistent write.
export function verifyRebuiltCheckpoint({dist=join(ROOT,"site/dist"),historyPath=HISTORY_FILE,lastmodPath=LASTMOD_FILE}={}){
  const history=loadJson(historyPath,null), map=loadJson(lastmodPath,null);
  if(history?.version!==1||history.digestAlgorithm!==DIGEST_ALGORITHM||!history.pages||map?.version!==1||!map.dates)
    reject("Invalid rebuilt sitemap checkpoint");
  const urls=extractPublishedUrls(dist);
  if(urls.length!==Object.keys(history.pages).length)
    reject("Rebuilt catalogue drift: page inventory changed");
  const expectedDates={};
  for(const url of urls){
    const page=history.pages[url];
    if(!page||significantContentDigest(readPublishedHtml(dist,url),url)!==page.digest)
      reject("Rebuilt catalogue drift: rendered page changed: "+url);
    if(page.modified!=null)expectedDates[new URL(url).pathname]=page.modified;
  }
  const sorted=o=>JSON.stringify(Object.entries(o).sort(([a],[b])=>a.localeCompare(b)));
  if(sorted(expectedDates)!==sorted(map.dates))reject("Rebuilt sitemap date map differs from history");
  const index=readFileSync(join(dist,"sitemap-index.xml"),"utf8");
  const seen=new Set();
  for(const child of locs(index)){
    const path=new URL(child).pathname;
    if(!/^\/sitemap-[0-9]+\.xml$/.test(path))continue;
    const xml=readFileSync(join(dist,path.slice(1)),"utf8");
    for(const [,entry] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)){
      const entries=locs(entry);
      if(entries.length!==1||!history.pages[entries[0]]||seen.has(entries[0]))reject("Invalid rebuilt sitemap URL");
      const url=entries[0];seen.add(url);
      const dates=[...entry.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m=>m[1]);
      const expected=history.pages[url].modified;
      if(expected==null?dates.length!==0:dates.length!==1||!Number.isFinite(Date.parse(dates[0]))||Date.parse(dates[0])!==Date.parse(expected))
        reject("Rebuilt sitemap XML lastmod mismatch: "+url);
    }
  }
  if(seen.size!==urls.length)reject("Incomplete rebuilt sitemap XML verification");
  return {verifiedPages:urls.length,verifiedDates:Object.keys(expectedDates).length};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    if(process.argv[2]==="--prepare-historical-catalog"){
      const checkout=resolve(ROOT,"sitemap-legacy-checkpoint");
      const expected="c86bc0f39906d53e1e3805f724185fb1b3ace767";
      if(execFileSync("git",["rev-parse","HEAD"],{cwd:checkout,encoding:"utf8"}).trim()!==expected)
        reject("Unexpected historical checkpoint revision");
      const catalogPath=join(checkout,"site/src/lib/catalog.ts");
      const original=execFileSync("git",["show","HEAD:site/src/lib/catalog.ts"],{cwd:checkout,encoding:"utf8"});
      if(readFileSync(catalogPath,"utf8")!==original)reject("Historical catalogue source already modified");
      const previous=loadJson(HISTORY_FILE,null);
      if(!previous||previous.digestAlgorithm)reject("Unexpected historical migration ledger");
      writeFileSync(catalogPath,prepareHistoricalCatalogSource(original,previous));
      console.log("TRACTORVS_HISTORICAL_MODEL_SCOPE "+historicalModelSlugs(previous).length);
    }else if(process.argv[2]==="--verify-rebuilt-checkpoint"&&process.argv.length===3){
      console.log("TRACTORVS_REBUILT_CHECKPOINT "+JSON.stringify(verifyRebuiltCheckpoint()));
    }else if(process.argv.length===2){
      console.log("TRACTORVS_CONTENT_VERIFIED_LASTMOD "+JSON.stringify(auditBuiltSitemap()));
    }else reject("Unknown sitemap history argument");
  }
  catch(e){console.error(e);process.exitCode=1;}
}
