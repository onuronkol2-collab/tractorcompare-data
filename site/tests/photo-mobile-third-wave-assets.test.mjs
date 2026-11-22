import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {
 approvedMobilePhotoFormats,approvedLocalMobileAsset,
 PUBLIC_THIRD_WAVE12_IDS,PUBLIC_BATCH15_IDS,MOBILE_PILOT_IDS
} from "../src/lib/approved-mobile-photo-assets.mjs";
import {APPROVED_TRACTOR_PHOTOS,photoText,resolveApprovedPhotoSource}
 from "../src/lib/tractor-photos.ts";
import {PUBLICATION_HOLD_IDS}
 from "../scripts/photo-mobile-second-batch-public-coverage.mjs";
import {THIRD_WAVE_IDS}
 from "../scripts/photo-mobile-third-wave.mjs";
import {LOCALES} from "../src/lib/locales.ts";

const proof=JSON.parse(readFileSync(
 new URL("../docs/photo-mobile-third-wave-assets-evidence.json",import.meta.url),"utf8"));
const ui=readFileSync(new URL("../src/components/TractorPhoto.astro",import.meta.url),"utf8");
const worker=readFileSync(new URL("../worker/index.js",import.meta.url),"utf8");

test("third-wave exact public source identities are disjoint from previous releases and publication holds",()=>{
 assert.equal(proof.schema,"tractorvs-third-wave-12-live-approved-photo-assets-sha-v1");
 assert.equal(proof.publishApproved,false);
 assert.equal(proof.sourceActionsRun,45034166209);
 assert.equal(proof.sourceArtifactId,14758679323);
 assert.equal(proof.recordCount,12);
 assert.equal(proof.derivativeCount,24);
 assert.deepEqual(PUBLIC_THIRD_WAVE12_IDS,THIRD_WAVE_IDS);
 assert.equal(new Set(PUBLIC_THIRD_WAVE12_IDS).size,12);
 assert.equal(new Set([...MOBILE_PILOT_IDS,...PUBLIC_BATCH15_IDS,...PUBLIC_THIRD_WAVE12_IDS]).size,30);
 assert.ok(PUBLIC_THIRD_WAVE12_IDS.every(id=>!PUBLICATION_HOLD_IDS.includes(id)));
 assert.deepEqual(proof.records.map(x=>x.fileId),PUBLIC_THIRD_WAVE12_IDS);
 for(const x of proof.records){
  const reviewed=APPROVED_TRACTOR_PHOTOS.filter(p=>p.fileId===x.fileId);
  assert.equal(reviewed.length,1,"one original licensed source");
  const p=reviewed[0];
  assert.match(p.licenseName,/^CC BY-SA (?:3\.0|4\.0)$/);
  assert.match(p.sourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.ok(p.photographer.trim());
  assert.equal(p.configurationExact,false);
  assert.equal(x.publishApproved,false);
  assert.match(x.originalSha256,/^[a-f0-9]{64}$/);
  assert.equal(x.derivatives.length,2);
 }
});
test("exactly twenty-four deployed static binaries match reviewed source-locked quality ledger",()=>{
 let count=0,total=0;
 for(const row of proof.records){
  const formats=approvedMobilePhotoFormats(row.fileId);
  assert.equal(formats?.jpegUrl,"/images/tractors/"+row.fileId+"-720.jpg");
  assert.equal(formats?.webpUrl,"/images/tractors/"+row.fileId+"-720.webp");
  assert.equal(formats?.width,720);
  for(const variant of row.derivatives){
   const ext=variant.format==="jpeg"?"jpg":variant.format==="webp"?"webp":null;
   assert.ok(ext,variant.file);
   const relative="/images/tractors/"+row.fileId+"-720."+ext;
   assert.equal(variant.file,row.fileId+"-720."+ext);
   assert.equal(variant.width,720);
   assert.ok(variant.height>=120);
   assert.ok(variant.psnrDb>=30);
   const mime=ext==="jpg"?"image/jpeg":"image/webp";
   assert.equal(approvedLocalMobileAsset(relative)?.mime,mime);
   assert.equal(resolveApprovedPhotoSource(relative),null,
      "never construct unsupported 720px Commons URL");
   const bytes=readFileSync(new URL("../public"+relative,import.meta.url));
   assert.equal(bytes.length,variant.bytes,relative);
   assert.equal(createHash("sha256").update(bytes).digest("hex"),variant.sha256,relative);
   if(ext==="jpg"){
    assert.equal(bytes.readUInt16BE(0),0xffd8);
    assert.equal(bytes.readUInt16BE(bytes.length-2),0xffd9);
   }else{
    assert.equal(bytes.toString("ascii",0,4),"RIFF");
    assert.equal(bytes.toString("ascii",8,12),"WEBP");
   }
   count++;total+=bytes.length;
  }
 }
 assert.equal(count,24);
 assert.ok(total>1000000,"verify real nonempty locally staged image files");
});
test("old URLs, unknown IDs, unpublished identities, fullscreen/credits and all ten languages remain intact",()=>{
 for(const id of PUBLICATION_HOLD_IDS){
  assert.equal(approvedMobilePhotoFormats(id),null);
  assert.equal(approvedLocalMobileAsset("/images/tractors/"+id+"-720.webp"),null);
  assert.equal(approvedLocalMobileAsset("/images/tractors/"+id+"-720.jpg"),null);
 }
 assert.equal(approvedLocalMobileAsset("/images/tractors/unreviewed-720.webp"),null);
 assert.equal(approvedLocalMobileAsset(
  "/images/tractors/"+PUBLIC_THIRD_WAVE12_IDS[0]+"-720.avif"),null);
 assert.match(worker,/approvedLocalMobileAsset\(url\.pathname\)/);
 assert.match(worker,/env\.ASSETS\.fetch\(request\)/);
 assert.match(worker,/localMobile\.mime/);
 assert.match(worker,/resolveApprovedPhotoSource\(url\.pathname\)/);
 assert.match(ui,/<picture>/);
 assert.match(ui,/mobile\.webpUrl\+" 720w"/);
 assert.match(ui,/mobile\.jpegUrl\+" 720w/);
 assert.match(ui,/photo\.thumbUrl\+" 480w/);
 assert.match(ui,/photo\.displayUrl\+" 960w"/);
 assert.match(ui,/data-photo-url=\{photo\.fullUrl\}/);
 assert.match(ui,/photoText\(lang,"resizedDerivative"\)/);
 for(const locale of LOCALES){
  assert.ok(photoText(locale,"resizedDerivative").length>=15,
   "Adaptation credit must remain shown in "+locale);
 }
});
