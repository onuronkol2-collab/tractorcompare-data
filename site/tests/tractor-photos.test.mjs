import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {APPROVED_TRACTOR_PHOTOS,tractorPhotos,primaryTractorPhoto,photoText,tractorPhotoAlt,resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";
const file=p=>readFileSync(new URL("../src/"+p,import.meta.url),"utf8");
const tractor=(brand_name,model_name)=>({
  tractor_id:"1a2b3c4d-1234-5678-90ab-abcdef012345",slug:"test-model",
  brand_name,model_name,brand_country:null,brand_website_url:null,
  market:"global",variant:"D-243 specification",model_year:null,horsepower:null,
  engine:null,transmission:null,drivetrain:null,weight_kg:null,specifications:[]
});
test("only exact matching tractor model identity receives a verified photo",()=>{
  assert.equal(APPROVED_TRACTOR_PHOTOS.length,11);
  assert.equal(tractorPhotos(tractor("Belarus","82.1")).length,4);
  assert.equal(tractorPhotos(tractor("Belarus","80.1")).length,1);
  assert.equal(tractorPhotos(tractor("New Holland","T5.110")).length,1);
  assert.equal(tractorPhotos(tractor("New Holland","T6.180")).length,1);
  assert.equal(tractorPhotos(tractor("Case IH","Puma 150")).length,1);
  assert.equal(tractorPhotos(tractor("McCormick","X5.120")).length,1);
  assert.equal(tractorPhotos(tractor("McCormick","X5.110")).length,1);
  assert.equal(tractorPhotos(tractor("Landini","5-110")).length,1);
  assert.equal(tractorPhotos(tractor("Case IH","Puma 155")).length,0);
  assert.equal(primaryTractorPhoto(tractor("Unknown Brand","X")),null);
});
test("each approved photograph has a verified model source and re-use license",()=>{
  const ids=new Set();
  for(const image of APPROVED_TRACTOR_PHOTOS){
    assert.ok(!ids.has(image.fileId));ids.add(image.fileId);
    for(const field of ["thumbUrl","displayUrl","fullUrl"])
      assert.match(image[field],/^\/images\/tractors\/[a-z0-9-]+-(480|960|1920)\.jpg$/);
    for(const field of ["originThumbUrl","originDisplayUrl","originFullUrl"])
      assert.match(image[field],/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//);
    assert.match(image.sourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(image.licenseUrl,/^https:\/\/creativecommons\.org\/licenses\/by-sa\/(3|4)\.0\/$/);
    assert.ok(image.photographer.trim());
    assert.equal(image.configurationExact,false);
  }
});
test("the photo proxy accepts only fixed photo identities and resolutions",()=>{
  for(const photo of APPROVED_TRACTOR_PHOTOS){
    assert.equal(resolveApprovedPhotoSource(photo.thumbUrl),photo.originThumbUrl);
    assert.equal(resolveApprovedPhotoSource(photo.displayUrl),photo.originDisplayUrl);
    assert.equal(resolveApprovedPhotoSource(photo.fullUrl),photo.originFullUrl);
  }
  for(const uri of [
    "/images/tractors/missing-960.jpg",
    "/images/tractors/../../../admin",
    "/images/tractors/belarus-82-1-homoatrox-2019-999.jpg",
    "/images/tractors/https://example.com/480.jpg"
  ])assert.equal(resolveApprovedPhotoSource(uri),null);
});
test("all photo interface controls are localized to ten languages",()=>{
  assert.equal(LOCALES.length,10);
  for(const locale of LOCALES){
    for(const key of ["image","open","close","credit","representative"])
      assert.ok(photoText(locale,key).length>=3,key+" "+locale);
    assert.match(tractorPhotoAlt(tractor("Belarus","82.1"),locale),/82\.1/);
  }
});
test("ImageObject includes rights and never introduces Product rich result eligibility",()=>{
  const doc=modelStructuredData(tractor("Belarus","82.1"),"tr","https://tractorvs.com/");
  const parts=doc["@graph"],thing=parts.find(x=>x["@type"]==="Thing"),
    image=parts.find(x=>x["@type"]==="ImageObject"),
    page=parts.find(x=>x["@type"]==="WebPage");
  assert.ok(image);assert.ok(thing);assert.ok(page);
  assert.equal(thing.image["@id"],image["@id"]);
  assert.equal(page.primaryImageOfPage["@id"],image["@id"]);
  assert.equal(image.creditText,"Homoatrox · CC BY-SA 3.0");
  assert.match(image.license,/creativecommons\.org/);
  assert.match(image.caption,/Belarus 82\.1/);
  assert.ok(!parts.some(x=>["Vehicle","Product"].includes(x["@type"])));
  assert.ok(!modelStructuredData(tractor("Belarus","80.0"),"tr","https://tractorvs.com/")["@graph"]
    .some(x=>x["@type"]==="ImageObject"));
});
test("fullscreen viewer, linked credits and public image sitemap use SSR images",()=>{
  const gallery=file("components/TractorPhoto.astro"),
    lightbox=file("components/PhotoLightbox.astro"),
    detail=file("components/TractorDetail.astro"),
    catalog=file("components/TractorCatalog.astro"),
    compare=file("components/TractorComparison.astro"),
    layout=file("layouts/SiteLayout.astro"),
    sitemap=file("pages/image-sitemap.xml.ts"),
    robots=file("pages/robots.txt.ts");
  assert.match(gallery,/src=\{mode==="hero"\?photo.displayUrl:photo.thumbUrl\}/);
  assert.match(gallery,/photo\.sourcePage/);
  assert.match(gallery,/photo\.licenseUrl/);
  assert.match(lightbox,/<dialog/);
  assert.match(lightbox,/dialog\.showModal\(\)/);
  assert.match(detail,/class="model-compare-action"/);
  assert.ok(detail.indexOf('class="model-compare-action"')<detail.indexOf('<TractorPhoto'));
  assert.match(catalog,/mode="catalog"/);
  assert.match(compare,/id="tc-left-photo"/);
  assert.match(compare,/id="tc-right-photo"/);
  assert.match(layout,/<PhotoLightbox lang=\{lang\} \/>/);
  assert.match(sitemap,/for\(const tractor of catalog\.tractors\)/);
  assert.match(sitemap,/for\(const locale of LOCALES\)/);
  assert.match(robots,/image-sitemap\.xml/);
});
