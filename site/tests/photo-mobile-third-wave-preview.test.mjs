import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {exactThirdWaveAssets,verifyThirdWavePreview,THIRD_WAVE_PREVIEW}
 from "../scripts/verify-third-wave-preview-assets.mjs";

test("the third-wave preview is fixed to the sole isolated branch and 24 exact SHA-locked public assets",()=>{
 const rows=exactThirdWaveAssets();
 assert.equal(rows.length,24);
 assert.equal(rows.filter(x=>x.mime==="image/webp").length,12);
 assert.equal(rows.filter(x=>x.mime==="image/jpeg").length,12);
 assert.match(THIRD_WAVE_PREVIEW,/\.onuronkol2\.workers\.dev$/);
 assert.ok(rows.every(x=>x.path.startsWith("/images/tractors/")&&x.path.includes("-720.")));
 assert.throws(()=>exactThirdWaveAssets({records:[]}),/Missing SHA-pinned/);
});
test("even a 200 response must carry actual reviewed bytes, MIME and SHA; never query production",async()=>{
 const calls=[];
 const stub=async(url,opt)=>{
  calls.push([url,opt]);
  const path=new URL(url).pathname;
  const bytes=readFileSync(new URL("../public"+path,import.meta.url));
  return new Response(bytes,{status:200,headers:{
   "Content-Type":path.endsWith(".webp")?"image/webp":"image/jpeg"}});
 };
 const result=await verifyThirdWavePreview({fetchFn:stub,attempts:1});
 assert.equal(result.verifiedAssets,24);
 assert.equal(result.productionDeployment,false);
 assert.equal(calls.length,24);
 assert.ok(calls.every(x=>x[0].startsWith(THIRD_WAVE_PREVIEW)));
 await assert.rejects(verifyThirdWavePreview({
   origin:"https://tractorvs.com",fetchFn:stub,attempts:1
 }),/Untrusted preview/);
 await assert.rejects(verifyThirdWavePreview({
   fetchFn:async()=>new Response("HTML",{status:200,headers:{"Content-Type":"text/html"}}),
   attempts:1
 }),/MIME mismatch/);
 await assert.rejects(verifyThirdWavePreview({
   fetchFn:async(url)=>{
    const path=new URL(url).pathname;
    return new Response(Buffer.from("wrong file"),{status:200,headers:{
     "Content-Type":path.endsWith(".webp")?"image/webp":"image/jpeg"}});
   },attempts:1
 }),/bytes\/SHA mismatch/);
});
