import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import worker from "../worker/index.js";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {approvedMobilePhotoFormats,approvedLocalMobileAsset,PUBLIC_BATCH15_IDS,MOBILE_PILOT_IDS}
  from "../src/lib/approved-mobile-photo-assets.mjs";
import {PUBLICATION_HOLD_IDS} from "../scripts/photo-mobile-second-batch-public-coverage.mjs";

const ledger=JSON.parse(readFileSync(
  new URL("../docs/photo-mobile-batch15-evidence.json",import.meta.url),"utf8"));
const mime=ext=>ext==="webp"?"image/webp":"image/jpeg";

test("15 newly optimized images have real live-sitemap permission and original CC attribution",()=>{
 assert.equal(ledger.schema,"tractorvs-second-batch15-sha-pinned-release-v1");
 assert.equal(ledger.sourceActionsRun,45029082604);
 assert.equal(ledger.sourceArtifactId,14757380657);
 assert.equal(ledger.publishApproved,false,"Evidence is nonauthorizing; CI gates publication");
 assert.equal(ledger.publicPhotos,15);
 assert.equal(ledger.assetCount,30);
 assert.equal(ledger.records.length,15);
 assert.equal(new Set(PUBLIC_BATCH15_IDS).size,15);
 assert.equal(new Set(MOBILE_PILOT_IDS).size,3);
 assert.equal(new Set([...MOBILE_PILOT_IDS,...PUBLIC_BATCH15_IDS]).size,18);
 assert.deepEqual([...PUBLIC_BATCH15_IDS].sort(),ledger.records.map(x=>x.fileId).sort());
 assert.deepEqual([...PUBLICATION_HOLD_IDS].sort(),ledger.heldUnpublishedPhotoIds);
 for(const item of ledger.records){
   const source=APPROVED_TRACTOR_PHOTOS.filter(p=>p.fileId===item.fileId);
   assert.equal(source.length,1,item.fileId);
   assert.equal(source[0].brand,item.brand);
   assert.equal(source[0].model,item.model);
   assert.equal(source[0].photographer,item.photographer);
   assert.equal(source[0].licenseName,item.licenseName);
   assert.equal(source[0].licenseUrl,item.licenseUrl);
   assert.equal(source[0].sourcePage,item.sourcePage);
   assert.equal(source[0].configurationExact,false);
   assert.match(item.source960Sha256,/^[a-f0-9]{64}$/);
   assert.equal(item.derivatives.length,2);
   const paths=approvedMobilePhotoFormats(item.fileId);
   assert.equal(paths?.jpegUrl,"/images/tractors/"+item.fileId+"-720.jpg");
   assert.equal(paths?.webpUrl,"/images/tractors/"+item.fileId+"-720.webp");
 }
 for(const held of PUBLICATION_HOLD_IDS) {
   assert.equal(approvedMobilePhotoFormats(held),null,"Unpublished photo must not get a public route");
   assert.equal(approvedLocalMobileAsset("/images/tractors/"+held+"-720.webp"),null);
   assert.equal(approvedLocalMobileAsset("/images/tractors/"+held+"-720.jpg"),null);
 }
});

test("all 30 new JPEG/WebP files match exact measured SHA-256, dimensions and safe MIME",()=>{
 let verified=0,sourceBytes=0,jpegBytes=0,webpBytes=0;
 for(const item of ledger.records){
   sourceBytes+=item.source960Bytes;
   for(const derivative of item.derivatives){
     const path="/images/tractors/"+item.fileId+"-720."+derivative.ext;
     const data=readFileSync(new URL("../public"+path,import.meta.url));
     assert.equal(derivative.width,720);
     assert.ok(derivative.height>100);
     assert.ok(derivative.psnrDb>=30);
     assert.equal(derivative.bytes,data.length,path);
     assert.equal(createHash("sha256").update(data).digest("hex"),derivative.sha256,path);
     assert.equal(approvedLocalMobileAsset(path)?.mime,mime(derivative.ext));
     assert.ok(data.length<item.source960Bytes);
     if(derivative.ext==="jpg"){
       assert.equal(data.readUInt16BE(0),0xffd8);
       assert.equal(data.readUInt16BE(data.length-2),0xffd9);
       jpegBytes+=data.length;
     }else{
       assert.equal(data.toString("ascii",0,4),"RIFF");
       assert.equal(data.toString("ascii",8,12),"WEBP");
       webpBytes+=data.length;
     }
     verified++;
   }
 }
 assert.equal(verified,30);
 assert.ok(webpBytes<jpegBytes&&jpegBytes<sourceBytes);
});

test("Cloudflare Worker serves 30 local allowed assets with proper MIME, never probes Commons",async()=>{
 const calls=[];
 const env={ASSETS:{fetch:async request=>{
   const path=new URL(request.url).pathname;
   calls.push(path);
   const data=readFileSync(new URL("../public"+path,import.meta.url));
   return new Response(data,{status:200,
     headers:{"Content-Type":mime(path.split(".").at(-1))}});
 }}};
 const old=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error("Local mobile assets must never fetch Wikimedia");};
 try{
   for(const item of ledger.records){
     for(const d of item.derivatives){
       const path="/images/tractors/"+item.fileId+"-720."+d.ext;
       const response=await worker.fetch(new Request("https://tractorvs.com"+path),env);
       assert.equal(response.status,200);
       assert.equal(response.headers.get("Content-Type"),mime(d.ext));
       assert.equal(response.headers.get("X-Content-Type-Options"),"nosniff");
       assert.equal((await response.arrayBuffer()).byteLength,d.bytes);
     }
   }
 }finally{globalThis.fetch=old;}
 assert.equal(calls.length,30);
});
