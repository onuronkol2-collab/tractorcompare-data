import test from "node:test";
import assert from "node:assert/strict";
import {inspectModelImageRights,MODEL_PHOTO_LOCALES} from "../scripts/verify-built-model-image-rights.mjs";

const origin="https://tractorvs.example";
const photo={
  fileId:"sample-model-abc123",fullUrl:"/images/tractors/sample-model-abc123-1920.jpg",
  photographer:"Photographer One",licenseName:"CC BY-SA 4.0",
  licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",
  sourcePage:"https://commons.wikimedia.org/wiki/File:Example_tractor.jpg",
  copyrightOwner:"Photographer One",
  copyrightClaimUrl:"https://commons.wikimedia.org/wiki/File:Example_tractor.jpg",
  copyrightEvidence:"commons-own-work-self-license"
};
const html=(p=photo,edits={})=>{
 const image={
   "@type":"ImageObject",
   contentUrl:new URL(p.fullUrl,origin).toString(),
   creator:{"@type":"Person",name:p.photographer},
   creditText:p.photographer+" · "+p.licenseName,
   license:p.licenseUrl,acquireLicensePage:p.sourcePage,
   ...(p.copyrightOwner?{copyrightNotice:p.copyrightOwner}:{}),
   ...edits,
 };
 return '<html><img src="'+p.fullUrl+'"><script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@graph":[image]})+'</script></html>';
};
test("passes source-matched copyright claim with no invented site ownership",()=>{
 const r=inspectModelImageRights(html(),[photo],origin);
 assert.deepEqual(r.issues,[]);
 assert.equal(r.notice,true);
 assert.equal(MODEL_PHOTO_LOCALES.length,10);
});
test("blocks missing recommended copyrightNotice when its independent ownership proof exists",()=>{
 const r=inspectModelImageRights(html(photo,{copyrightNotice:undefined}),[photo],origin);
 assert.match(r.issues.join(" "),/Verified copyright owner missing/);
});
test("rejects false owner, mismatched source page, and swapped Creative Commons deed",()=>{
 for(const alteration of [
  {copyrightNotice:"TractorVS"},
  {acquireLicensePage:"https://commons.wikimedia.org/wiki/File:Other.jpg"},
  {license:"https://creativecommons.org/licenses/by/2.0/"},
  {creator:{"@type":"Person",name:"Other photographer"}},
  {creditText:"Other · CC BY-SA 4.0"}
 ])assert.notEqual(inspectModelImageRights(html(photo,alteration),[photo],origin).issues.length,0);
});
test("unverified photographer can be credited without fictitious copyright title",()=>{
 const ordinary={...photo,copyrightOwner:undefined,copyrightEvidence:undefined};
 const good=inspectModelImageRights(html(ordinary),[ordinary],origin);
 assert.deepEqual(good.issues,[]);
 assert.equal(good.notice,false);
 const bad=inspectModelImageRights(html(ordinary,{copyrightNotice:"Photographer One"}),[ordinary],origin);
 assert.match(bad.issues.join(" "),/Unverified/);
});
test("CC0 photographs never claim ownership, even when an author is credited",()=>{
 const cc0={...photo,copyrightOwner:undefined,copyrightEvidence:undefined,
   licenseName:"CC0",licenseUrl:"https://creativecommons.org/publicdomain/zero/1.0/"};
 assert.deepEqual(inspectModelImageRights(html(cc0),[cc0],origin).issues,[]);
 assert.match(inspectModelImageRights(html(cc0,{copyrightNotice:"Photographer One"}),[cc0],origin).issues.join(" "),/CC0/);
});
test("blocks dropped markup, unknown first-party photo ID and out-of-registry image",()=>{
 assert.match(inspectModelImageRights('<img src="/images/tractors/sample-model-abc123-1920.jpg">',[photo],origin).issues.join(" "),/ImageObject/);
 assert.match(inspectModelImageRights(html(photo,{contentUrl:origin+"/images/tractors/unknown-1920.jpg"}),[photo],origin).issues.join(" "),/unapproved/);
 assert.equal(inspectModelImageRights('<html>No photo yet</html>',[photo],origin).hasPhoto,false);
});
