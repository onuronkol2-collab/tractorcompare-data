import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {approvedMobilePhotoFormats,approvedLocalMobileAsset,MOBILE_PILOT_IDS} from "../src/lib/approved-mobile-photo-assets.mjs";
import {APPROVED_TRACTOR_PHOTOS,photoText} from "../src/lib/tractor-photos.ts";
import {LOCALES} from "../src/lib/locales.ts";

const evidence=JSON.parse(readFileSync(new URL("../docs/photo-mobile-720-artifact-evidence.json",import.meta.url),"utf8"));
const component=readFileSync(new URL("../src/components/TractorPhoto.astro",import.meta.url),"utf8");
const worker=readFileSync(new URL("../worker/index.js",import.meta.url),"utf8");

test("exactly three CC BY-SA model identities match their SHA-pinned offline provenance",()=>{
 assert.equal(evidence.schema,"tractorvs-offline-licensed-photo-derivative-proof-v1");
 assert.equal(evidence.publishApproved,false,"release requires independent proof");
 assert.equal(evidence.sourceArtifactId,14755135156);
 assert.deepEqual([...evidence.records.map(x=>x.fileId)].sort(),[...MOBILE_PILOT_IDS].sort());
 assert.equal(evidence.records.length,3);
 for(const record of evidence.records){
  const matched=APPROVED_TRACTOR_PHOTOS.filter(p=>p.fileId===record.fileId);
  assert.equal(matched.length,1,"Approved file identity must be unique");
  const source=matched[0];
  assert.equal(source.brand,record.brand);
  assert.equal(source.model,record.model);
  assert.equal(source.photographer,record.photographer);
  assert.equal(source.licenseName,record.licenseName);
  assert.equal(source.sourcePage,record.sourcePage);
  assert.equal(source.configurationExact,false);
  assert.equal(record.derivatives.length,2);
  const url=approvedMobilePhotoFormats(record.fileId);
  assert.ok(url);
  assert.equal(url.jpegUrl,"/images/tractors/"+record.fileId+"-720.jpg");
  assert.equal(url.webpUrl,"/images/tractors/"+record.fileId+"-720.webp");
 }
});
test("all six first-party static images match exact expected bytes, SHA and MIME signatures",()=>{
 let verified=0;
 for(const r of evidence.records){
  for(const item of r.derivatives){
   const url="/images/tractors/"+r.fileId+"-720."+item.ext;
   const asset=approvedLocalMobileAsset(url);
   assert.equal(asset?.fileId,r.fileId);
   assert.equal(asset?.mime,item.ext==="jpg"?"image/jpeg":"image/webp");
   const data=readFileSync(new URL("../public"+url,import.meta.url));
   assert.equal(data.length,item.bytes,url);
   assert.equal(createHash("sha256").update(data).digest("hex"),item.sha256,url);
   assert.equal(item.width,720);
   assert.ok(item.height>100);
   assert.ok(item.psnrDb>=30);
   if(item.ext==="jpg"){
    assert.equal(data.readUInt16BE(0),0xffd8);
    assert.equal(data.readUInt16BE(data.length-2),0xffd9);
   }else{
    assert.equal(data.toString("ascii",0,4),"RIFF");
    assert.equal(data.toString("ascii",8,12),"WEBP");
   }
   verified++;
  }
 }
 assert.equal(verified,6);
});
test("unguarded arbitrary 720 formats and held unpublished model files stay inaccessible",()=>{
 for(const path of [
  "/images/tractors/unknown-720.jpg",
  "/images/tractors/unknown-720.webp",
  "/images/tractors/kubota-m5-112-c3be6b9d-720.jpg",
  "/images/tractors/kubota-m5-112-c3be6b9d-720.webp",
  "/images/tractors/belarus-80-1-nikolai-bulykin-kosmos-2026-640.webp",
  "/images/tractors/belarus-80-1-nikolai-bulykin-kosmos-2026-720.avif",
  "/images/tractors/../admin/720.jpg",
 ]){
  assert.equal(approvedLocalMobileAsset(path),null,path);
 }
 assert.equal(approvedMobilePhotoFormats("kubota-m5-112-c3be6b9d"),null);
 assert.match(worker,/approvedLocalMobileAsset\(url\.pathname\)/);
 assert.match(worker,/env\.ASSETS\.fetch\(request\)/);
 assert.match(worker,/localMobile\.mime/);
 assert.match(worker,/resolveApprovedPhotoSource\(url\.pathname\)/);
});
test("picture uses allowlisted local 720px WebP only on mobile <=2x, retains crawlable JPEG and fullscreen",()=>{
 assert.match(component,/<picture>/);
 assert.match(component,/type="image\/webp"/);
 assert.match(component,/max-resolution:2dppx/);
 assert.match(component,/mobile\.jpegUrl\+" 720w/);
 assert.match(component,/photo\.displayUrl\+" 960w"/);
 assert.match(component,/data-photo-url=\{photo\.fullUrl\}/);
 assert.match(component,/data-photo-credit=\{photo\.photographer\}/);
 assert.match(component,/data-photo-license=\{photo\.licenseUrl\}/);
 assert.match(component,/photoText\(lang,"resizedDerivative"\)/);
 for(const locale of LOCALES){
  assert.ok(photoText(locale,"resizedDerivative").length>15,
    "Ten-language CC attribution adaptation note: "+locale);
 }
});
