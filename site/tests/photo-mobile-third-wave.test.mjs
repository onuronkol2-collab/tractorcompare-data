import test from "node:test";
import assert from "node:assert/strict";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {approvedMobilePhotoFormats} from "../src/lib/approved-mobile-photo-assets.mjs";
import {THIRD_WAVE_IDS,chooseThirdWavePublicPhotos,prepareThirdWaveManifest}
  from "../scripts/photo-mobile-third-wave.mjs";
import {auditPublicUnoptimizedPhotos}
  from "../scripts/photo-public-unoptimized-candidates.mjs";
import {readFileSync} from "node:fs";

const sources=THIRD_WAVE_IDS.map(id=>{
 const entries=APPROVED_TRACTOR_PHOTOS.filter(p=>p.fileId===id);
 assert.equal(entries.length,1,"one already reviewed rights source: "+id);
 assert.equal(approvedMobilePhotoFormats(id),null,"not previously optimized: "+id);
 return entries[0];
});
const pages=sources.map((photo,i)=>{
 const slug="third-wave-sample-"+i;
 return '<url><loc>https://tractorvs.com/tr/tractors/'+slug+'/</loc>'+
 '<image:image><image:loc>https://tractorvs.com'+photo.fullUrl+
 '</image:loc></image:image></url>';
});
const xml='<?xml version="1.0"?><urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
 pages.join("")+'</urlset>';
const fakeReport=()=>auditPublicUnoptimizedPhotos(xml);

test("twelve distinct real CC BY-SA public photos cover eight brands; no draft or already optimized",()=>{
 const coverage=fakeReport();
 assert.equal(coverage.eligiblePublicUnoptimizedIds,12);
 const manifest=chooseThirdWavePublicPhotos(coverage);
 assert.equal(manifest.kind,"tractorvs-third-wave-public-licensed-offline-photo-QA");
 assert.equal(manifest.publishAllowed,false);
 assert.equal(manifest.expectedFiles,12);
 assert.equal(manifest.selected.length,12);
 assert.equal(new Set(manifest.selected.map(x=>x.brand)).size,8);
 assert.deepEqual(manifest.selected.map(p=>p.fileId),THIRD_WAVE_IDS);
 for(const item of manifest.selected){
  assert.equal(item.configurationExact,false);
  assert.equal(item.expectedMime,"image/jpeg");
  assert.equal(item.firstParty960,"https://tractorvs.com/images/tractors/"+item.fileId+"-960.jpg");
  assert.ok(item.sourcePage.startsWith("https://commons.wikimedia.org/wiki/File:"));
  assert.ok(item.photographer.length>0);
  assert.match(item.licenseName,/^CC BY-SA (3\.0|4\.0)$/);
  assert.equal(item.publishedModelSlugs.length,1);
 }
});
test("unpublished, duplicate, altered license, invented exact variant and wrong first-party URL are refused",()=>{
 const proof=fakeReport();
 const first=THIRD_WAVE_IDS[0];
 assert.throws(()=>chooseThirdWavePublicPhotos(
   {...proof,candidates:proof.candidates.filter(x=>x.fileId!==first)}
 ),/Missing\/duplicate PUBLIC photo/);
 assert.throws(()=>chooseThirdWavePublicPhotos(
   {...proof,candidates:[...proof.candidates,proof.candidates.find(x=>x.fileId===first)]}
 ),/Missing\/duplicate PUBLIC photo/);
 for(const change of [
  {licenseName:"unlicensed"},
  {photographer:""},
  {exactVariantPhoto:true},
  {source960:"https://evil.invalid/images/tractors/nope.jpg"},
  {fullImage:"https://tractorvs.com/images/tractors/unreviewed-1920.jpg"},
  {publishedModelSlugs:[]},
  {publishAllowed:true},
 ]){
  const candidates=proof.candidates.map(x=>x.fileId===first?{...x,...change}:x);
  assert.throws(()=>chooseThirdWavePublicPhotos({...proof,candidates}),
   /Rights\/publication\/variant evidence incomplete/);
 }
});
test("the third-wave image generator never modifies site sources or deploys",()=>{
 const source=readFileSync(new URL("../scripts/photo-mobile-third-wave.py",import.meta.url),"utf8");
 assert.match(source,/EXACT_IDS = frozenset/);
 assert.match(source,/source_loader = codec\.fetch_jpeg/);
 assert.match(source,/codec\.derive/);
 assert.match(source,/source960Sha256/);
 assert.match(source,/ATTRIBUTION\.md/);
 assert.match(source,/published":0/);
 assert.match(source,/variant\["psnrDb"\] < 30\.0/);
 assert.doesNotMatch(source,/supabase|wrangler deploy|git push/i);
});
test("live selector performs one and only one sitemap fetch",async()=>{
 const fetchFn=async(url,options)=>{
  assert.equal(url,"https://tractorvs.com/image-sitemap.xml");
  assert.equal(options.redirect,"error");
  return new Response(xml,{status:200,headers:{"Content-Type":"application/xml"}});
 };
 const report=await prepareThirdWaveManifest({fetchFn});
 assert.equal(report.selected.length,12);
 assert.equal(report.publishAllowed,false);
});
