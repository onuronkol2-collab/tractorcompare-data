import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {currentPreview,verifyPreviewIdentity} from "./verify-mobile-preview-assets.mjs";
import {waitForWorkersBuild} from "./workers-build-readiness.mjs";
import {publicImageMimeOk} from "./image-seo-http.mjs";
const sha=process.env.PREVIEW_HEAD_SHA,token=process.env.GH_TOKEN;
await waitForWorkersBuild({sha,token,attempts:20,intervalMs:10000,log:console.log});
const origin=await currentPreview({pr:process.env.PREVIEW_PR_NUMBER,sha,token,branch:process.env.PREVIEW_HEAD_BRANCH,attempts:12,log:console.log});
const stem="/images/tractors/valtra-q225-a6c1308e";
const res=await fetch(origin+stem+"-960.jpg",{redirect:"error",signal:AbortSignal.timeout(35000),headers:{Accept:"image/jpeg","Cache-Control":"no-cache"}});
const mime=res.headers.get("content-type"),data=Buffer.from(await res.arrayBuffer()),fallback=res.headers.get("X-TractorVS-Image-Fallback");
if(res.status!==200||!/^image\/jpeg(?:;|$)/i.test(mime||"")||!publicImageMimeOk(mime,data))throw Error("Q225 preview JPEG unavailable or invalid");
const digest=x=>createHash("sha256").update(x).digest("hex");
if(fallback!==null){
 const local=readFileSync(new URL("../public"+stem+"-480.jpg",import.meta.url));
 if(fallback!=="480"||res.headers.get("X-TractorVS-Image-Source")!=="local"||digest(data)!==digest(local)||!/(?:^|,\s*)s-maxage=1800(?:,|$)/.test(res.headers.get("cache-control")||""))throw Error("Invalid fallback: not exact local lower resolution");
}
if(!(await verifyPreviewIdentity(origin,sha)).ready)throw Error("Preview SHA changed");
console.log("PHOTO_LEGACY_PREVIEW "+JSON.stringify({sha,origin,path:stem+"-960.jpg",http:res.status,bytes:data.length,fallback,sha256:digest(data)}));
