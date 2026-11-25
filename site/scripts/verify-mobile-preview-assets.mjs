/**
 * Read-only Cloudflare PR preview proof of six SHA-pinned CC-licensed local
 * derivative assets. Never touches production, Supabase, IndexNow or paid APIs.
 * A 200 response with the wrong MIME/body/hash is a hard failure.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {hasReleaseSha} from "../src/lib/release-provenance.mjs";

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
// A Workers build can succeed without a PR comment. For an ordinary branch
// name, the documented preview alias is a candidate, never release evidence.
// Longer names use Cloudflare's truncation/hash scheme; use the bot URL only
// rather than guessing that hash. No production or arbitrary host permitted.
export function previewOriginFromBranch(branch){
  if(typeof branch!=="string"||!branch||branch.length>250||!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch)||branch==="main")return null;
  const slug=branch.toLowerCase().replace(/[^a-z0-9-]/g,"-");
  const label=slug+"-tractorvs-site";
  if(!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(label)||label.length>63)return null;
  return "https://"+label+".onuronkol2.workers.dev";
}
export function hasPreviewRelease(html,sha){
  return typeof sha==="string"&&SHA.test(sha)&&hasReleaseSha(html,sha);
}
export async function verifyPreviewIdentity(origin,sha,fetchFn=fetch){
  if(typeof origin!=="string"||!PREVIEW_HOST.test(origin)||typeof sha!=="string"||!SHA.test(sha))
    throw Error("Invalid preview identity target");
  const page=await fetchFn(origin+"/",{redirect:"error",signal:AbortSignal.timeout(16000),headers:{"Cache-Control":"no-cache",Accept:"text/html"}});
  if(page.status===429||page.headers.get("retry-after"))throw Error("Preview rate limited; honor cooldown");
  if(![200,404,502,503,504].includes(page.status))throw Error("Preview release HTTP "+page.status);
  if(page.status!==200)return {ready:false,status:page.status};
  if(!/^text\/html(?:;|$)/i.test(page.headers.get("content-type")||""))throw Error("Preview homepage MIME mismatch");
  const html=await page.text();
  return {ready:hasPreviewRelease(html,sha),status:page.status};
}
export async function currentPreview({pr,sha,token,branch,fetchFn=fetch,pause=sleep,attempts=30,log=()=>{}}={}){
  if(!/^[1-9][0-9]*$/.test(pr||"")||!SHA.test(sha||"")||!token||
    !Number.isInteger(attempts)||attempts<1||attempts>30)
    throw Error("Missing PR number, exact head SHA or GitHub read token");
  const url="https://api.github.com/repos/onuronkol2-collab/tractorcompare-data/issues/"+pr+"/comments?per_page=100";
  const branchOrigin=previewOriginFromBranch(branch);
  for(let attempt=0;attempt<attempts;attempt++){
    const response=await fetchFn(url,{redirect:"error",signal:AbortSignal.timeout(12000),
      headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json"}});
    if(response.status===429||response.headers.get("retry-after"))throw Error("GitHub preview lookup rate limited; honor cooldown");
    if(response.status!==200)throw Error("GitHub preview comment HTTP "+response.status);
    const comments=await response.json();
    const commentOrigin=previewOriginFromComments(comments,sha);
    const candidates=[...new Set([commentOrigin,branchOrigin].filter(Boolean))];
    const inspected=[];
    for(const origin of candidates){
      let identity;
      try{identity=await verifyPreviewIdentity(origin,sha,fetchFn);}
      catch(e){
        // Network failure on a candidate is not evidence of an incorrect
        // image. Only retry transient fetch failures, not HTTP policy errors.
        if(!(e instanceof TypeError)&&e?.name!=="TimeoutError"&&e?.name!=="AbortError")throw e;
        inspected.push({origin,reason:"network-unavailable"});continue;
      }
      inspected.push({origin,status:identity.status,ready:identity.ready});
      if(identity.ready){log({attempt:attempt+1,source:origin===commentOrigin?"bot-comment":"branch-alias",origin,sha});return origin;}
    }
    log({attempt:attempt+1,commentFound:Boolean(commentOrigin),branchCandidate:Boolean(branchOrigin),inspected});
    if(attempt<attempts-1)await pause(10000);
  }
  throw Error("PREVIEW_DEPLOYMENT_PENDING: exact PR head SHA not observed; no remote image checks performed");
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
    const sha=process.env.PREVIEW_HEAD_SHA;
    const origin=await currentPreview({pr:process.env.PREVIEW_PR_NUMBER,sha,token:process.env.GH_TOKEN,branch:process.env.PREVIEW_HEAD_BRANCH,log:row=>console.log("TRACTORVS_PREVIEW_READINESS "+JSON.stringify(row))});
    console.log("TRACTORVS_720_PREVIEW_RELEASE "+JSON.stringify({origin,sha:process.env.PREVIEW_HEAD_SHA}));
    const checked=await verifyPreviewAssets({origin});
    if(!(await verifyPreviewIdentity(origin,sha)).ready)throw Error("PREVIEW_DEPLOYMENT_CHANGED: release changed during image checks; evidence not complete");
    console.log("TRACTORVS_720_PREVIEW_SUMMARY "+
      JSON.stringify({checked:checked.length,errors:0,productionDeployment:false}));
  }catch(error){
    console.error("TRACTORVS_720_PREVIEW_FAILED "+String(error?.message||error));
    process.exitCode=1;
  }
}
