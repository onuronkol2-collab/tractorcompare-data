/**
 * Fail-closed, read-only production release proof for the second 15-photo
 * pilot. A main-branch merge is NOT evidence of actual Cloudflare delivery.
 * Verify all 30 HTTPS image SHA/bytes/MIME, all 15 public model-page
 * attributions/canonicals/alt-picture, plus 3 held photo IDs remaining 404.
 * No Wikimedia, Supabase, paid image processing or publishing.
 */
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {PUBLIC_IMAGE_SITEMAP,PUBLICATION_HOLD_IDS}
  from "./photo-mobile-second-batch-public-coverage.mjs";

export const LIVE_ORIGIN="https://tractorvs.com";
/** These two licensed images appear on the public editorial technical glossary,
 * not a published tractor model page. Demand real attribution for BOTH languages.
 */
export const EDITORIAL_SHOWCASE_IDS=Object.freeze([
  "case-ih-puma-150-chris-woodrich-2025",
  "mccormick-x5-120-marcelx42-2023"
]);
export const EDITORIAL_GLOSSARY_PAGES=Object.freeze([
  "/guides/tractor-technical-terms/",
  "/tr/guides/tractor-technical-terms/"
]);
const editorialSet=new Set(EDITORIAL_SHOWCASE_IDS);
const evidence=JSON.parse(readFileSync(
  new URL("../docs/photo-mobile-batch15-evidence.json",import.meta.url),"utf8"));

export function expectedLiveBatch15(input=evidence){
 if(input.schema!=="tractorvs-second-batch15-sha-pinned-release-v1"||
    input.records?.length!==15||input.assetCount!==30||
    input.heldUnpublishedPhotoIds?.length!==3||
    input.publishApproved!==false)
   throw Error("Wrong 15-source rights/provenance ledger");
 const files=[],identities=new Set();
 for(const record of input.records){
   if(identities.has(record.fileId)||
      !/^[a-z0-9-]+$/.test(record.fileId)||
      !/^CC BY-SA (3\.0|4\.0)$/.test(record.licenseName)||
      !record.photographer||!record.sourcePage?.startsWith(
        "https://commons.wikimedia.org/wiki/File:")||
      record.derivatives?.length!==2)
     throw Error("Wrong photo identity or license");
   identities.add(record.fileId);
   for(const d of record.derivatives){
     if(!/^[a-f0-9]{64}$/.test(d.sha256)||d.width!==720||
        d.psnrDb<30||!["jpg","webp"].includes(d.ext))
       throw Error("Invalid verified image digest");
     files.push({urlPath:"/images/tractors/"+record.fileId+"-720."+d.ext,
       mime:d.ext==="jpg"?"image/jpeg":"image/webp",
       bytes:d.bytes,sha256:d.sha256});
   }
 }
 if(new Set(files.map(x=>x.urlPath)).size!==30||files.length!==30)
   throw Error("Expected 30 distinct licensed derivative URLs");
 for(const fileId of PUBLICATION_HOLD_IDS){
   if(identities.has(fileId))throw Error("Unpublished photo leaked into production");
 }
 return {files,records:input.records,held:PUBLICATION_HOLD_IDS};
}
export function findPublicModelPages(xml,records=expectedLiveBatch15().records.filter(
 record=>!editorialSet.has(record.fileId))){
 if(typeof xml!=="string"||xml.length>2_000_000||
   !/<urlset\b/.test(xml)||!/<image:loc>/.test(xml))
   throw Error("Missing or malformed live image sitemap");
 const match=new Map();
 for(const entry of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)){
   const body=entry[1];
   const page=/<loc>\s*([^<]+)<\/loc>/.exec(body)?.[1]?.replaceAll("&amp;","&");
   if(!page)continue;
   let url;
   try{url=new URL(page);}catch{throw Error("Malformed public photo-page URL");}
   if(url.origin!==LIVE_ORIGIN||url.search||url.hash)
     throw Error("Offsite or noncanonical sitemap photo page");
   if(!/^\/tr\/tractors\/[a-z0-9-]+\/$/.test(url.pathname))continue;
   const images=[...body.matchAll(/<image:loc>\s*([^<]+)<\/image:loc>/g)]
       .map(x=>x[1].replaceAll("&amp;","&"));
   for(const record of records){
     const full=LIVE_ORIGIN+"/images/tractors/"+record.fileId+"-1920.jpg";
     if(images.includes(full)){
       // One legitimately licensed photograph may be reused on multiple
       // PUBLISHED configuration/variant pages. Prove EVERY canonical page,
       // not only the first or incorrectly reject shared-license sources.
       if(!match.has(record.fileId))match.set(record.fileId,new Set());
       match.get(record.fileId).add(url.pathname);
     }
   }
 }
 if(match.size!==records.length)
   throw Error("Public model-page sitemap missing "+records.filter(x=>!match.has(x.fileId))
      .map(x=>x.fileId).join(","));
 // Values are sorted arrays of ALL actually published variant URLs for each
 // unique rights-reviewed image. Dedupe identical URL occurrences.
 for(const [fileId,paths] of match)match.set(fileId,[...paths].sort());
 return match;
}
/** A two-language editorial photo is genuinely public even without its own
 * tractor catalogue page. Requiring a model page would falsely block it.
 * Exact File IDs and the 2 published glossary routes are enforced.
 */
