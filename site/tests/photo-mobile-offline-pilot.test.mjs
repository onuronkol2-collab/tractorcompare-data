import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PILOT_FILE_IDS,selectRightsReviewedPilot} from "../scripts/photo-mobile-offline-pilot.mjs";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";

test("offline-only image pilot uses exactly three existing licensed photos and no private drafts",()=>{
  assert.equal(PILOT_FILE_IDS.length,3);
  const proof=selectRightsReviewedPilot();
  assert.equal(proof.publishAllowed,false);
  assert.equal(proof.expectedFiles,3);
  assert.deepEqual(proof.selected.map(x=>x.fileId),PILOT_FILE_IDS);
  for(const photo of proof.selected){
    assert.ok(photo.firstParty960.endsWith(photo.fileId+"-960.jpg"));
    assert.ok(photo.commonsSource.includes("/960px-"));
    assert.ok(photo.sourcePage.startsWith("https://commons.wikimedia.org/wiki/File:"));
    assert.ok(photo.licenseUrl.startsWith("https://creativecommons.org/licenses/by-sa/"));
    assert.equal(photo.expectedMime,"image/jpeg");
    assert.equal(photo.configurationExact,false);
  }
});
test("pilot fails closed when a licensed photo identity, source or author is missing",()=>{
  const validated=APPROVED_TRACTOR_PHOTOS.map(x=>({...x}));
  const first=PILOT_FILE_IDS[0];
  const original=validated.find(x=>x.fileId===first);
  assert.ok(original);
  for(const variation of [
    {photographer:""},
    {licenseName:"unverified"},
    {configurationExact:true},
    {sourcePage:"https://evil.example/Image.jpg"},
    {originDisplayUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/b/Example/720px-Example"},
    {displayUrl:"/images/tractors/another-file-960.jpg"},
  ]){
    const copied=validated.map(x=>x.fileId===first?{...x,...variation}:x);
    assert.throws(()=>selectRightsReviewedPilot(copied),/rights\/identity gate failed/);
  }
  assert.throws(()=>selectRightsReviewedPilot(validated.filter(x=>x.fileId!==first)),
    /missing\/duplicated/);
  assert.throws(()=>selectRightsReviewedPilot([...validated,original]),/missing\/duplicated/);
});
test("offline optimizer cannot publish or change the public photo component",()=>{
  const optimizer=readFileSync(new URL("../scripts/photo-mobile-offline-pilot.py",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../src/components/TractorPhoto.astro",import.meta.url),"utf8");
  assert.match(optimizer,/publishAllowed/);
  assert.match(optimizer,/MAX_SOURCE_BYTES = 3_000_000/);
  assert.match(optimizer,/RestrictedRedirect/);
  assert.match(optimizer,/Image\.Resampling\.LANCZOS/);
  assert.match(optimizer,/ATTRIBUTION\.md/);
  assert.match(optimizer,/sha256/);
  assert.match(ui,/srcset=\{photo\.thumbUrl\+" 480w, "\+photo\.displayUrl\+" 960w"\}/);
  assert.doesNotMatch(ui,/720w|\.webp/);
});
