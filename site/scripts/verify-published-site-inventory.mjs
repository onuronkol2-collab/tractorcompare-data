/**
 * Safeguard public catalogue releases against sudden model loss, missing locale
 * pages, or mismatched XML sitemap inventory. Read-only; no database access.
 * Baseline is maintained by the existing anon-only published-catalogue sync.
 */
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import {scanHeadTags} from "./verify-sitewide-meta-descriptions.mjs";
import {readOpeningTagAttribute as attr,googleIndexingBlockedByMeta} from "./seo-html-attributes.mjs";

const defaultRoot=resolve(fileURLToPath(new URL("../",import.meta.url)));
export const PUBLIC_LOCALES=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];

function check(value,message){
 if(!value)throw new Error("[TractorVS RELEASE BLOCKED] "+message);
}
function read(path){
 check(existsSync(path),"Missing production file: "+path);
 return readFileSync(path,"utf8");
}
function modelPaths(directory){
 check(existsSync(directory),"Published models directory absent: "+directory);
 return readdirSync(directory,{withFileTypes:true})
  .filter(entry=>entry.isDirectory()&&existsSync(join(directory,entry.name,"index.html")))
  .map(entry=>entry.name).sort();
}

// HTML hreflang must be reciprocal, and catalogue discovery must not depend
// on JavaScript. Model URLs stay stable across languages by design.
export const PUBLIC_LOCALE_TAGS={
 en:"en",tr:"tr",zh:"zh-Hans",hi:"hi","pt-br":"pt-BR",
 fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es",
};
const modelPath=(locale,slug)=>
 "/"+(locale==="en"?"":locale+"/")+"tractors/"+slug+"/";

/** Inspect actual head links; a second conflicting annotation must never
 * disappear when a language-to-URL map is constructed. Codes are case-insensitive.
 * Keep an explicit language allowlist rather than accepting unreviewed locales.
 */
export function inspectLocaleAnnotations(links){
 const canonical=[],alternates=new Map(),errors=[];
 for(const link of links){
  const rel=(attr(link,"rel")||"").toLowerCase().trim().split(/\s+/);
  const href=attr(link,"href");
  const code=attr(link,"hreflang")?.trim().toLowerCase();
  if(rel.includes("canonical")){
   canonical.push(href);
   if(code||rel.includes("alternate"))errors.push("Canonical mixed with alternate language annotation");
  }
  if(!rel.includes("alternate")||code===undefined)continue;
  if(!code||!href)errors.push("Empty hreflang or URL");
  if(alternates.has(code))errors.push("Duplicate hreflang "+code);
  if(attr(link,"media")!==null||attr(link,"type")!==null)
   errors.push("Mixed hreflang representation "+code);
  if(!Object.values(PUBLIC_LOCALE_TAGS).some(tag=>tag.toLowerCase()===code)&&code!=="x-default")
   errors.push("Unexpected hreflang "+code);
  alternates.set(code,href);
 }
 return {canonical,alternates,errors};
}

/** Validate every published model URL before a production deployment. */
export function verifyModelDiscoveryMarkup({
 html,catalogLinks,slug,locale,origin="https://tractorvs.com"
}){
 check(PUBLIC_LOCALES.includes(locale),"Unsupported model locale: "+locale);
 const path=modelPath(locale,slug);
 const url=origin+path;
 check(catalogLinks.has(path),"Missing server-rendered catalogue link to "+path);
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1]||"";
 const {links,metas}=scanHeadTags(head);
 const annotations=inspectLocaleAnnotations(links);
 check(annotations.errors.length===0,
   "Conflicting model SEO annotations: "+url+" "+annotations.errors.join("; "));
 check(annotations.canonical.length===1&&annotations.canonical[0]===url,
   "Missing, duplicate or wrong model canonical: "+url);
 check(html.includes('name="robots" content="index,follow'),
   "Published model is not explicitly indexable: "+url);
 check(!googleIndexingBlockedByMeta(metas),
   "Published model has noindex: "+url);
 for(const [alternateLocale,tag] of Object.entries(PUBLIC_LOCALE_TAGS)){
  const alternate=origin+modelPath(alternateLocale,slug);
  check(annotations.alternates.get(tag.toLowerCase())===alternate,
    "Missing reciprocal hreflang "+tag+" for "+url);
 }
 check(annotations.alternates.get("x-default")===origin+modelPath("en",slug),
   "Missing x-default to English source model page: "+url);
 return true;
}

