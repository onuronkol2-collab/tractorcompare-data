import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const origin=process.env.PHOTO_ORIGIN;
if(!origin||!/^https:\/\/[a-z0-9.-]+\/?$/.test(origin))throw Error("Explicit HTTPS preview origin required");
const ledger=JSON.parse(readFileSync(new URL("../docs/photo-evidence-belarus-112n01-20261122.json",import.meta.url),"utf8"));
if(ledger.sources.length!==1||!ledger.originalBinaryHttpVerified||!ledger.jpegContentVerified)throw Error("Missing verified source ledger");
const fileId=ledger.sources[0].fileId,sha=ledger.sha256?.[fileId];
if(!sha)throw Error("Source sha256 missing");
for(const size of [480,960,1920]){
 const url=origin.replace(/\/$/,"")+"/images/tractors/"+fileId+"-"+size+".jpg";
 let success=false,last="";
 for(let attempt=0;attempt<12;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{Accept:"image/jpeg"}});
   if(response.status===429||response.status===401||response.status===403)throw Error("Nonretryable HTTP "+response.status);
   if(response.status>=500||response.status===404){last="HTTP "+response.status;await new Promise(ok=>setTimeout(ok,2000));continue;}
   if(!response.ok)throw Error("HTTP "+response.status);
   const mime=response.headers.get("content-type")||"";
   if(!/^image\/jpeg(?:;|$)/i.test(mime))throw Error("Unexpected MIME "+mime);
   const buffer=Buffer.from(await response.arrayBuffer());
   const actual=createHash("sha256").update(buffer).digest("hex");
   if(buffer.length!==sha[size].bytes||actual!==sha[size].sha256||buffer[0]!==255||buffer[1]!==216||buffer.at(-1)!==217)throw Error("JPEG hash/bytes mismatch");
   console.log("PREVIEW_PHOTO_VERIFIED "+size+" "+buffer.length+" "+actual);success=true;break;
  }catch(e){last=String(e);if(/Nonretryable|Unexpected MIME|JPEG hash/.test(last))throw e;await new Promise(ok=>setTimeout(ok,2000));}
 }
 if(!success)throw Error("Preview JPEG never validated "+size+": "+last);
}
console.log("PREVIEW_PHOTO_ALL_THREE_OK");
