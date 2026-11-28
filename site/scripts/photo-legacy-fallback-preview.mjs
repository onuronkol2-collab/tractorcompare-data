import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {currentPreview,verifyPreviewIdentity} from "./verify-mobile-preview-assets.mjs";
import {waitForWorkersBuild} from "./workers-build-readiness.mjs";
import {publicImageMimeOk} from "./image-seo-http.mjs";
const sha=process.env.PREVIEW_HEAD_SHA,token=process.env.GH_TOKEN;
await waitForWorkersBuild({sha,token,attempts:20,intervalMs:10000,log:console.log});
const origin=await currentPreview({pr:process.env.PREVIEW_PR_NUMBER,sha,token,branch:process.env.PREVIEW_HEAD_BRANCH,attempts:12,log:console.log});
const digest=x=>createHash("sha256").update(x).digest("hex");
for(const [id,size] of [["valtra-q225-a6c1308e",960],["tafe-7515-d8c32d69",1920],["valtra-a85-af39c01a",1920]]){
 const stem="/images/tractors/"+id,path=stem+"-"+size+".jpg";
 const res=await fetch(origin+path,{redirect:"error",signal:AbortSignal.timeout(45000),headers:{Accept:"image/jpeg","Cache-Control":"no-cache"}});
 const mime=res.headers.get("content-type"),data=Buffer.from(await res.arrayBuffer()),fallback=res.headers.get("X-TractorVS-Image-Fallback");
 if(res.status!==200||!/^image\/jpeg(?:;|$)/i.test(mime||"")||!publicImageMimeOk(mime,data))throw Error("Preview JPEG unavailable or invalid: "+path);
 if(fallback!==null){
  if(!["480","960"].includes(fallback)||Number(fallback)>=size||!/(?:^|,\s*)s-maxage=1800(?:,|$)/.test(res.headers.get("cache-control")||""))throw Error("Invalid fallback: "+path);
  if(res.headers.get("X-TractorVS-Image-Source")==="local"){
   const local=readFileSync(new URL("../public"+stem+"-"+fallback+".jpg",import.meta.url));
   if(digest(data)!==digest(local))throw Error("Fallback local hash mismatch: "+path);
  }else if(fallback!=="960")throw Error("480 fallback must be local");
 }
 console.log("PHOTO_LEGACY_PREVIEW "+JSON.stringify({sha,origin,path,http:res.status,bytes:data.length,fallback,sha256:digest(data)}));
}
if(!(await verifyPreviewIdentity(origin,sha)).ready)throw Error("Preview SHA changed");