export function safePublishedModelFloor(snapshot,configuredMinimum=100){
 check(Number.isSafeInteger(configuredMinimum)&&configuredMinimum>=1,
  "MIN_PUBLIC_TRACTOR_PAGES must be a positive integer");
 check(snapshot&&snapshot.source==="anon_public_view"&&
   Number.isSafeInteger(snapshot.published_models)&&snapshot.published_models>=1&&
   Number.isSafeInteger(snapshot.public_rows)&&snapshot.public_rows>=snapshot.published_models&&
   typeof snapshot.fingerprint==="string"&&/^[a-f0-9]{64}$/.test(snapshot.fingerprint),
   "Published-catalogue baseline is missing or untrustworthy");
 // Prevent a >5% drop while permitting a few deliberate withdrawals.
 return Math.max(configuredMinimum,Math.ceil(snapshot.published_models*0.95));
}

export function verifyPublishedSiteInventory({
 projectRoot=defaultRoot,origin="https://tractorvs.com",configuredMinimum=100
}={}){
 const snapshot=JSON.parse(read(join(projectRoot,"src/data/public-catalog-sync.json")));
 const floor=safePublishedModelFloor(snapshot,configuredMinimum);
 const dist=join(projectRoot,"dist");
 const modelSlugs=modelPaths(join(dist,"tractors"));
 check(modelSlugs.length>=floor,
   "English model pages dropped to "+modelSlugs.length+
   "; minimum protected by public-catalogue baseline is "+floor+
   " of "+snapshot.published_models);
 const entries=readdirSync(dist).filter(s=>/^sitemap-\d+\.xml$/.test(s));
 check(entries.length>0,"Missing actual XML sitemap entries");
 const sitemapLocs=new Set(entries.flatMap(name=>
   [...read(join(dist,name)).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1])));
 check(sitemapLocs.size>0,"XML sitemap is empty");
 const imageSitemap=read(join(dist,"image-sitemap.xml"));
 check(imageSitemap.includes("<urlset")&&imageSitemap.includes("</urlset>"),
   "Image sitemap file is missing or malformed");
 const matchingLocales={};
 for(const locale of PUBLIC_LOCALES){
  const prefix=locale==="en"?"":locale+"/";
  const home=read(join(dist,prefix+"index.html"));
  const homeHead=home.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1]||"";
  check(!googleIndexingBlockedByMeta(scanHeadTags(homeHead).metas),"Public homepage is noindex: "+locale);
  const slugs=modelPaths(join(dist,prefix+"tractors"));
  check(slugs.length===modelSlugs.length,
    "Missing "+locale+" model pages: "+slugs.length+" vs "+modelSlugs.length);
  check(slugs.every((slug,index)=>slug===modelSlugs[index]),
    "Model identity/slug mismatch in "+locale+" public catalogue");
  const modelUrlPrefix=origin+"/"+prefix+"tractors/";
  const expectedModelUrls=new Set(slugs.map(slug=>modelUrlPrefix+slug+"/"));
  // The catalogue index /tractors/ is NOT a model URL.
  const actualModelUrls=[...sitemapLocs].filter(url=>
    url.startsWith(modelUrlPrefix) && url!==modelUrlPrefix);
  check(actualModelUrls.length===expectedModelUrls.size,
    "Sitemap has "+actualModelUrls.length+" "+locale+" model URLs, expected "+expectedModelUrls.size);
  for(const url of actualModelUrls)
    check(expectedModelUrls.has(url),"Unexpected "+locale+" model URL in sitemap: "+url);
  for(const url of expectedModelUrls)
    check(sitemapLocs.has(url),"Published "+locale+" model is missing from sitemap: "+url);
  const catalogueHtml=read(join(dist,prefix+"tractors/index.html"));
  const catalogueLinks=new Set([...catalogueHtml.matchAll(
    /<a\b[^>]*class="tractor-card-main"[^>]*href="([^"]+)"[^>]*>/g
  )].map(match=>match[1]));
  for(const slug of slugs){
   const html=read(join(dist,prefix+"tractors",slug,"index.html"));
   verifyModelDiscoveryMarkup({html,catalogLinks:catalogueLinks,slug,locale,origin});
  }
  matchingLocales[locale]=slugs.length;
 }
 return {baseline:snapshot.published_models,protectedFloor:floor,models:modelSlugs.length,localeModels:matchingLocales};
}
