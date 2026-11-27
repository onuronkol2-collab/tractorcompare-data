/**
 * Third-wave exact Cloudflare PR preview SHA/MIME proof for 24 CC derivatives.
 * Only immutable reviewed assets and the known branch preview may be fetched.
 * GitHub main merge / preview availability are not production delivery.
 */
import {readFileSync} from "node:fs";
import {proveExactPhotoPreview} from "./exact-photo-preview-proof.mjs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const proof=JSON.parse(readFileSync(new URL(
  "../docs/photo-mobile-third-wave-assets-evidence.json",import.meta.url),"utf8"));
export const THIRD_WAVE_PREVIEW="https://perf-photo-wave3-20261122-tractorvs-site.onuronkol2.workers.dev";
export function exactThirdWaveAssets(ledger=proof){
 if(ledger.schema!=="tractorvs-third-wave-12-live-approved-photo-assets-sha-v1"||
    ledger.recordCount!==12||ledger.derivativeCount!==24||
    ledger.publishApproved!==false||ledger.records?.length!==12)
   throw Error("Missing SHA-pinned third-wave image evidence");
 const result=[];
 for(const row of ledger.records){
  if(!/^[a-z0-9-]+$/.test(row.fileId)||row.derivatives?.length!==2)
   throw Error("Unknown or duplicated original image identity");
  for(const d of row.derivatives){
   const ext=d.format==="jpeg"?"jpg":d.format==="webp"?"webp":null;
   if(!ext||d.file!==row.fileId+"-720."+ext||
      d.width!==720||d.height<120||d.psnrDb<30||
      !/^[a-f0-9]{64}$/.test(d.sha256)||!Number.isInteger(d.bytes)||d.bytes<500)
    throw Error("Unverified image bytes/format/quality: "+d.file);
   result.push({path:"/images/tractors/"+d.file,
    sha256:d.sha256,bytes:d.bytes,
    mime:ext==="jpg"?"image/jpeg":"image/webp"});
  }
 }
 if(result.length!==24||new Set(result.map(x=>x.path)).size!==24)
  throw Error("Exactly 24 unique approved derivatives required");
 return result;
}
export async function verifyThirdWavePreview({origin=THIRD_WAVE_PREVIEW,
 fetchFn=fetch,sleep=ms=>new Promise(done=>setTimeout(done,ms)),attempts=20}={}){
 if(origin!==THIRD_WAVE_PREVIEW||!Number.isInteger(attempts)||attempts<1||attempts>20)
  throw Error("Untrusted preview URL or retry policy");
 const all=exactThirdWaveAssets();
 let completed=0;
 for(let i=0;i<all.length;i++){
  const item=all[i],target=origin+item.path;
  let verified=false;
  for(let retry=0;retry<(i===0?attempts:1);retry++){
   const response=await fetchFn(target,{redirect:"error",signal:AbortSignal.timeout(18000),
    headers:{"Accept":item.mime}});
   if(response.status===404&&i===0&&retry<attempts-1){
    await sleep(7000);continue;
   }
   if(response.status!==200)throw Error("Third-wave preview HTTP "+response.status+": "+item.path);
   if(!(response.headers.get("content-type")||"").toLowerCase().startsWith(item.mime))
    throw Error("Third-wave preview MIME mismatch: "+item.path);
   const data=Buffer.from(await response.arrayBuffer());
   const actual=createHash("sha256").update(data).digest("hex");
   if(data.length!==item.bytes||actual!==item.sha256)
    throw Error("Third-wave preview bytes/SHA mismatch: "+item.path);
   console.log("TRACTORVS_THIRD_WAVE_PREVIEW_SHA "+JSON.stringify({
    path:item.path,bytes:data.length,mime:item.mime,sha256:actual,status:200}));
   verified=true;completed++;break;
  }
  if(!verified)throw Error("Unverified third-wave preview photo: "+item.path);
 }
 const summary={publicPhotoIds:12,verifiedAssets:completed,errors:0,
    productionDeployment:false,provenance:"actual_preview_https_mime_sha256"};
 console.log("TRACTORVS_THIRD_WAVE_PREVIEW_SUMMARY "+JSON.stringify(summary));
 return summary;
}
async function proveCurrentThirdWave() {
 const result=await proveExactPhotoPreview({items:exactThirdWaveAssets(),pr:process.env.PREVIEW_PR_NUMBER,sha:process.env.PREVIEW_HEAD_SHA,token:process.env.GH_TOKEN,branch:process.env.PREVIEW_HEAD_BRANCH,log:row=>console.log("TRACTORVS_EXACT_PREVIEW_EVIDENCE "+JSON.stringify(row))});
 console.log("TRACTORVS_EXACT_PREVIEW_SUMMARY "+JSON.stringify(result));
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 proveCurrentThirdWave().catch(e=>{
  console.error("TRACTORVS_THIRD_WAVE_PREVIEW_BLOCKED "+String(e?.message||e));
  process.exitCode=1;
 });
