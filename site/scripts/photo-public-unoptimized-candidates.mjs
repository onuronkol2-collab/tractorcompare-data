/**
 * Read-only, source-proven third-wave photo optimization candidate discovery.
 *
 * Only the REAL, PUBLIC, canonical image sitemap can authorize a photo for
 * analysis; the historical approved-photo library by itself is NOT publication.
 * This script does not publish, resize, proxy, search Commons or touch Supabase.
 *
 * A photograph shown on ten locales for the same tractor is counted once for
 * unique model/variant page coverage. Do not mistake these counts for traffic.
 */
import {APPROVED_TRACTOR_PHOTOS,isSupportedCommonsPhotoOrigin}
  from "../src/lib/tractor-photos.ts";
import {approvedMobilePhotoFormats} from "../src/lib/approved-mobile-photo-assets.mjs";
import {PUBLIC_IMAGE_SITEMAP,PUBLICATION_HOLD_IDS}
  from "./photo-mobile-second-batch-public-coverage.mjs";
import {writeFileSync,appendFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const PHOTO_ORIGIN="https://tractorvs.com";
const HOLD=new Set(PUBLICATION_HOLD_IDS);
const matchModelPath=p=>{
  const m=/^\/(?:tr|en|zh|hi|pt-br|fr|de|ru|ja|es)\/tractors\/([a-z0-9-]+)\/$/.exec(p);
  if(m)return m[1];
  const fallback=/^\/tractors\/([a-z0-9-]+)\/$/.exec(p);
  return fallback?.[1]||null;
};
const acceptRights=p=>{
  const version=/^CC BY-SA (3\.0|4\.0)$/.exec(p.licenseName)?.[1];
  return Boolean(
    version&&p.licenseUrl==="https://creativecommons.org/licenses/by-sa/"+version+"/"&&
    p.brand&&p.model&&p.photographer&&
    p.configurationExact===false&&
    p.sourcePage.startsWith("https://commons.wikimedia.org/wiki/File:")&&
    p.displayUrl==="/images/tractors/"+p.fileId+"-960.jpg"&&
    p.fullUrl==="/images/tractors/"+p.fileId+"-1920.jpg"&&
    isSupportedCommonsPhotoOrigin(p.originDisplayUrl)&&
    p.originDisplayUrl.includes("/960px-")&&
    Number.isInteger(p.width)&&p.width>=960
  );
};
export function auditPublicUnoptimizedPhotos(xml,photos=APPROVED_TRACTOR_PHOTOS){
  if(typeof xml!=="string"||xml.length<200||xml.length>5_000_000||
     !/<urlset\b/.test(xml)||!/<image:loc>/.test(xml))
    throw Error("Missing/oversized/non-image public sitemap, never infer publication");
  if(!Array.isArray(photos)||photos.length===0)throw Error("Approved library missing");
  const byId=new Map();
  const byImagePath=new Map();
  for(const p of photos){
    if(!p||!p.fileId||!(/^[a-z0-9-]+$/).test(p.fileId)||
       byId.has(p.fileId))throw Error("Duplicate/invalid approved photograph identity");
    byId.set(p.fileId,p);
    byImagePath.set(p.fullUrl,p);
  }
  const found=new Map(),seenPages=new Set();
  let pageEntries=0,matchedPhotoRefs=0;
  for(const match of xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)){
    const body=match[1];
    const pageMatch=/<loc>\s*([^<]+?)\s*<\/loc>/.exec(body);
    if(!pageMatch)throw Error("Missing image sitemap canonical page");
    let page;
    try{page=new URL(pageMatch[1].replaceAll("&amp;","&"));}catch{
      throw Error("Malformed public image sitemap page URL");
    }
    if(page.origin!==PHOTO_ORIGIN||page.search||page.hash)
      throw Error("Image sitemap page is not canonical TractorVS HTTPS");
    if(seenPages.has(page.pathname))throw Error("Duplicate public image sitemap page");
    seenPages.add(page.pathname);
    pageEntries++;
    const modelSlug=matchModelPath(page.pathname);
    for(const imageMatch of body.matchAll(/<image:loc>\s*([^<]+?)\s*<\/image:loc>/g)){
      let image;
      try{image=new URL(imageMatch[1].replaceAll("&amp;","&"));}catch{
        throw Error("Invalid public image sitemap image URL");
      }
      if(image.search||image.hash)throw Error("Image sitemap cannot hide query/hash");
      // Media from permitted public forum storage is not a vetted tractor photo.
      if(image.origin!==PHOTO_ORIGIN||!image.pathname.startsWith("/images/tractors/"))
        continue;
      const p=byImagePath.get(image.pathname);
      if(!p)continue; // Other licensed/first-party photos never auto-enter this cohort.
      matchedPhotoRefs++;
      let row=found.get(p.fileId);
      if(!row){row={photo:p,modelSlugs:new Set(),editorialPaths:new Set(),localePages:0};found.set(p.fileId,row);}
      if(modelSlug)row.modelSlugs.add(modelSlug);
      else row.editorialPaths.add(page.pathname);
      row.localePages++;
    }
  }
  if(pageEntries<2||matchedPhotoRefs<1)throw Error("Empty or unverified public photo coverage");
  const rows=[];
  let optimized=0,held=0,licenseNotEligible=0;
  for(const [fileId,row] of found){
    const p=row.photo;
    if(approvedMobilePhotoFormats(fileId)){optimized++;continue;}
    if(HOLD.has(fileId)){held++;continue;}
    if(!acceptRights(p)){licenseNotEligible++;continue;}
    rows.push({
      fileId:p.fileId,brand:p.brand,model:p.model,photographer:p.photographer,
      licenseName:p.licenseName,licenseUrl:p.licenseUrl,sourcePage:p.sourcePage,
      source960:"https://tractorvs.com"+p.displayUrl,
      fullImage:"https://tractorvs.com"+p.fullUrl,
      uniqueModelVariants:row.modelSlugs.size,
      editorialPageCount:row.editorialPaths.size,
      verifiedSitemapPageRefs:row.localePages,
      publishedModelSlugs:[...row.modelSlugs].sort(),
      publicEditorialPaths:[...row.editorialPaths].sort(),
      exactVariantPhoto:false,
      publishAllowed:false
    });
  }
  rows.sort((a,b)=>b.uniqueModelVariants-a.uniqueModelVariants||
    b.editorialPageCount-a.editorialPageCount||
    b.verifiedSitemapPageRefs-a.verifiedSitemapPageRefs||
    a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model)||a.fileId.localeCompare(b.fileId));
  const result={schema:"tractorvs-live-unoptimized-photo-candidates-v1",
    evidenceOrigin:PUBLIC_IMAGE_SITEMAP,publicationAllowed:false,
    caveat:"Public image-sitemap evidence; unique model counts are NOT visits, speed gains or license ownership",
    approvedPhotoIds:photos.length,publicSitemapPageEntries:pageEntries,
    approvedPublicPhotoIds:found.size,alreadyOptimizedPublicIds:optimized,
    heldPublicIds:held,notEligibleForThisBYSAOptimization:licenseNotEligible,
    eligiblePublicUnoptimizedIds:rows.length,candidates:rows};
  if(optimized+held+licenseNotEligible+rows.length!==found.size)
    throw Error("Photo coverage partition mismatch");
  return result;
}
export async function provePublicUnoptimizedPhotoCandidates({fetchFn=fetch}={}){
  const response=await fetchFn(PUBLIC_IMAGE_SITEMAP,{
    redirect:"error",signal:AbortSignal.timeout(25000),
    headers:{"Accept":"application/xml,text/xml"}
  });
  if(response.status!==200||!/(?:application|text)\/xml/.test(
    (response.headers.get("content-type")||"").toLowerCase()))
    throw Error("Public image sitemap not HTTP 200/XML");
  const xml=await response.text();
  const result=auditPublicUnoptimizedPhotos(xml);
  if(!result.candidates.length)throw Error("No public optimized-cohort candidates remain; inspect coverage");
  const compact={publicImages:result.approvedPublicPhotoIds,
    optimized:result.alreadyOptimizedPublicIds,unoptimized:result.eligiblePublicUnoptimizedIds,
    held:result.heldPublicIds,rightsExcluded:result.notEligibleForThisBYSAOptimization,
    pages:result.publicSitemapPageEntries};
  console.log("TRACTORVS_NEXT_MOBILE_PHOTO_COVERAGE "+JSON.stringify(compact));
  result.candidates.forEach((c,i)=>console.log("TRACTORVS_NEXT_MOBILE_PHOTO_CANDIDATE "+
    JSON.stringify({rankByPublishedModelCoverage:i+1,fileId:c.fileId,
      brand:c.brand,model:c.model,modelVariants:c.uniqueModelVariants,
      editorialPages:c.editorialPageCount,source:c.sourcePage,
      license:c.licenseName,publishAllowed:false})));
  const out=process.env.TRACTORVS_MOBILE_CANDIDATE_REPORT;
  if(out)writeFileSync(resolve(out),JSON.stringify(result,null,2)+"\n");
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    "## Published model photo candidates — read-only\n\n"+
    "Public image-sitemap verified: "+result.approvedPublicPhotoIds+
    "; already optimized: "+result.alreadyOptimizedPublicIds+
    "; eligible but not optimized: "+result.eligiblePublicUnoptimizedIds+
    "; explicit held public: "+result.heldPublicIds+".\n"+
    "Unique model/variant counts are not web traffic or speed improvements. "+
    "No asset was downloaded or published.\n");
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  provePublicUnoptimizedPhotoCandidates().catch(e=>{
    console.error("TRACTORVS_NEXT_MOBILE_PHOTO_BLOCKED "+String(e?.message||e));
    process.exitCode=1;
  });
