import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BATCH_FILE_IDS,selectReviewedSecondBatch} from "../scripts/photo-mobile-second-batch.mjs";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {MOBILE_PILOT_IDS,approvedMobilePhotoFormats} from "../src/lib/approved-mobile-photo-assets.mjs";

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
