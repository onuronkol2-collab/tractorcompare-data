/**
 * Safeguard public catalogue releases against sudden model loss, missing locale
 * pages, or mismatched XML sitemap inventory. Read-only; no database access.
 * Baseline is maintained by the existing anon-only published-catalogue sync.
 */
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";

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
  check(!/content="noindex/i.test(home),"Public homepage is noindex: "+locale);
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
  const sampleUrl=origin+"/"+prefix+"tractors/"+slugs[0]+"/";
  const sampleHtml=read(join(dist,prefix+"tractors",slugs[0],"index.html"));
  check(sampleHtml.includes('rel="canonical" href="'+sampleUrl+'"'),
    "Wrong "+locale+" model canonical on "+sampleUrl);
  check(!/content="noindex/i.test(sampleHtml),
    "Indexing unexpectedly disabled for "+sampleUrl);
  matchingLocales[locale]=slugs.length;
 }
 return {baseline:snapshot.published_models,protectedFloor:floor,models:modelSlugs.length,localeModels:matchingLocales};
}
