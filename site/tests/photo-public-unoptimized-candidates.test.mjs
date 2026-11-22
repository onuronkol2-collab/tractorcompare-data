import test from "node:test";
import assert from "node:assert/strict";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
import {approvedMobilePhotoFormats} from "../src/lib/approved-mobile-photo-assets.mjs";
import {PUBLICATION_HOLD_IDS,PUBLIC_IMAGE_SITEMAP}
  from "../scripts/photo-mobile-second-batch-public-coverage.mjs";
import {auditPublicUnoptimizedPhotos,provePublicUnoptimizedPhotoCandidates}
  from "../scripts/photo-public-unoptimized-candidates.mjs";

const candidate=APPROVED_TRACTOR_PHOTOS.find(p=>
  !approvedMobilePhotoFormats(p.fileId)&&
  !PUBLICATION_HOLD_IDS.includes(p.fileId)&&
  /^CC BY-SA (?:3\.0|4\.0)$/.test(p.licenseName)&&
  p.model&&p.photographer&&p.configurationExact===false);
const optimized=APPROVED_TRACTOR_PHOTOS.find(p=>approvedMobilePhotoFormats(p.fileId));
const hold=APPROVED_TRACTOR_PHOTOS.find(p=>PUBLICATION_HOLD_IDS.includes(p.fileId));
assert.ok(candidate&&optimized&&hold,"Test requires three distinct real approved photos");

const page=(url,photos)=>
 '<url><loc>https://tractorvs.com'+url+'</loc>'+
 photos.map(p=>'<image:image><image:loc>https://tractorvs.com'+p.fullUrl+
 '</image:loc></image:image>').join("")+'</url>';
const XML=segments=>'<?xml version="1.0" encoding="utf-8"?>'+
 '<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
 segments.join("")+'</urlset>';

test("only sitemap-public photos qualify, 10 locales do not fabricate 10 independent models",()=>{
 const xml=XML([
  page("/tr/tractors/verified-model-a/",[candidate,optimized]),
  page("/de/tractors/verified-model-a/",[candidate]),
  page("/tr/tractors/verified-model-b/",[candidate,hold]),
  page("/tr/guides/tractor-technical-terms/",[candidate])
 ]);
 const data=auditPublicUnoptimizedPhotos(xml);
 assert.equal(data.schema,"tractorvs-live-unoptimized-photo-candidates-v1");
 assert.equal(data.publicationAllowed,false);
 assert.equal(data.publicSitemapPageEntries,4);
 assert.equal(data.approvedPublicPhotoIds,3);
 assert.equal(data.alreadyOptimizedPublicIds,1);
 assert.equal(data.heldPublicIds,1);
 assert.equal(data.eligiblePublicUnoptimizedIds,1);
 const row=data.candidates[0];
 assert.equal(row.fileId,candidate.fileId);
 assert.equal(row.uniqueModelVariants,2,
   "locale duplicates are not extra tractor variants");
 assert.equal(row.editorialPageCount,1);
 assert.equal(row.verifiedSitemapPageRefs,4);
 assert.equal(row.source960,"https://tractorvs.com"+candidate.displayUrl);
 assert.equal(row.licenseName,candidate.licenseName);
 assert.equal(row.publishAllowed,false);
});
test("unknown, draft/unpublished and unsupported-license photos never leak into optimization shortlist",()=>{
 const draft=APPROVED_TRACTOR_PHOTOS.find(p=>![
   candidate.fileId,optimized.fileId,hold.fileId
 ].includes(p.fileId));
 assert.ok(draft);
 const data=auditPublicUnoptimizedPhotos(XML([
  page("/tr/tractors/verified-model-a/",[candidate]),
  page("/tr/tractors/verified-model-b/",[optimized])
 ]));
 assert.equal(data.candidates.some(x=>x.fileId===draft.fileId),false);
 assert.equal(data.candidates.some(x=>x.fileId===hold.fileId),false);
 const noRights=APPROVED_TRACTOR_PHOTOS.map(p=>p.fileId===candidate.fileId
   ?{...p,licenseName:"unknown"}:p);
 const restricted=auditPublicUnoptimizedPhotos(XML([
  page("/tr/tractors/verified-model-a/",[candidate]),
  page("/tr/tractors/verified-model-b/",[optimized])
 ]),noRights);
 assert.equal(restricted.eligiblePublicUnoptimizedIds,0);
 assert.equal(restricted.notEligibleForThisBYSAOptimization,1);
});
test("missing/offsite/duplicate/bogus XML fails closed before generating any candidates",()=>{
 const ok=XML([page("/tr/tractors/one/",[candidate]),page("/tr/tractors/two/",[optimized])]);
 for(const s of [
  "<html>not public sitemap</html>",
  ok.replace("https://tractorvs.com/tr/tractors/one/","https://evil.example/tr/tractors/one/"),
  ok.replace('https://tractorvs.com/tr/tractors/one/','https://tractorvs.com/tr/tractors/one/?a=secret'),
  XML([page("/tr/tractors/one/",[candidate]),page("/tr/tractors/one/",[optimized])]),
  ok.replace('<url>','<url><loc>not-a-URL</loc>'),
 ]){
  assert.throws(()=>auditPublicUnoptimizedPhotos(s));
 }
 assert.throws(()=>auditPublicUnoptimizedPhotos(ok,
  [candidate,candidate,optimized]),/Duplicate/);
});
test("real sitemap request is read-only HTTPS XML and never queries arbitrary photo URLs",async()=>{
 const xml=XML([page("/tr/tractors/one/",[candidate]),page("/tr/tractors/two/",[optimized])]);
 const calls=[];
 const fake=async(url,opts)=>{
  calls.push({url,opts});
  return new Response(xml,{status:200,headers:{"Content-Type":"application/xml; charset=utf-8"}});
 };
 const result=await provePublicUnoptimizedPhotoCandidates({fetchFn:fake});
 assert.equal(result.eligiblePublicUnoptimizedIds,1);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,PUBLIC_IMAGE_SITEMAP);
 assert.equal(calls[0].opts.redirect,"error");
 await assert.rejects(provePublicUnoptimizedPhotoCandidates({
  fetchFn:async()=>new Response("<html>fake</html>",
    {status:200,headers:{"Content-Type":"text/html"}})
 }),/not HTTP 200\/XML/);
 await assert.rejects(provePublicUnoptimizedPhotoCandidates({
  fetchFn:async()=>new Response("429",
    {status:429,headers:{"Content-Type":"application/xml"}})
 }),/not HTTP 200\/XML/);
});