export function findPublicEditorialPages(xml,records=expectedLiveBatch15().records.filter(
 record=>editorialSet.has(record.fileId))){
 if(typeof xml!=="string"||xml.length>2_000_000||
    !/<urlset\b/.test(xml)||!/<image:loc>/.test(xml))
   throw Error("Missing or malformed editorial image sitemap");
 if(records.length!==2||!records.every(r=>editorialSet.has(r.fileId))||
    new Set(records.map(r=>r.fileId)).size!==2)
   throw Error("Exactly two verified glossary showcase sources expected");
 const map=new Map(records.map(r=>[r.fileId,new Set()]));
 for(const entry of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)){
   const body=entry[1];
   const raw=/<loc>\s*([^<]+)<\/loc>/.exec(body)?.[1]?.replaceAll("&amp;","&");
   if(!raw)continue;
   let url;
   try{url=new URL(raw);}catch{throw Error("Malformed editorial page URL");}
   if(url.origin!==LIVE_ORIGIN||url.search||url.hash)
     throw Error("Noncanonical editorial sitemap page URL");
   if(!EDITORIAL_GLOSSARY_PAGES.includes(url.pathname))continue;
   const images=new Set([...body.matchAll(/<image:loc>\s*([^<]+)<\/image:loc>/g)]
     .map(m=>m[1].replaceAll("&amp;","&")));
   for(const record of records){
     const full=LIVE_ORIGIN+"/images/tractors/"+record.fileId+"-1920.jpg";
     if(images.has(full))map.get(record.fileId).add(url.pathname);
   }
 }
 for(const [fileId,seen] of map){
   if(seen.size!==EDITORIAL_GLOSSARY_PAGES.length||
      !EDITORIAL_GLOSSARY_PAGES.every(path=>seen.has(path)))
      throw Error("Missing published EN/TR glossary photo "+fileId);
   map.set(fileId,[...seen].sort());
 }
 return map;
}
export function checkLiveModelPage(html,record,pagePath){
 const errors=[];
 const canonical=LIVE_ORIGIN+pagePath;
 if(!html.includes('rel="canonical" href="'+canonical+'"'))
   errors.push("canonical");
 if(/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(html))
   errors.push("unexpected noindex");
 if(!/<picture(?:\s[^>]*)?>/i.test(html))errors.push("missing picture element");
 for(const expected of ["image/webp",
    record.fileId+"-720.jpg",record.fileId+"-720.webp",
    record.fileId+"-1920.jpg",record.photographer,record.licenseUrl,
    "data-photo-url"])
   if(!html.includes(expected))errors.push("missing "+expected);
 return {ok:errors.length===0,errors};
}
async function get(fetchFn,url,accept){
 const res=await fetchFn(url,{
   signal:AbortSignal.timeout(18000),redirect:"error",headers:{"Accept":accept}
 });
 return res;
}
export async function proveBatch15Live({fetchFn=fetch,origin=LIVE_ORIGIN,
 pause=ms=>new Promise(r=>setTimeout(r,ms)),maxFirstAttempts=20}={}){
 if(origin!==LIVE_ORIGIN)throw Error("Production proof must use canonical HTTPS origin");
 const {files,records,held}=expectedLiveBatch15();
 const images=[];
 for(let index=0;index<files.length;index++){
   const file=files[index];
   let valid=false;
   for(let trial=0;trial<(index===0?maxFirstAttempts:1);trial++){
     let res;
     try{res=await get(fetchFn,origin+file.urlPath,file.mime);}
     catch(e){
       if(index===0&&trial<maxFirstAttempts-1){await pause(7000);continue;}
       throw Error("Live derivative network error "+file.urlPath+": "+e.message);
     }
     if(res.status!==200){
       if(index===0&&[404,502,503].includes(res.status)&&trial<maxFirstAttempts-1){
         await pause(7000);continue;
       }
       throw Error("Live derivative HTTP "+res.status+" "+file.urlPath);
     }
     if(!(res.headers.get("content-type")||"").toLowerCase().startsWith(file.mime))
       throw Error("Live derivative MIME mismatch "+file.urlPath);
     const data=Buffer.from(await res.arrayBuffer());
     if(data.length!==file.bytes||
        createHash("sha256").update(data).digest("hex")!==file.sha256)
       throw Error("Live derivative SHA/byte mismatch "+file.urlPath);
     images.push({path:file.urlPath,mime:file.mime,bytes:file.bytes,sha256:file.sha256});
     console.log("TRACTORVS_BATCH15_LIVE_IMAGE "+JSON.stringify(images.at(-1)));
     valid=true;break;
   }
   if(!valid)throw Error("No verified live derivative "+file.urlPath);
 }
 const sitemap=await get(fetchFn,PUBLIC_IMAGE_SITEMAP,"application/xml");
 if(sitemap.status!==200||!/(?:xml)/.test(sitemap.headers.get("content-type")||""))
   throw Error("Live image sitemap unavailable");
 const xml=await sitemap.text();
 const modelRecords=records.filter(item=>!editorialSet.has(item.fileId));
 const editorialRecords=records.filter(item=>editorialSet.has(item.fileId));
 if(modelRecords.length!==13||editorialRecords.length!==2)
   throw Error("Wrong public model/editorial photo source split");
 const pages=findPublicModelPages(xml,modelRecords);
 const editorialPages=findPublicEditorialPages(xml,editorialRecords);
 let pageCount=0,editorialPageCount=0;
 for(const item of modelRecords){
   const variantPaths=pages.get(item.fileId);
   for(const pagePath of variantPaths){
     const res=await get(fetchFn,origin+pagePath,"text/html");
     if(res.status!==200||!/text\/html/.test(res.headers.get("content-type")||""))
       throw Error("Live model HTML not available "+pagePath);
     const inspect=checkLiveModelPage(await res.text(),item,pagePath);
     if(!inspect.ok)throw Error("Model page CC/SEO/photo regression "+
       item.fileId+" "+pagePath+": "+inspect.errors.join(","));
     pageCount++;
     console.log("TRACTORVS_BATCH15_LIVE_MODEL "+
       JSON.stringify({fileId:item.fileId,path:pagePath,canonical:true,rightsVisible:true}));
   }
 }
 for(const item of editorialRecords){
   for(const pagePath of editorialPages.get(item.fileId)){
     const response=await get(fetchFn,origin+pagePath,"text/html");
     if(response.status!==200||
       !/text\/html/.test(response.headers.get("content-type")||""))
       throw Error("Live EN/TR glossary HTTP failed "+pagePath);
     const inspect=checkLiveModelPage(await response.text(),item,pagePath);
     if(!inspect.ok)throw Error("Editorial glossary CC/SEO/WebP regression "+
       item.fileId+" "+pagePath+": "+inspect.errors.join(","));
     editorialPageCount++;
     console.log("TRACTORVS_BATCH15_LIVE_EDITORIAL "+
       JSON.stringify({fileId:item.fileId,path:pagePath,canonical:true,rightsVisible:true}));
   }
 }
 let excludedUrls=0;
 for(const heldId of held){
   for(const ext of ["jpg","webp"]){
     const path="/images/tractors/"+heldId+"-720."+ext;
     const res=await get(fetchFn,origin+path,"image/"+(ext==="jpg"?"jpeg":"webp"));
     if(res.status!==404)throw Error("Unpublished model photo served unexpectedly "+path+" HTTP "+res.status);
     excludedUrls++;
   }
 }
 const summary={images:images.length,uniquePhotoSources:records.length,modelPhotoSources:modelRecords.length,
   editorialPhotoSources:editorialRecords.length,publicModelPages:pageCount,
   editorialPageChecks:editorialPageCount,held404:excludedUrls,
   failed:0,origin:LIVE_ORIGIN,provenance:"real-cloudflare-http-sha-canonical-cc-not-merge-only"};
 console.log("TRACTORVS_BATCH15_LIVE_SUMMARY "+JSON.stringify(summary));
 return summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 proveBatch15Live().catch(err=>{
   console.error("TRACTORVS_BATCH15_LIVE_BLOCKED "+err.message);
   process.exitCode=1;
 });
