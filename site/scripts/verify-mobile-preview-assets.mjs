/**
 * Read-only Cloudflare PR preview proof of six SHA-pinned CC-licensed local
 * derivative assets. Never touches production, Supabase, IndexNow or paid APIs.
 * A 200 response with the wrong MIME/body/hash is a hard failure.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const EXPECTED_BRANCH="perf-three-local-720-photo-assets-20261122";
export const EXPECTED_ORIGIN="https://"+EXPECTED_BRANCH+"-tractorvs-site.onuronkol2.workers.dev";
const evidence=JSON.parse(readFileSync(
  new URL("../docs/photo-mobile-720-artifact-evidence.json",import.meta.url),"utf8"));

export function previewCandidates(proof=evidence){
  if(proof.schema!=="tractorvs-offline-licensed-photo-derivative-proof-v1"||
     proof.records?.length!==3||proof.publishApproved!==false)throw Error("Invalid reviewed derivative evidence");
  const result=[];
  for(const item of proof.records){
    if(!/^[a-z0-9-]+$/.test(item.fileId)||item.derivatives?.length!==2)
      throw Error("Unreviewed derivative identity");
    for(const d of item.derivatives){
      if(![["jpeg","jpg"],["webp","webp"]].some(([f,e])=>d.format===f&&d.ext===e)||
        !/^[a-f0-9]{64}$/.test(d.sha256)||d.width!==720)
        throw Error("Unreviewed format or digest: "+item.fileId);
      result.push({
        urlPath:"/images/tractors/"+item.fileId+"-720."+d.ext,
        mime:d.ext==="webp"?"image/webp":"image/jpeg",
        sha256:d.sha256,
        bytes:d.bytes
      });
    }
  }
  if(result.length!==6||new Set(result.map(r=>r.urlPath)).size!==6)
    throw Error("Expected six distinct approved preview images");
  return result;
}

export async function verifyPreviewAssets({origin=EXPECTED_ORIGIN,fetchFn=fetch}={}){
  if(origin!==EXPECTED_ORIGIN)throw Error("No cross-domain or production image probes");
  const items=previewCandidates();
  const verified=[];
  for(const item of items){
    const url=origin+item.urlPath;
    let done=false;
    for(let attempt=0;attempt<8;attempt++){
      const response=await fetchFn(url,{
        redirect:"error",
        signal:AbortSignal.timeout(16000),
        headers:{"Accept":item.mime}
      });
      if(response.status===404&&attempt<7){
        await new Promise(resolve=>setTimeout(resolve,3500));
        continue;
      }
      if(response.status!==200)throw Error("Preview photo HTTP "+response.status+": "+item.urlPath);
      if(!(response.headers.get("content-type")||"").toLowerCase().startsWith(item.mime))
        throw Error("Preview photo MIME mismatch: "+item.urlPath);
      const bytes=Buffer.from(await response.arrayBuffer());
      const actual=createHash("sha256").update(bytes).digest("hex");
      if(bytes.length!==item.bytes||actual!==item.sha256)
        throw Error("Preview photo SHA/size mismatch: "+item.urlPath);
      const record={path:item.urlPath,mime:item.mime,bytes:bytes.length,
        sha256:actual,status:200};
      verified.push(record);
      console.log("TRACTORVS_720_PREVIEW_VERIFIED "+JSON.stringify(record));
      done=true;
      break;
    }
    if(!done)throw Error("Preview photo not ready: "+item.urlPath);
  }
  return verified;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const checked=await verifyPreviewAssets();
    console.log("TRACTORVS_720_PREVIEW_SUMMARY "+
      JSON.stringify({checked:checked.length,errors:0,productionDeployment:false}));
  }catch(error){
    console.error("TRACTORVS_720_PREVIEW_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
