import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BATCH_FILE_IDS,selectReviewedSecondBatch} from "../scripts/photo-mobile-second-batch.mjs";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {MOBILE_PILOT_IDS,approvedMobilePhotoFormats} from "../src/lib/approved-mobile-photo-assets.mjs";
import {evaluateLiveImageSitemap,PUBLICATION_HOLD_IDS} from "../scripts/photo-mobile-second-batch-public-coverage.mjs";

test("second batch selects 18 distinct licensed and already-approved images, excluding published 3",()=>{
 const manifest=selectReviewedSecondBatch();
 assert.equal(manifest.kind,"tractorvs-licensed-photo-second-batch");
 assert.equal(manifest.publishAllowed,false);
 assert.equal(manifest.expectedFiles,18);
 assert.equal(manifest.selected.length,18);
 assert.deepEqual(manifest.selected.map(x=>x.fileId),BATCH_FILE_IDS);
 assert.equal(new Set(manifest.selected.map(x=>x.fileId)).size,18);
 for(const photo of manifest.selected){
   assert.equal(MOBILE_PILOT_IDS.includes(photo.fileId),false);
   assert.equal(approvedMobilePhotoFormats(photo.fileId),null);
   assert.match(photo.firstParty960,/^https:\/\/tractorvs\.com\/images\/tractors\/[a-z0-9-]+-960\.jpg$/);
   assert.match(photo.originDisplayUrl,/\/960px-/);
   assert.ok(["CC BY-SA 3.0","CC BY-SA 4.0"].includes(photo.licenseName));
   assert.ok(photo.photographer.length>2);
   assert.equal(photo.configurationExact,false);
 }
});
test("second batch cannot silently accept an unreviewed photographer/license/model identity",()=>{
 const first=BATCH_FILE_IDS[0];
 const original=APPROVED_TRACTOR_PHOTOS.find(p=>p.fileId===first);
 assert.ok(original);
 for(const variation of [
   {photographer:""},
   {licenseName:"unverified rights"},
   {licenseUrl:"https://example.org/bad-license"},
   {sourcePage:"https://example.org/non-commons"},
   {originDisplayUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/x/y/photo.jpg/720px-photo.jpg"},
   {displayUrl:"/images/tractors/unapproved-960.jpg"},
   {configurationExact:true}
 ]){
   const modified=APPROVED_TRACTOR_PHOTOS.map(p=>
     p.fileId===first?{...p,...variation}:p);
   assert.throws(()=>selectReviewedSecondBatch(modified),/not verified/);
 }
 assert.throws(()=>selectReviewedSecondBatch(
   APPROVED_TRACTOR_PHOTOS.filter(p=>p.fileId!==first)),/Missing\/duplicate/);
 assert.throws(()=>selectReviewedSecondBatch(
   [...APPROVED_TRACTOR_PHOTOS,original]),/Missing\/duplicate/);
});
test("bulk QA workflow has no publishing, GitHub write token or arbitrary source search",()=>{
 const py=readFileSync(new URL("../scripts/photo-mobile-second-batch.py",import.meta.url),"utf8");
 const workflow=readFileSync(new URL("../../.github/workflows/photo-mobile-second-batch.yml",import.meta.url),"utf8");
 assert.match(py,/publishAllowed/);
 assert.match(py,/source960Bytes/);
 assert.match(py,/TRACTORVS_BATCH18_SOURCE_BLOCKED/);
 assert.match(py,/ATTRIBUTION.md/);
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/if: always\(\)/);
 assert.match(workflow,/retention-days: 5/);
 for(const forbidden of ["wrangler deploy","git push","supabase db","contents: write","workflow_dispatch:"]){
   assert.doesNotMatch(workflow,new RegExp(forbidden));
 }
});

test("only fifteen real public image sitemap photos are eligible; three staged IDs are held",()=>{
 const items=selectReviewedSecondBatch().selected;
 const publicPhotos=items.filter(p=>!PUBLICATION_HOLD_IDS.includes(p.fileId));
 assert.equal(publicPhotos.length,15);
 const xml='<?xml version="1.0"?><urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
   publicPhotos.map(photo=>{
     const original=APPROVED_TRACTOR_PHOTOS.find(x=>x.fileId===photo.fileId);
     return '<url><loc>https://tractorvs.com/tr/tractors/example/</loc><image:image>'+
       '<image:loc>https://tractorvs.com'+original.fullUrl+'</image:loc>'+
       '</image:image></url>';
   }).join('')+'</urlset>';
 const report=evaluateLiveImageSitemap(xml);
 assert.equal(report.ok,true);
 assert.equal(report.checked,18);
 assert.equal(report.publiclyVisible,15);
 assert.equal(report.eligibleForRelease.length,15);
 assert.equal(report.missing.length,3);
 assert.deepEqual(report.holdIds,PUBLICATION_HOLD_IDS);
 assert.deepEqual(report.missing.map(p=>p.fileId).sort(),[...PUBLICATION_HOLD_IDS].sort());
 const corrupted=xml.replace(publicPhotos[0].fileId+'-1920.jpg',"unknown-1920.jpg");
 const bad=evaluateLiveImageSitemap(corrupted);
 assert.equal(bad.ok,false,"Previously published source must not vanish silently");
 assert.equal(bad.unexpectedMissing.length,1);
 assert.ok(!report.eligibleForRelease.some(id=>PUBLICATION_HOLD_IDS.includes(id)));
});
