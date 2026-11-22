/** Exact Commons source validation, no redirects or rate-limit workarounds.
 * Run on complete media release branches only. First error fails closed.
 */
import {tractorPhotos,resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";
const records=[
 ["Steyr","6240 ABSOLUT CVT","steyr-6240-absolut-blonder1984-2022"],
 ["Zetor","PROXIMA","zetor-proxima-jj7777-2021"],
 ["Zetor","PROXIMA","zetor-proxima-raf24-warsaw-2019"]
];
const errors=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let attempted=0,passed=0,rateLimited=false;
outer: for(const [brand,model,id] of records){
 const photo=tractorPhotos({brand_name:brand,model_name:model}).find(p=>p.fileId===id);
 if(!photo){errors.push("No approved exact photo for "+brand+" "+model+" "+id);break;}
 for(const [width,source] of [[500,photo.originThumbUrl],[960,photo.originDisplayUrl]]){
  if(resolveApprovedPhotoSource(width===500?photo.thumbUrl:photo.displayUrl)!==source){
   errors.push("Invalid first-party Worker origin: "+id+" "+width);break outer;
  }
  const url=new URL(source);
  if(url.protocol!=="https:"||url.hostname!=="upload.wikimedia.org"||url.username||url.password){
   errors.push("Untrusted Commons source host: "+id);break outer;
  }
  attempted++;
  try{
   const response=await fetch(url,{
    redirect:"manual",signal:AbortSignal.timeout(20000),
    headers:{"User-Agent":"TractorVS-ExactModelMediaQA/1.0 (https://tractorvs.com/contact)",Accept:"image/jpeg"}
   });
   if(response.status!==200){
    rateLimited=response.status===429||response.status===503;
    const retryAfter=(response.headers.get("retry-after")||"").slice(0,32);
    errors.push("Upstream HTTP "+response.status+" for "+id+" "+width+
      (rateLimited?" retry-after="+retryAfter+"; no retry":""));
    // Never hammer a rate-limited provider by trying five more URLs.
    break outer;
   }
   const mime=(response.headers.get("content-type")||"").toLowerCase();
   if(!mime.includes("image/jpeg")){errors.push("Invalid MIME "+mime+" "+id);break outer;}
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.length<3000||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff||
      bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9){
    errors.push("Invalid JPEG magic/length "+id+" "+width);break outer;
   }
   passed++;
   console.log("LICENSED_COMMONS_MEDIA_QA "+JSON.stringify({
    id,width,status:response.status,bytes:bytes.length,mime,url:source
   }));
  }catch(e){
   errors.push(String(e?.message||e)+" "+id+" "+width);
   break outer;
  }
  await sleep(550);
 }
}
const report={ok:errors.length===0&&passed===records.length*2,photos:records.length,
 plannedRenditions:records.length*2,checkedRenditions:attempted,passedRenditions:passed,
 rateLimited,failures:errors};
console.log("LICENSED_COMMONS_MEDIA_RESULT "+JSON.stringify(report));
if(!report.ok)process.exitCode=1;
