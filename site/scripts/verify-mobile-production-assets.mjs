/**
 * Read-only release proof for the three exact public 720px CC-derived photos.
 * A main-branch GitHub merge is NOT assumed to mean Cloudflare deployed it.
 * Probe real tractorvs.com bytes and two model page renderings before claiming
 * production delivery; never call Supabase, Wikimedia or IndexNow.
 */
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {previewCandidates} from "./verify-mobile-preview-assets.mjs";
export const LIVE_ORIGIN="https://tractorvs.com";
export const LIVE_PHOTO_PAGES=Object.freeze([
  {path:"/tr/tractors/belarus-80-1-ca3d18f9/",
    fileId:"belarus-80-1-nikolai-bulykin-kosmos-2026",
    photographer:"Nikolai Bulykin"},
  {path:"/de/tractors/antonio-carraro-tigre-3800-fc5f6f1d/",
    fileId:"antonio-carraro-tigre-3800-439af04e",
    photographer:"Radosław Drożdżewski"},
]);

export function inspectLivePhotoMarkup(html,record){
  const normalized=String(html||"");
  const url=LIVE_ORIGIN+record.path;
  const issues=[];
  if(!normalized.includes('rel="canonical"')||!normalized.includes('href="'+url+'"'))
    issues.push("missing matching canonical");
  if(/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(normalized))
    issues.push("unexpected noindex");
  if(!normalized.includes("<picture>"))issues.push("missing native picture element");
  if(!normalized.includes(record.fileId+"-720.webp"))issues.push("missing 720px WebP source");
  if(!normalized.includes(record.fileId+"-720.jpg"))issues.push("missing JPEG fallback");
  if(!normalized.includes(record.fileId+"-1920.jpg"))issues.push("missing fullscreen original link");
  if(!normalized.includes(record.photographer))issues.push("missing original photographer credit");
  if(!normalized.includes("creativecommons.org/licenses/by-sa/4.0/"))
    issues.push("missing Commons license link");
  if(!normalized.includes("image/webp"))issues.push("missing WebP MIME on source");
  return {ok:issues.length===0,issues};
}

async function checkedFetch(fetchFn,url,kind){
  const res=await fetchFn(url,{
    redirect:"error",signal:AbortSignal.timeout(18000),
    headers:{"Accept":kind==="image"?"image/avif,image/webp,image/jpeg":"text/html"}
  });
  return res;
}
export async function verifyLiveMobilePhotos({
  fetchFn=fetch,attempts=20,sleep=ms=>new Promise(done=>setTimeout(done,ms))
}={}){
  const files=previewCandidates();
  const proof=[];
  // Cloudflare Git deployment can trail the merge. A bounded grace period
  // is acceptable, but any mismatched 200 or unexpected response fails closed.
  for(const [index,item] of files.entries()){
    const url=LIVE_ORIGIN+item.urlPath;
    let confirmed=null;
    for(let trial=0;trial<attempts;trial++){
      let res;
      try{res=await checkedFetch(fetchFn,url,"image");}
      catch(err){
        if(index===0&&trial<attempts-1){await sleep(7000);continue;}
        throw Error("Production image request failed "+item.urlPath+": "+err.message);
      }
      if(res.status===404||res.status===502||res.status===503){
        if(index===0&&trial<attempts-1){await sleep(7000);continue;}
        throw Error("Production photo missing after deploy grace period: "+item.urlPath+" HTTP "+res.status);
      }
      if(res.status!==200)throw Error("Production image HTTP "+res.status+": "+item.urlPath);
      if(!(res.headers.get("content-type")||"").toLowerCase().startsWith(item.mime))
        throw Error("Production MIME mismatch: "+item.urlPath);
      const bytes=Buffer.from(await res.arrayBuffer());
      if(bytes.length!==item.bytes||
        createHash("sha256").update(bytes).digest("hex")!==item.sha256)
        throw Error("Production size/SHA mismatch: "+item.urlPath);
      confirmed={path:item.urlPath,bytes:item.bytes,mime:item.mime,sha256:item.sha256};
      break;
    }
    if(!confirmed)throw Error("Unverified production photo: "+item.urlPath);
    proof.push(confirmed);
    console.log("TRACTORVS_LIVE_720_IMAGE "+JSON.stringify(confirmed));
  }
  const pages=[];
  for(const item of LIVE_PHOTO_PAGES){
    let confirmed=null;
    for(let trial=0;trial<attempts;trial++){
      const res=await checkedFetch(fetchFn,LIVE_ORIGIN+item.path,"html");
      if(res.status!==200)throw Error("Live model HTTP "+res.status+": "+item.path);
      const check=inspectLivePhotoMarkup(await res.text(),item);
      if(check.ok){confirmed={path:item.path,rendered:true,canonical:true,
        rightsVisible:true};break;}
      if(trial===attempts-1)
        throw Error("Live photo page missing verified features "+item.path+" "+
          check.issues.join("; "));
      await sleep(7000);
    }
    pages.push(confirmed);
    console.log("TRACTORVS_LIVE_720_PAGE "+JSON.stringify(confirmed));
  }
  return {imageAssets:proof.length,modelPages:pages.length,errors:0,
    origin:LIVE_ORIGIN,provenance:"verified_sha256_and_html_not_main_merge_only"};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const proof=await verifyLiveMobilePhotos();
    console.log("TRACTORVS_LIVE_720_RELEASE_PROOF "+JSON.stringify(proof));
  }catch(e){console.error("TRACTORVS_LIVE_720_RELEASE_BLOCKED "+String(e?.message||e));
    process.exitCode=1;}
}
