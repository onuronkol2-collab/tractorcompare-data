/**
 * Post-release source readiness check for EVERY currently staged, licensed model photo.
 * This is a research QA script, not a publishing pipeline.
 */
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
const root=process.env.PHOTO_ORIGIN||"https://tractorvs.com";
const problems=[];
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function probe(photo){
 const url=root+photo.displayUrl;
 let last;
 for(let attempt=0;attempt<4;attempt++){
   try{
     const response=await fetch(url,{
       signal:AbortSignal.timeout(30000),
       headers:{Accept:"image/jpeg"},
     });
     if(response.ok){
       const buffer=new Uint8Array(await response.arrayBuffer());
       const valid=buffer.length>9000&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255
         &&(response.headers.get("content-type")||"").toLowerCase().includes("image/jpeg");
       if(valid)return {file:photo.fileId,status:response.status,bytes:buffer.length,ok:true};
       last="Not a valid JPEG ("+response.status+", "+buffer.length+" bytes)";
       break;
     }
     last="HTTP "+response.status;
     if(![429,502,503,504].includes(response.status))break;
   }catch(e){last=String(e);}
   await sleep(1000*(attempt+1));
 }
 return {file:photo.fileId,ok:false,error:last,url};
}
for(const photo of APPROVED_TRACTOR_PHOTOS){
 const result=await probe(photo);
 if(!result.ok)problems.push(result);
 console.log("TRACTOR_PHOTO_QA "+JSON.stringify(result));
 // Throttle to avoid imposing an unfair load on the Wikimedia photo origin.
 await sleep(350);
}
console.log("TRACTOR_PHOTO_QA_SUMMARY "+JSON.stringify({
  count:APPROVED_TRACTOR_PHOTOS.length,
  passed:APPROVED_TRACTOR_PHOTOS.length-problems.length,
  failures:problems.length,failedIds:problems.map(x=>x.file)
}));
if(problems.length)process.exitCode=1;
