// Credential-free check of TractorVS public Google Images prerequisites.
import {imageLicenseMetadataIssues} from "./image-license-jsonld-check.mjs";
import {copyrightZhSitemapPages} from "./image-copyright-live-cases.mjs";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {parseProductionSitemapInventory} from "./production-sitemap-inventory.mjs";
import {classifyPublicImageSitemap} from "./image-seo-asset-boundaries.mjs";
import {fetchPublicImageAsset,publicImageMimeOk} from "./image-seo-http.mjs";
const origin="https://tractorvs.com";
const errors=[];
function fail(message){errors.push(message);console.error("IMAGE_ERROR "+message)}
async function get(url){
 return fetchPublicImageAsset(url,{
  onRetry:({attempt,status,error})=>console.warn(
   "IMAGE_TRANSIENT_RETRY "+JSON.stringify({attempt,status:status??null,error:error??null})
  ),
 });
}
const sitemapIndexUrl=origin+"/sitemap-index.xml";
const checked=new Set(),forumMediaAssets=new Set(),zhCopyrightCases=[];
try{
 const master=await get(sitemapIndexUrl);
 if(master.r.status!==200)throw Error("Master sitemap HTTP "+master.r.status);
 const indexXml=new TextDecoder().decode(master.bytes);
 const files=[...indexXml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 if(!files.length||files.length>30)throw Error("Root sitemap has no approved child files");
 const children=new Map();
 for(const file of files){
  const response=await get(file);
  if(response.r.status!==200)throw Error("Sitemap child HTTP "+response.r.status+": "+file);
  children.set(file,new TextDecoder().decode(response.bytes));
 }
 const inventory=parseProductionSitemapInventory({indexXml,children});
 const imageXml=children.get(origin+"/image-sitemap.xml");
 zhCopyrightCases.push(...copyrightZhSitemapPages(imageXml,APPROVED_TRACTOR_PHOTOS));
 const images=classifyPublicImageSitemap(imageXml,{
  htmlPages:inventory.htmlPages,forumPages:inventory.forumPages
 });
 for(const name of images.models)checked.add(name);
 for(const url of images.forumAssets)forumMediaAssets.add(url);
 console.log("TRACTOR_IMAGE_SITEMAP "+JSON.stringify({
  html_pages:inventory.htmlPages.size,approved_forum_pages:inventory.forumPages.size,
  image_pages:images.pages.size,image_references:images.imageReferences,
  distinct_tractor_photo_files:checked.size,approved_forum_media:forumMediaAssets.size
 }));
}catch(e){fail("Image sitemap approval/integrity "+String(e));}
for(const name of checked){
 for(const size of [960,1920]){
   const url=origin+"/images/tractors/"+name+"-"+size+".jpg";
   try{
     const {r,bytes}=await get(url);
     const mime=r.headers.get("content-type");
     const jpeg=String(mime||"").startsWith("image/jpeg")&&publicImageMimeOk(mime,bytes);
     console.log("TRACTOR_IMAGE "+JSON.stringify({url,status:r.status,type:mime,bytes:bytes.length,jpeg}));
     if(!r.ok||!jpeg)
       fail("Bad first-party photograph "+name+" status="+r.status);
   }catch(e){fail("Fetch "+name+" "+String(e));}
 }
}
for(const url of forumMediaAssets){
 try{
  const {r,bytes}=await get(url);
  const mime=r.headers.get("content-type");
  const valid=r.ok&&publicImageMimeOk(mime,bytes);
  console.log("TRACTOR_FORUM_IMAGE "+JSON.stringify({
   image_status:r.status,media_type:mime,bytes:bytes.length,valid
  }));
  if(!valid)fail("Approved forum photo unavailable or invalid media response "+r.status);
 }catch(e){fail("Approved forum media fetch "+String(e));}
}
try{
 const {r,bytes}=await get(origin+"/tr/tractors/belarus-82-1-940a988a/");
 const html=new TextDecoder().decode(bytes);
 console.log("TRACTOR_IMAGE_DETAIL "+JSON.stringify({http:r.status,hasImage:html.includes("/images/tractors/"),imageObject:html.includes("ImageObject"),hasAttribution:html.includes("Homoatrox")}));
 if(r.status!==200||!html.includes("ImageObject")||!html.includes("Homoatrox"))
   fail("Belarus 82.1 model page missing photo, license or ImageObject");
 const rights=imageLicenseMetadataIssues(html);
 console.log("TRACTOR_IMAGE_RIGHTS "+JSON.stringify({sample:"Belarus 82.1",...rights}));
 for(const issue of rights.issues)fail("Belarus 82.1 ImageObject "+issue);
}catch(e){fail("Model detail "+String(e));}
// Independently sample the two real Search Console warning examples:
// a CC BY-SA photograph and a CC0 public-domain dedication. The metadata
// must describe the same image-specific Commons file in each language.
const rightsSamples=[
 {path:"/zh/tractors/valtra-g135-1a85eb12/",label:"Valtra G135 (CC BY-SA 4.0)"},
 {path:"/zh/tractors/valtra-f105-1f000c28/",label:"Valtra F105 (CC0)",image:"valtra-f105-80828837",unclaimed:true,expectedLicense:"https://creativecommons.org/publicdomain/zero/1.0/"},
 {path:"/zh/tractors/swaraj-735-fe-7c7b069f/",label:"Swaraj 735 FE (Flickr-licensed; rights unproven)",image:"swaraj-735-fe-0269bdfd",unclaimed:true,expectedLicense:"https://creativecommons.org/licenses/by/2.0/"},
 // Exact Search Console "validation cannot continue" examples; do not
 // demand post-deploy markup during the pre-deploy PR/main-push checks.
 {path:"/zh/tractors/valtra-q305-5c3743cd/",label:"Valtra Q305 (copyrightNotice)",owner:"MarcelX42",image:"valtra-q305-d4c20807"},
 {path:"/zh/tractors/mccormick-x5-110-hc-c5111bb6/",label:"McCormick X5.110 HC (copyrightNotice)",owner:"MarcelX42",image:"mccormick-x5-110-hc-marcelx42-2023"},
 {path:"/zh/tractors/steyr-4075-kompakt-19743251/",label:"Steyr 4075 Kompakt (copyrightNotice)",owner:"JoachimKohlerBremen",image:"steyr-4075-kompakt-joachim-2018"},
];
const postDeployMode=process.env.GITHUB_EVENT_NAME==="schedule" ||
  process.env.GITHUB_EVENT_NAME==="workflow_dispatch";
for(const {path,label,owner,image,unclaimed,expectedLicense} of rightsSamples){
 try{
  const {r,bytes}=await get(origin+path);
  const html=new TextDecoder().decode(bytes);
  const rights=imageLicenseMetadataIssues(html,{
    expectedCopyrightOwner:postDeployMode&&owner ? owner : null,
    prohibitCopyrightNotice:Boolean(unclaimed)
  });
  console.log("TRACTOR_IMAGE_RIGHTS "+JSON.stringify({
    sample:label,http:r.status,postDeployMode,...rights
  }));
  if(expectedLicense && rights.license!==expectedLicense)
    fail(label+" changed the source-specific CC license");
  if(image && !String(rights.contentUrl||"").endsWith("/"+image+"-1920.jpg"))
    fail(label+" has mismatched image identity or license metadata");
  if(r.status!==200)fail(label+" page HTTP "+r.status);
  for(const issue of rights.issues)fail(label+" ImageObject "+issue);
 }catch(e){fail(label+" metadata fetch "+String(e));}
}
// Source-verified image copyright must be present on every LIVE Chinese
// model page (including repeat image URLs on different variant pages).
// On PR/main push the previous Cloudflare deployment may legitimately serve
// older HTML, so owner matching becomes strict only on scheduled/manual audits.
const sampledIds=new Set(rightsSamples.map(x=>x.image).filter(Boolean));
let additionalCopyrightPages=0;
for(const entry of zhCopyrightCases){
 if(sampledIds.has(entry.fileId))continue;
 try{
  const {r,bytes}=await get(origin+entry.path);
  const html=new TextDecoder().decode(bytes);
  const rights=imageLicenseMetadataIssues(html,{
   expectedCopyrightOwner:postDeployMode?entry.owner:null
  });
  console.log("TRACTOR_IMAGE_GOOGLE_COPYRIGHT "+JSON.stringify({
   path:entry.path,fileId:entry.fileId,http:r.status,
   expectedOwner:postDeployMode?entry.owner:null,actualOwner:rights.copyrightNotice,
   errors:rights.issues
  }));
  if(r.status!==200)fail("Copyright example HTTP "+r.status+" "+entry.path);
  if(!String(rights.contentUrl||"").endsWith("/"+entry.fileId+"-1920.jpg"))
   fail("Copyright example image identity mismatch "+entry.path);
  for(const issue of rights.issues)fail("Copyright example "+entry.path+" "+issue);
  additionalCopyrightPages++;
 }catch(e){fail("Copyright metadata fetch "+entry.path+" "+String(e));}
}
console.log("TRACTOR_IMAGE_GOOGLE_COPYRIGHT_SUMMARY "+JSON.stringify({
 additionalZhPages:additionalCopyrightPages,sitemapMatched:zhCopyrightCases.length,
 strictAfterDeployment:postDeployMode
}));
console.log("TRACTOR_IMAGE_AUDIT_SUMMARY "+JSON.stringify({checked_tractor_photos:checked.size,checked_approved_forum_media:forumMediaAssets.size,errors:errors.length}));
if(errors.length)process.exitCode=1;
