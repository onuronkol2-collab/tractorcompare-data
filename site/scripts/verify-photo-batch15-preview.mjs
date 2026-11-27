/**
 * Proof of all 30 newly deployed PREVIEW assets, against immutable approved
 * artifact evidence. This does not call Commons or production, publish data,
 * or claim real-user performance gains.
 */
import {readFileSync} from "node:fs";
import {proveExactPhotoPreview} from "./exact-photo-preview-proof.mjs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const ledger=JSON.parse(readFileSync(
  new URL("../docs/photo-mobile-batch15-evidence.json",import.meta.url),"utf8"));
export const PREVIEW_ORIGIN="https://perf-batch15-720-20261122-tractorvs-site.onuronkol2.workers.dev";

export function expectedPreviewAssets(input=ledger){
 if(input.schema!=="tractorvs-second-batch15-sha-pinned-release-v1"||
    input.publicPhotos!==15||input.assetCount!==30||
    input.heldUnpublishedPhotoIds?.length!==3||
    input.records?.length!==15)
   throw Error("Invalid fifteen-photo rights proof ledger");
 const ids=new Set(),files=[];
 for(const item of input.records){
   if(!/^[a-z0-9-]+$/.test(item.fileId)||ids.has(item.fileId)||
      item.configurationExact!==false||
      !/^CC BY-SA (3\.0|4\.0)$/.test(item.licenseName)||
      item.derivatives?.length!==2)
     throw Error("Invalid rights-reviewed photo identity");
   ids.add(item.fileId);
   for(const d of item.derivatives){
     if(![["jpeg","jpg"],["webp","webp"]].some(([format,ext])=>
       d.format===format&&d.ext===ext)||
       !/^[a-f0-9]{64}$/.test(d.sha256)||
       d.width!==720||d.height<100||d.psnrDb<30||
       d.bytes>=item.source960Bytes)
       throw Error("Invalid 720p source proof for "+item.fileId);
     files.push({path:"/images/tractors/"+item.fileId+"-720."+d.ext,
       mime:d.ext==="jpg"?"image/jpeg":"image/webp",
       bytes:d.bytes,sha256:d.sha256});
   }
 }
 if(ids.size!==15||files.length!==30||new Set(files.map(x=>x.path)).size!==30)
   throw Error("Thirty verified local images expected");
 return files;
}

export async function provePreviewBatch15({fetchImpl=fetch,delay=ms=>
  new Promise(resolve=>setTimeout(resolve,ms)),origin=PREVIEW_ORIGIN}={}){
 if(origin!==PREVIEW_ORIGIN)throw Error("No alternate origin/production probe permitted");
 const files=expectedPreviewAssets(),results=[];
 for(let index=0;index<files.length;index++){
   const item=files[index];
   let proven=null;
   for(let trial=0;trial<(index===0?20:1);trial++){
     let response;
     try{
       response=await fetchImpl(origin+item.path,{
         signal:AbortSignal.timeout(18000),redirect:"error",
         headers:{"Accept":item.mime}});
     }catch(e){
       if(index===0&&trial<19){await delay(7000);continue;}
       throw Error("Preview request failed for "+item.path+": "+e.message);
     }
     if(response.status!==200){
       if(index===0&&[404,502,503].includes(response.status)&&trial<19){
         await delay(7000);continue;
       }
       throw Error("Preview HTTP "+response.status+" for "+item.path);
     }
     if(!(response.headers.get("content-type")||"").toLowerCase().startsWith(item.mime))
       throw Error("Wrong preview MIME for "+item.path);
     const bytes=Buffer.from(await response.arrayBuffer());
     if(bytes.length!==item.bytes||
       createHash("sha256").update(bytes).digest("hex")!==item.sha256)
       throw Error("Preview SHA/size changed for "+item.path);
     proven={path:item.path,mime:item.mime,bytes:bytes.length,sha256:item.sha256};
     break;
   }
   if(!proven)throw Error("Preview did not deploy approved image "+item.path);
   results.push(proven);
   console.log("TRACTORVS_BATCH15_PREVIEW "+JSON.stringify(proven));
 }
 const result={checked:results.length,errors:0,
    origin:PREVIEW_ORIGIN,productionRelease:false};
 console.log("TRACTORVS_BATCH15_PREVIEW_SUMMARY "+JSON.stringify(result));
 return result;
}
async function proveCurrentBatch15() {
 const result=await proveExactPhotoPreview({items:expectedPreviewAssets(),pr:process.env.PREVIEW_PR_NUMBER,sha:process.env.PREVIEW_HEAD_SHA,token:process.env.GH_TOKEN,branch:process.env.PREVIEW_HEAD_BRANCH,log:row=>console.log("TRACTORVS_EXACT_PREVIEW_EVIDENCE "+JSON.stringify(row))});
 console.log("TRACTORVS_EXACT_PREVIEW_SUMMARY "+JSON.stringify(result));
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 proveCurrentBatch15().catch(error=>{
   console.error("TRACTORVS_BATCH15_PREVIEW_BLOCKED "+error.message);
   process.exitCode=1;
 });
