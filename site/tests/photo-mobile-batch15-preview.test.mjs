import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {expectedPreviewAssets,provePreviewBatch15,PREVIEW_ORIGIN}
  from "../scripts/verify-photo-batch15-preview.mjs";

test("preview permit list is exactly 15 published identities and 30 real sha-pinned photos",()=>{
 const entries=expectedPreviewAssets();
 assert.equal(entries.length,30);
 assert.equal(new Set(entries.map(x=>x.path)).size,30);
 assert.equal(entries.filter(x=>x.mime==="image/jpeg").length,15);
 assert.equal(entries.filter(x=>x.mime==="image/webp").length,15);
 assert.ok(entries.every(x=>x.path.includes("-720.")&&x.sha256.length===64));
 assert.match(PREVIEW_ORIGIN,/onuronkol2\.workers\.dev$/);
});

test("Cloudflare preview checker verifies real bytes and no production URL",async()=>{
 const requests=[];
 const fake=async(url,request)=>{
   requests.push({url,request});
   const path=new URL(url).pathname;
   const bytes=readFileSync(new URL("../public"+path,import.meta.url));
   return new Response(bytes,{status:200,headers:{
     "content-type":path.endsWith(".jpg")?"image/jpeg":"image/webp"}});
 };
 const result=await provePreviewBatch15({fetchImpl:fake,delay:async()=>{}});
 assert.equal(result.checked,30);
 assert.equal(result.errors,0);
 assert.equal(requests.length,30);
 assert.ok(requests.every(x=>x.url.startsWith(PREVIEW_ORIGIN)));
 await assert.rejects(provePreviewBatch15({origin:"https://tractorvs.com",fetchImpl:fake}),
   /No alternate origin/);
 await assert.rejects(provePreviewBatch15({fetchImpl:async()=>
   new Response("<html>200 but not a photo</html>",{status:200,
     headers:{"content-type":"text/html"}}),delay:async()=>{}}),/Wrong preview MIME/);
});
