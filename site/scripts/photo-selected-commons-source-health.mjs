/**
 * Network safety gate ONLY for explicitly curated published-model candidates.
 * This prevents a green unit-test from being mistaken for real Wikimedia JPEG
 * availability. Never run 388 model requests or guess unsupported thumb sizes.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {APPROVED_TRACTOR_PHOTOS,isSupportedCommonsPhotoOrigin} from "../src/lib/tractor-photos.ts";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
const input=JSON.parse(readFileSync(
  new URL("../docs/photo-mccormick-two-source-proof-20261123.json",import.meta.url),"utf8"));
if(input.scope!=="published-models-only"||!Array.isArray(input.photos)||input.photos.length!==2)
  throw Error("Photo audit manifest must specify two approved public model identities");
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const report={release:"2026-11-23 McCormick 2 exact models",photos:[],checkedAt:new Date().toISOString()};
for(const item of input.photos){
 const p=APPROVED_TRACTOR_PHOTOS.find(x=>x.fileId===item.fileId);
 if(!p||p.tractorId!==item.tractorId||p.model!==item.model||p.brand!==item.brand
   ||p.sourcePage!==item.filePage||p.photographer!==item.photographer
   ||p.licenseName!==item.licenseName||p.licenseUrl!==item.licenseUrl
   ||p.width!==item.width||p.height!==item.height
   ||!allowedPhotoReuseLicense(p.licenseName,p.licenseUrl))
   throw Error("Fail closed: exact published identity, Commons metadata or commercial reuse license mismatch");
 const audit={fileId:p.fileId,model:p.model,tractorId:p.tractorId,sourcePage:p.sourcePage,
   rights:p.licenseName,photographer:p.photographer,variants:[]};
 for(const [size,url] of [[480,p.originThumbUrl],[960,p.originDisplayUrl],[1920,p.originFullUrl]]){
   if(!isSupportedCommonsPhotoOrigin(url)||(!url.includes("/"+(size===480?500:size)+"px-")))
     throw Error("Fail closed: Wikimedia thumbnail width/path not on trusted origin "+p.fileId+" "+size);
   await wait(1100); // Low-rate single sequential source requests
   const response=await fetch(url,{headers:{"User-Agent":"TractorVS-photo-rights-audit/1.0 (https://tractorvs.com/)","Accept":"image/jpeg"},signal:AbortSignal.timeout(24000)});
   if(!response.ok)throw Error("Commons source HTTP "+response.status+
     (response.headers.get("retry-after")?" Retry-After="+response.headers.get("retry-after"):"")
     +" for "+p.fileId+" "+size+"; abort, do not mask 429/5xx or publish");
   const mime=response.headers.get("content-type")||"";
   if(!/image\/jpeg\b/i.test(mime))throw Error("Non-JPEG source "+p.fileId+" "+size+" "+mime);
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length<12000||bytes[0]!==0xff||bytes[1]!==0xd8
     ||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)
     throw Error("Invalid/truncated JPEG source "+p.fileId+" "+size+" length="+bytes.length);
   audit.variants.push({width:size,sourceThumbWidth:size===480?500:size,
     mime,bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")});
   process.stdout.write("OK "+p.fileId+" "+size+" JPEG "+bytes.length+" bytes SHA256 "+
      audit.variants.at(-1).sha256+"\n");
 }
 report.photos.push(audit);
}
if(report.photos.length!==2||report.photos.some(p=>p.variants.length!==3))
 throw Error("Not all exact Commons sources verified");
console.log(JSON.stringify(report));
