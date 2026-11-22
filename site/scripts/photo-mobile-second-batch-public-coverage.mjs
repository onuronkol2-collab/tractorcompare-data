/**
 * Read-only proof that all 18 proposed optimized photos are actually visible
 * on public model pages in the LIVE image sitemap. APPROVED_TRACTOR_PHOTOS
 * alone includes historical/staged IDs and does NOT prove publication.
 */
import {selectReviewedSecondBatch} from "./photo-mobile-second-batch.mjs";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
export const PUBLIC_IMAGE_SITEMAP="https://tractorvs.com/image-sitemap.xml";
/** These exact IDs have a reviewed Commons file but lack a public page in the
 * live image sitemap as of 2026-11-22. Never auto-publish their derivatives.
 * They may be re-evaluated only after true published model/source verification.
 */
export const PUBLICATION_HOLD_IDS=Object.freeze([
  "new-holland-t6-180-marcelx42-2025",
  "landini-5-110-roboshift-marcelx42-2023",
  "kubota-m5-112-c3be6b9d"
]);

export function evaluateLiveImageSitemap(xml,selected=selectReviewedSecondBatch().selected){
  if(typeof xml!=="string"||!/<urlset\b/.test(xml)||!/<image:image>/.test(xml))
    throw Error("Real public image sitemap is missing, empty or not XML");
  const urls=[...xml.matchAll(/<image:loc>\s*([^<]+)\s*<\/image:loc>/g)]
    .map(x=>x[1].replaceAll("&amp;","&"));
  const matches=new Set(urls.map(u=>{
    let parsed;
    try{parsed=new URL(u);}catch{throw Error("Malformed image sitemap URL");}
    if(parsed.origin!=="https://tractorvs.com"||parsed.search||parsed.hash)
      throw Error("Image sitemap leaked foreign or noncanonical URL");
    return parsed.pathname;
  }));
  const missing=selected.filter(item=>{
    const photo=APPROVED_TRACTOR_PHOTOS.find(p=>p.fileId===item.fileId);
    return !photo||!matches.has(photo.fullUrl);
  }).map(x=>({fileId:x.fileId,model:x.model,brand:x.brand}));
  const held=new Set(PUBLICATION_HOLD_IDS);
  const unexpectedMissing=missing.filter(photo=>!held.has(photo.fileId));
  const eligibleForRelease=selected.filter(photo=>{
    const original=APPROVED_TRACTOR_PHOTOS.find(x=>x.fileId===photo.fileId);
    return !held.has(photo.fileId)&&Boolean(original&&matches.has(original.fullUrl));
  }).map(photo=>photo.fileId);
  return {checked:selected.length,publiclyVisible:selected.length-missing.length,
    eligibleForRelease,holdIds:PUBLICATION_HOLD_IDS,
    missing,unexpectedMissing,ok:unexpectedMissing.length===0,imageRefs:urls.length};
}
export async function proveLiveImageCoverage({fetchImpl=fetch}={}){
  const res=await fetchImpl(PUBLIC_IMAGE_SITEMAP,{
    signal:AbortSignal.timeout(30000),redirect:"error",
    headers:{"Accept":"application/xml, text/xml"}});
  if(res.status!==200)throw Error("Live image sitemap HTTP "+res.status);
  if(!/xml/.test(res.headers.get("content-type")||""))
    throw Error("Live image sitemap content type is not XML");
  const body=await res.text();
  if(body.length>2_000_000)throw Error("Live image sitemap exceeds 2MB");
  const report=evaluateLiveImageSitemap(body);
  console.log("TRACTORVS_BATCH18_PUBLIC_COVERAGE "+JSON.stringify(report));
  if(!report.ok)throw Error("New/unexpected missing public photo: "+
    report.unexpectedMissing.map(m=>m.fileId).join(","));
  if(report.eligibleForRelease.length!==15)
    throw Error("Release cohort changed; require a new verified explicit review");
  return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  proveLiveImageCoverage().catch(e=>{console.error("TRACTORVS_BATCH18_COVERAGE_BLOCKED "+e.message);process.exitCode=1;});
}
