import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {APPROVED_TRACTOR_PHOTOS,resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";

test("Restored high-resolution JPEGs preserve existing photo identity and license",()=>{
 const p=JSON.parse(readFileSync(new URL("../docs/photo-existing-hires-repair-20261124.json",import.meta.url),"utf8"));
 assert.equal(p.entries.length,2);
 for(const e of p.entries){
  const photo=APPROVED_TRACTOR_PHOTOS.find(x=>x.fileId===e.fileId);assert.ok(photo);assert.equal(photo.photographer,p.author);assert.equal(photo.licenseName,p.license);assert.equal(photo.resizedDerivative,true);assert.equal(decodeURIComponent(photo.sourcePage),decodeURIComponent(e.sourcePage));assert.ok(Math.max(...e.meanRgbDifferenceAgainstExisting480)<20);
  for(const d of e.derivatives){const b=readFileSync(new URL("../public/images/tractors/"+d.file,import.meta.url));assert.equal(b.length,d.bytes);assert.equal(createHash("sha256").update(b).digest("hex"),d.sha256);assert.equal(b.subarray(0,3).toString("hex"),"ffd8ff");assert.equal(b.subarray(-2).toString("hex"),"ffd9");assert.ok(resolveApprovedPhotoSource("/images/tractors/"+d.file));}
 }
});
