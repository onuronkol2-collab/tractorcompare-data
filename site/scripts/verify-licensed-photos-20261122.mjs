/** Exact first-party Commons origins, not generic image-search screenshots.
 * Executed only on the current 3 source candidates; no secret/costs/writes.
 * Follow no external redirect, avoid arbitrary raw-size downloads, enforce JPEG.
 */
import {tractorPhotos,resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";
const records=[
 ["Steyr","6240 ABSOLUT CVT","steyr-6240-absolut-blonder1984-2022"],
 ["Zetor","PROXIMA","zetor-proxima-jj7777-2021"],
 ["Zetor","PROXIMA","zetor-proxima-raf24-warsaw-2019"]
];
const errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(const [brand,model,id] of records){
 const photo=tractorPhotos({brand_name:brand,model_name:model}).find(p=>p.fileId===id);
 if(!photo){errors.push("No approved exact photo for "+brand+" "+model+" "+id);continue;}
 for(const [width,source] of [[500,photo.originThumbUrl],[960,photo.originDisplayUrl]]){
  if(resolveApprovedPhotoSource(width===500?photo.thumbUrl:photo.displayUrl)!==source){
    errors.push("Invalid first-party worker origin: "+id+" "+width);continue;
  }
  try{
   const url=new URL(source);
   if(url.protocol!=="https:"||url.hostname!=="upload.wikimedia.org"){
    errors.push("Untrusted Commons source host: "+id);continue;
   }
   const response=await fetch(url,{redirect:"manual",
    signal:AbortSignal.timeout(20000),
    headers:{"User-Agent":"TractorVS-ExactModelMediaQA/1.0 (research; rights verification)",Accept:"image/jpeg"}});
   if(response.status!==200){errors.push("HTTP "+response.status+" "+id+" "+width);continue;}
   const mime=(response.headers.get("content-type")||"").toLowerCase();
   if(!mime.includes("image/jpeg")){errors.push("Invalid MIME "+mime+" "+id);continue;}
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.length<3000||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff){
    errors.push("Invalid JPEG magic/length "+id+" "+width);continue;
   }
   console.log("LICENSED_COMMONS_MEDIA_QA "+JSON.stringify({id,width,status:response.status,bytes:bytes.length,mime,url:source}));
  }catch(e){errors.push(String(e?.message||e)+" "+id+" "+width)}
  await sleep(550);
 }
}
const report={ok:errors.length===0,photos:records.length,checkedRenditions:records.length*2,failures:errors};
console.log("LICENSED_COMMONS_MEDIA_RESULT "+JSON.stringify(report));
if(errors.length)process.exitCode=1;
