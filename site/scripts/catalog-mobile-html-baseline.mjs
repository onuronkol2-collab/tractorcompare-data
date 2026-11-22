/** Read-only live catalogue HTML footprint and SEO link integrity.
 * This is NOT a mobile speed test and does not claim LCP/INP improvements.
 * No anonymous database calls, private drafts, paid APIs, or IndexNow writes.
 */
import {appendFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {gzipSync,brotliCompressSync,constants} from "node:zlib";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
export const ORIGIN="https://tractorvs.com";
export const PREFIXES=["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"];
export function inspectCatalogHTML(html,url){
 if(typeof html!=="string"||html.length>2_000_000)throw Error("Unexpected catalog HTML response");
 const pathname=new URL(url).pathname;
 const links=[...html.matchAll(/<a\b[^>]*class=["'][^"']*\btractor-card-main\b[^"']*["'][^>]*href=["']([^"']+)["']/gi)].map(m=>m[1]);
 const cards=[...html.matchAll(/<article\b[^>]*class=["'][^"']*\btractor-card\b[^"']*["']/gi)].length;
 const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)||[];
 if(!cards||links.length!==cards)throw Error("Missing SSR cards or crawlable model links: "+pathname);
 if(canonical.length!==1||!canonical[0].includes('href="'+url+'"'))
  throw Error("Catalog canonical mismatch: "+pathname);
 if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))
  throw Error("Catalog noindex detected: "+pathname);
 const expected=pathname.endsWith("/")?pathname:pathname+"/";
 if(links.some(x=>!x.startsWith(expected)||!/^\/[^?#]+\/$/.test(x)))
  throw Error("Noncanonical or Javascript model detail link: "+pathname);
 if(new Set(links).size!==links.length)throw Error("Duplicate SSR model link: "+pathname);
 // Ten-language matching COUNTS are insufficient: different models may be omitted.
 // Hash each locale's complete sorted public slug set without logging all URLs.
 const slugs=links.map(link=>link.slice(expected.length,-1));
 if(slugs.some(slug=>!slug||slug.includes("/")))
  throw Error("Invalid SSR model slug: "+pathname);
 const modelSetDigest=createHash("sha256").update(slugs.sort().join("\n")).digest("hex");
 const sourceBytes=Buffer.from(html,"utf8");
 const bodyBytes=sourceBytes.length;
 // Local codec estimates, NOT observed network transfer, Lighthouse, or field CWV.
 const gzipEstimate=gzipSync(sourceBytes,{level:6}).length;
 const brotliEstimate=brotliCompressSync(sourceBytes,{
  params:{[constants.BROTLI_PARAM_QUALITY]:4}
 }).length;
 return {url,html_bytes:bodyBytes,html_kb:Math.round(bodyBytes/102.4)/10,
   gzip_estimate_bytes:gzipEstimate,brotli_estimate_bytes:brotliEstimate,
   bytes_per_card:Math.round(bodyBytes/cards),card_count:cards,
   model_links:links.length,model_set_sha256:modelSetDigest,
   mode:"live_html_with_local_compression_estimates_not_wire_or_field_CWV"};
}
export async function auditCatalogFootprint({fetchFn=fetch}={}){
 const items=[];
 for(const prefix of PREFIXES){
  const url=ORIGIN+"/"+prefix+"tractors/";
  const response=await fetchFn(url,{redirect:"error",signal:AbortSignal.timeout(20000)});
  if(response.status!==200)throw Error("Catalog HTTP "+response.status+": "+url);
  if((response.headers.get("x-robots-tag")||"").includes("noindex"))
   throw Error("Catalog HTTP noindex: "+url);
  items.push(inspectCatalogHTML(await response.text(),url));
 }
 const counts=new Set(items.map(x=>x.card_count));
 if(counts.size!==1)throw Error("Live published model counts differ by locale");
 const modelSets=new Set(items.map(x=>x.model_set_sha256));
 if(modelSets.size!==1)throw Error("Live published model identities differ by locale despite equal counts");
 return items;
}
export function reportCatalogFootprint(items){
 return ["### TractorVS catalogue HTML and link footprint — live read-only",
  "HTML bytes are decoded source bytes. Gzip/Brotli figures are **local codec estimates**, NOT measured network transfer, Cloudflare headers, LCP, INP, CLS or browser memory.",
  "All ten catalogues must contain the **same exact published slug set**, not merely the same number of cards. SHA-256 is calculated from sorted model slugs.",
  "Do not remove SSR model links or enable pagination before verified global search, self-canonical page URLs and ten-locale coverage.",
  "| Locale catalogue | HTML KiB | Gzip est. KiB | Brotli est. KiB | Bytes/card | SSR cards | Model links | Model-set SHA-256 prefix |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...items.map(x=>"| "+new URL(x.url).pathname+" | "+x.html_kb+" | "+
   (x.gzip_estimate_bytes/1024).toFixed(1)+" | "+
   (x.brotli_estimate_bytes/1024).toFixed(1)+" | "+
   x.bytes_per_card+" | "+x.card_count+" | "+x.model_links+
   " | "+x.model_set_sha256.slice(0,12)+" |"),""].join("\n");
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const result=await auditCatalogFootprint();
  const markdown=reportCatalogFootprint(result);
  console.log("TRACTORVS_CATALOG_FOOTPRINT "+JSON.stringify(result));
  console.log(markdown);
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown+"\n");
 }catch(error){
  console.error("TRACTORVS_CATALOG_FOOTPRINT_ERROR "+String(error?.message||error).slice(0,500));
  process.exitCode=1;
 }
}
