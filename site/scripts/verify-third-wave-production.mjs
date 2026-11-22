/**
 * Read-only real-production third wave release proof. This must succeed on
 * tractorvs.com BEFORE anyone claims GitHub merge = deployed/verified.
 * Forbid 404/HTML/mismatched SHA, missing CC credit/canonical or held leaks.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {PUBLICATION_HOLD_IDS,PUBLIC_IMAGE_SITEMAP}
 from "./photo-mobile-second-batch-public-coverage.mjs";
import {findPublicModelPages,checkLiveModelPage,LIVE_ORIGIN}
 from "./verify-photo-batch15-production.mjs";
import {exactThirdWaveAssets} from "./verify-third-wave-preview-assets.mjs";

const ledger=JSON.parse(readFileSync(
 new URL("../docs/photo-mobile-third-wave-assets-evidence.json",import.meta.url),"utf8"));
export function releasedThirdWaveRights(){
 if(ledger.recordCount!==12||ledger.records?.length!==12)
  throw Error("Third-wave rights ledger incomplete");
 const rights=ledger.records.map(item=>{
  const match=APPROVED_TRACTOR_PHOTOS.filter(x=>x.fileId===item.fileId);
  if(match.length!==1||!match[0].photographer||!match[0].licenseUrl||
     !match[0].sourcePage?.startsWith("https://commons.wikimedia.org/wiki/File:"))
   throw Error("Missing unique CC source identity for "+item.fileId);
  return match[0];
 });
 if(new Set(rights.map(r=>r.fileId)).size!==12)
  throw Error("Third-wave identities duplicate");
 return rights;
}
async function request(fetchFn,url,accept){
 return fetchFn(url,{redirect:"error",signal:AbortSignal.timeout(18000),
  headers:{"Accept":accept}});
}
export async function verifyThirdWaveLive({origin=LIVE_ORIGIN,fetchFn=fetch,
 attempts=18,sleep=ms=>new Promise(done=>setTimeout(done,ms))}={}){
 if(origin!==LIVE_ORIGIN||!Number.isInteger(attempts)||attempts<1||attempts>18)
  throw Error("Live proof requires exact https://tractorvs.com");
 const files=exactThirdWaveAssets();
 const rights=releasedThirdWaveRights();
 const verified=[];
 for(let i=0;i<files.length;i++){
  const item=files[i];
  let success=false;
  for(let trial=0;trial<(i===0?attempts:1);trial++){
   let response;
   try{response=await request(fetchFn,origin+item.path,item.mime);}
   catch(e){
    if(i===0&&trial<attempts-1){await sleep(6000);continue;}
    throw Error("Live third-wave image network error: "+item.path+" "+e.message);
   }
   if([404,502,503].includes(response.status)&&i===0&&trial<attempts-1){
    await sleep(6000);continue;
   }
   if(response.status!==200)
    throw Error("Live third-wave image HTTP "+response.status+" "+item.path);
   if(!(response.headers.get("content-type")||"").toLowerCase().startsWith(item.mime))
    throw Error("Live third-wave image MIME mismatch "+item.path);
   const data=Buffer.from(await response.arrayBuffer());
   const actual=createHash("sha256").update(data).digest("hex");
   if(data.length!==item.bytes||actual!==item.sha256)
    throw Error("Live third-wave image size/SHA mismatch "+item.path);
   verified.push({path:item.path,mime:item.mime,bytes:item.bytes,sha256:actual});
   console.log("TRACTORVS_THIRD_WAVE_LIVE_IMAGE "+JSON.stringify(verified.at(-1)));
   success=true;break;
  }
  if(!success)throw Error("Unverified production third-wave photo: "+item.path);
 }
 const response=await request(fetchFn,PUBLIC_IMAGE_SITEMAP,"application/xml");
 if(response.status!==200||!/xml/.test(response.headers.get("content-type")||""))
  throw Error("Live public image sitemap unavailable / non-XML");
 const xml=await response.text();
 const modelPages=findPublicModelPages(xml,rights);
 let modelChecks=0;
 for(const item of rights){
  const paths=modelPages.get(item.fileId);
  if(!paths||!paths.length)throw Error("Missing real model page for "+item.fileId);
  for(const path of paths){
   const r=await request(fetchFn,origin+path,"text/html");
   if(r.status!==200||!/text\/html/.test(r.headers.get("content-type")||""))
    throw Error("Live model page not HTTP 200 HTML: "+path);
   const inspected=checkLiveModelPage(await r.text(),item,path);
   if(!inspected.ok)throw Error("Live third-wave photo SEO/rights regression "+
     item.fileId+" "+path+": "+inspected.errors.join(","));
   modelChecks++;
   console.log("TRACTORVS_THIRD_WAVE_LIVE_PAGE "+JSON.stringify({
     fileId:item.fileId,path,canonical:true,rights:true,responsive:true}));
  }
 }
 let held404=0;
 for(const heldId of PUBLICATION_HOLD_IDS){
  for(const ext of ["jpg","webp"]){
   const path="/images/tractors/"+heldId+"-720."+ext;
   const r=await request(fetchFn,origin+path,
     ext==="jpg"?"image/jpeg":"image/webp");
   if(r.status!==404)throw Error("Unpublished photo unexpectedly visible: "+path+
    " HTTP "+r.status);
   held404++;
  }
 }
 const summary={uniquePhotos:rights.length,verifiedAssets:verified.length,
   publicModelPages:modelChecks,held404,failed:0,origin,
   provenance:"real_production_https_sha_canonical_CC_rights"};
 console.log("TRACTORVS_THIRD_WAVE_LIVE_SUMMARY "+JSON.stringify(summary));
 return summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 verifyThirdWaveLive().catch(e=>{
  console.error("TRACTORVS_THIRD_WAVE_LIVE_BLOCKED "+String(e?.message||e));
  process.exitCode=1;
 });
