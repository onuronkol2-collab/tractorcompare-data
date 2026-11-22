import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {EXPECTED_ORIGIN,previewCandidates,verifyPreviewAssets} from "../scripts/verify-mobile-preview-assets.mjs";

test("only six SHA-pinned CC review photo URLs can be checked on fixed PR preview",()=>{
 const assets=previewCandidates();
 assert.equal(assets.length,6);
 assert.equal(assets.filter(x=>x.mime==="image/webp").length,3);
 assert.equal(assets.filter(x=>x.mime==="image/jpeg").length,3);
 assert.ok(assets.every(x=>x.urlPath.startsWith("/images/tractors/")&&
   x.urlPath.includes("-720.")&&x.sha256.length===64));
 assert.match(EXPECTED_ORIGIN,/\.onuronkol2\.workers\.dev$/);
 assert.throws(()=>previewCandidates({records:[]}),/Invalid reviewed/);
});
test("preview client checks actual bytes, size and MIME rather than trusting HTTP 200",async()=>{
 const calls=[];
 const fetchFn=async (url,opts)=>{
   calls.push({url,opts});
   const path=new URL(url).pathname;
   const data=readFileSync(new URL("../public"+path,import.meta.url));
   const mime=path.endsWith(".webp")?"image/webp":"image/jpeg";
   return new Response(data,{status:200,headers:{"Content-Type":mime}});
 };
 const verified=await verifyPreviewAssets({fetchFn});
 assert.equal(verified.length,6);
 assert.equal(calls.length,6);
 assert.ok(calls.every(x=>x.opts.redirect==="error"));
 await assert.rejects(verifyPreviewAssets({
   origin:"https://tractorvs.com",
   fetchFn
 }),/No cross-domain or production/);
 await assert.rejects(verifyPreviewAssets({fetchFn:async()=>new Response(
   "<html>not an image</html>",{status:200,headers:{"Content-Type":"text/html"}}
 )}),/MIME mismatch/);
 await assert.rejects(verifyPreviewAssets({fetchFn:async()=>new Response(
   Buffer.from("fake-data"),{status:200,headers:{"Content-Type":"image/webp"}}
 )}),/MIME mismatch|SHA\/size mismatch/);
});
