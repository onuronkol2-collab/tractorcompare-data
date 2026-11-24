/**
 * Read-only Cloudflare PR preview proof of six SHA-pinned CC-licensed local
 * derivative assets. Never touches production, Supabase, IndexNow or paid APIs.
 * A 200 response with the wrong MIME/body/hash is a hard failure.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const PREVIEW_HOST=/^https:\/\/[a-z0-9][a-z0-9-]*-tractorvs-site\.onuronkol2\.workers\.dev$/;
const SHA=/^[a-f0-9]{40}$/;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Cloudflare's own PR comment supplies the preview alias. This also handles
// branch names truncated by Cloudflare; never construct an arbitrary host.
export function previewOriginFromComments(comments,sha){
  if(!SHA.test(sha))throw Error("Expected full PR head SHA");
  for(const comment of [...comments].reverse()){
    if(comment?.user?.login!=="cloudflare-workers-and-pages[bot]")continue;
    const m=/^### Preview URL: (https:\/\/[a-z0-9-]+\.onuronkol2\.workers\.dev) \(commit ([a-f0-9]{7,40})\)\s*$/m.exec(comment.body||"");
    if(m&&PREVIEW_HOST.test(m[1])&&sha.startsWith(m[2]))return m[1];
  }
  return null;
}
export function hasPreviewRelease(html,sha){
  if(!SHA.test(sha))return false;
  return new RegExp('<meta\\s+name="tractorvs-release-sha"\\s+content="'+sha+'"\\s*\\/?>').test(html);
}
async function currentPreview({pr,sha,token}){
  if(!/^[1-9][0-9]*$/.test(pr||"")||!SHA.test(sha||"")||!token)
    throw Error("Missing PR number, exact head SHA or GitHub read token");
  const url="https://api.github.com/repos/onuronkol2-collab/tractorcompare-data/issues/"+pr+"/comments?per_page=100";
  for(let attempt=0;attempt<30;attempt++){
    const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(12000),
      headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json"}});
    if(response.status!==200)throw Error("GitHub preview comment HTTP "+response.status);
    const origin=previewOriginFromComments(await response.json(),sha);
    if(origin){
      const page=await fetch(origin+"/",{redirect:"error",signal:AbortSignal.timeout(16000)});
      if(page.status===200&&hasPreviewRelease(await page.text(),sha))return origin;
      if(![200,404,502,503,504].includes(page.status))throw Error("Preview release HTTP "+page.status);
    }
    if(attempt<29)await sleep(10000);
  }
  throw Error("Current PR preview never exposed its exact head SHA");
}
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

export async function verifyPreviewAssets({origin,fetchFn=fetch}={}){
  if(typeof origin!=="string"||!PREVIEW_HOST.test(origin))throw Error("No cross-domain or production image probes");
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
    const origin=await currentPreview({pr:process.env.PREVIEW_PR_NUMBER,sha:process.env.PREVIEW_HEAD_SHA,token:process.env.GH_TOKEN});
    console.log("TRACTORVS_720_PREVIEW_RELEASE "+JSON.stringify({origin,sha:process.env.PREVIEW_HEAD_SHA}));
    const checked=await verifyPreviewAssets({origin});
    console.log("TRACTORVS_720_PREVIEW_SUMMARY "+
      JSON.stringify({checked:checked.length,errors:0,productionDeployment:false}));
  }catch(error){
    console.error("TRACTORVS_720_PREVIEW_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
