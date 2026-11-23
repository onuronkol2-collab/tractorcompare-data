/**
 * Fail-closed checks of ALL generated model-page image rights, in every locale.
 * Unlike live sampling, this runs before deployment against the current build.
 * A credit or CC license never proves that the photographer owns copyright.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APPROVED_TRACTOR_PHOTOS } from "../src/lib/tractor-photos.ts";
import { imageLicenseMetadataIssues } from "./image-license-jsonld-check.mjs";

export const MODEL_PHOTO_LOCALES = ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];

function photoObject(html) {
  for (const match of String(html).matchAll(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)) {
    let value;
    try { value = JSON.parse(match[1]); } catch { continue; }
    const graph = Array.isArray(value?.["@graph"]) ? value["@graph"] : [value];
    const result = graph.find(item=>item?.["@type"]==="ImageObject");
    if (result) return result;
  }
  return null;
}

export function inspectModelImageRights(html, photos, origin="https://tractorvs.com") {
  const issues=[];
  // Covers images in an <img>, social metadata, or JSON-LD. A published
  // model cannot silently drop its structured data while keeping a photo.
  if (!String(html).includes("/images/tractors/")) return { hasPhoto:false, issues, notice:false };
  const obj=photoObject(html);
  const rights=imageLicenseMetadataIssues(html,{siteOrigin:origin});
  issues.push(...rights.issues);
  if (!obj || rights.count!==1) return {hasPhoto:true,issues:[...new Set([...issues,"Missing exactly one model ImageObject"])],notice:false};

  const fileId=typeof rights.contentUrl==="string"
    ? /^\/images\/tractors\/([a-z0-9-]+)-1920\.jpg$/.exec((()=>{
        try{return new URL(rights.contentUrl).pathname;}catch{return "";}
      })())?.[1] : null;
  const photo=photos.find(item=>item.fileId===fileId);
  if (!photo) return {hasPhoto:true,issues:[...new Set([...issues,"ImageObject references an unapproved photo"])],notice:false};
  const expectedUrl=new URL(photo.fullUrl,origin).toString();
  if (rights.contentUrl!==expectedUrl)issues.push("ImageObject image URL differs from the approved 1920 URL");
  if (rights.license!==photo.licenseUrl)issues.push("ImageObject license differs from the verified photo register");
  if (rights.acquireLicensePage!==photo.sourcePage)issues.push("ImageObject reuse page differs from the original photo source");
  if (obj.creator?.["@type"]!=="Person" || obj.creator?.name!==photo.photographer)
    issues.push("ImageObject creator differs from the credited photographer");
  if (obj.creditText!==photo.photographer+" · "+photo.licenseName)
    issues.push("ImageObject creditText differs from the approved credit and license");
  const verifiedClaim=photo.copyrightEvidence==="commons-own-work-self-license"
    && Boolean(photo.copyrightOwner)
    && photo.copyrightOwner===photo.photographer
    && photo.copyrightClaimUrl===photo.sourcePage
    && photo.licenseName!=="CC0";
  if (verifiedClaim && obj.copyrightNotice!==photo.copyrightOwner)
    issues.push("Verified copyright owner missing from ImageObject");
  if (!verifiedClaim && obj.copyrightNotice!==undefined)
    issues.push("Unverified or CC0 photo must not claim copyright ownership");
  return {hasPhoto:true,issues:[...new Set(issues)],notice:verifiedClaim,fileId};
}

export function auditBuiltModelImageRights({
  dist=resolve(fileURLToPath(new URL("../dist/",import.meta.url))),
  origin="https://tractorvs.com",
  photos=APPROVED_TRACTOR_PHOTOS,
  locales=MODEL_PHOTO_LOCALES
}={}) {
  const errors=[];let pages=0,withPhotos=0,withNotices=0;
  const known=new Set();
  for(const photo of photos) {
    if (known.has(photo.fileId)) errors.push("Duplicate approved photo ID "+photo.fileId);
    known.add(photo.fileId);
  }
  for(const locale of locales) {
    const dir=join(dist,...(locale==="en"?["tractors"]:[locale,"tractors"]));
    if(!existsSync(dir)) {errors.push("Missing published model directory "+locale);continue;}
    for(const entry of readdirSync(dir,{withFileTypes:true})) {
      if(!entry.isDirectory())continue;
      const filename=join(dir,entry.name,"index.html");
      if(!existsSync(filename))continue;
      pages++;
      const result=inspectModelImageRights(readFileSync(filename,"utf8"),photos,origin);
      if(result.hasPhoto)withPhotos++;
      if(result.notice)withNotices++;
      for(const issue of result.issues)errors.push(locale+"/"+entry.name+": "+issue);
    }
  }
  if(!pages)errors.push("No generated tractor model pages found");
  if(!withPhotos)errors.push("No generated tractor model photo metadata found");
  if(errors.length)throw new Error("Generated image rights audit failed ("+errors.length+"): "+errors.slice(0,25).join("; "));
  return {modelPages:pages,modelPagesWithPhotos:withPhotos,modelPagesWithVerifiedCopyrightNotices:withNotices,locales:locales.length};
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const result=auditBuiltModelImageRights({
      dist:process.argv[2]?resolve(process.argv[2]):undefined,
      origin:process.argv[3]||process.env.SITE_URL||"https://tractorvs.com"
    });
    console.log("TRACTOR_IMAGE_BUILD_RIGHTS "+JSON.stringify(result));
  } catch(error) {
    console.error("TRACTOR_IMAGE_BUILD_RIGHTS_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
