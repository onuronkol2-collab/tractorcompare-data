import test from "node:test";
import assert from "node:assert/strict";
import {imageLicenseMetadataIssues as inspect} from "../scripts/image-license-jsonld-check.mjs";

const commons="https://commons.wikimedia.org/wiki/File:Valtra_G135_Agritechnica_2025_%28DSC09509%29.jpg";
const photo={
  "@type":"ImageObject",
  "contentUrl":"https://tractorvs.com/images/tractors/valtra-g135-9d4a4ea3-1920.jpg",
  "creditText":"MarcelX42 · CC BY-SA 4.0",
  "license":"https://creativecommons.org/licenses/by-sa/4.0/",
  "acquireLicensePage":commons,
};
const html=(image=photo)=>`<!doctype html><html><head><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"Thing",name:"Valtra G135"},image]})}</script></head></html>`;

test("new live image metadata validator accepts real image-specific Commons reuse links",()=>{
  const r=inspect(html());
  assert.deepEqual(r.issues,[]);
  assert.equal(r.count,1);
  assert.equal(r.acquireLicensePage,commons);
  assert.equal(r.license,photo.license);
});
test("CC0 photograph is accepted without inventing a copyright holder",()=>{
  const r=inspect(html({...photo,
    contentUrl:"https://tractorvs.com/images/tractors/valtra-f105-80828837-1920.jpg",
    license:"https://creativecommons.org/publicdomain/zero/1.0/",
    acquireLicensePage:"https://commons.wikimedia.org/wiki/File:Valtra_F105_auf_der_Agritechnica_2023.jpg",
    creditText:"Johann Brause · CC0"}));
  assert.deepEqual(r.issues,[]);
});
test("missing recommended Google acquireLicensePage is detected automatically",()=>{
  const {acquireLicensePage,...bad}=photo;
  assert.match(inspect(html(bad)).issues.join(" "),/acquireLicensePage/);
});
test("rejects generic CC deed or spoofed Commons host as reuse acquisition page",()=>{
  for(const badUrl of [
    "https://creativecommons.org/licenses/by-sa/4.0/",
    "https://commons.wikimedia.org.evil.test/wiki/File:Valtra.jpg",
    "http://commons.wikimedia.org/wiki/File:Valtra.jpg",
    "javascript:alert(1)"
  ]) assert.match(inspect(html({...photo,acquireLicensePage:badUrl})).issues.join(" "),/acquireLicensePage/);
});
test("rejects fabricated ownership notice and mismatched image host",()=>{
  assert.match(inspect(html({...photo,copyrightNotice:"© MarcelX42"})).issues.join(" "),/ownership/);
  assert.match(inspect(html({...photo,contentUrl:"https://attacker.test/photo.jpg"})).issues.join(" "),/contentUrl/);
  assert.match(inspect(html({...photo,url:commons})).issues.join(" "),/ImageObject.url/);
});
test("rejects invalid or absent Google ImageObject data",()=>{
  assert.match(inspect("<script type='application/ld+json'>{invalid</script>").issues.join(" "),/Invalid JSON-LD/);
  assert.match(inspect("<html></html>").issues.join(" "),/exactly one/);
  assert.match(inspect(html({...photo,license:"https://creativecommons.org/licenses/by-nc/4.0/"})).issues.join(" "),/unapproved/);
});


test("verified same-author Commons copyright claim passes the Google ImageObject validator",()=>{
 const withNotice={...photo,creator:{"@type":"Person",name:"MarcelX42"},
   copyrightNotice:"MarcelX42"};
 const result=inspect(html(withNotice),{expectedCopyrightOwner:"MarcelX42"});
 assert.deepEqual(result.issues,[]);
 assert.equal(result.copyrightNotice,"MarcelX42");
 assert.match(inspect(html(photo),{expectedCopyrightOwner:"MarcelX42"}).issues.join(" "),/copyrightNotice/);
 assert.match(inspect(html({...withNotice,copyrightNotice:"TractorVS"})).issues.join(" "),/ownership/);
 assert.match(inspect(html({...withNotice,copyrightNotice:"© MarcelX42"})).issues.join(" "),/ownership/);
 const cc0={...withNotice,license:"https://creativecommons.org/publicdomain/zero/1.0/"};
 assert.match(inspect(html(cc0)).issues.join(" "),/ownership/);
});
