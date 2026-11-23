import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {primaryTractorPhoto} from "../src/lib/tractor-photos.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";

const read=(relative)=>readFileSync(new URL(relative,import.meta.url),"utf8");
const detail=read("../src/components/TractorDetail.astro");
const layout=read("../src/layouts/SiteLayout.astro");
function tractor(brand_name,model_name){
 return {tractor_id:"1a2b3c4d-1234-5678-90ab-abcdef012345",slug:"test-model",
  brand_name,model_name,market:"global",variant:"D-243 specification",model_year:null,
  brand_country:null,brand_website_url:null,horsepower:null,
  engine:null,transmission:null,drivetrain:null,weight_kg:null,specifications:[]};
}

test("model Open Graph image chooses the licensed high-resolution first-party photo, not the smaller display variant",()=>{
 assert.match(detail,/ogImage=\{cover && Astro\.site \? new URL\(cover\.fullUrl,Astro\.site\)\.toString\(\) : null\}/);
 assert.doesNotMatch(detail,/ogImage=\{cover && Astro\.site \? new URL\(cover\.displayUrl,Astro\.site\)/);
 assert.match(layout,/\{ogImage && <meta property="og:image" content=\{ogImage\} \/>\}/);
 assert.match(layout,/\{ogImage && <meta name="twitter:image" content=\{ogImage\} \/>\}/);
 assert.match(layout,/max-image-preview:large/);
});
test("ten locale schemas agree on the exact approved photo and never invent an unapproved photo",()=>{
 const sample=tractor("Belarus","82.1");
 const photo=primaryTractorPhoto(sample);
 assert.ok(photo);
 assert.match(photo.fullUrl,/^\/images\/tractors\/[a-z0-9-]+-1920\.jpg$/);
 const full=new URL(photo.fullUrl,"https://tractorvs.com/").toString();
 const thumb=new URL(photo.displayUrl,"https://tractorvs.com/").toString();
 for(const lang of LOCALES){
  const graph=modelStructuredData(sample,lang,"https://tractorvs.com/")["@graph"];
  const page=graph.find(part=>part["@type"]==="WebPage");
  const image=graph.find(part=>part["@type"]==="ImageObject");
  assert.ok(image,"image must be source-backed in "+lang);
  assert.equal(page.primaryImageOfPage["@id"],image["@id"],lang);
  assert.equal(image.contentUrl,full,lang);
  assert.equal(image.thumbnailUrl,thumb,lang);
  assert.equal(image.license,photo.licenseUrl,lang);
  assert.equal(image.acquireLicensePage,photo.sourcePage,lang);
  assert.equal(image.creator.name,photo.photographer,lang);
 }
 const unknown=tractor("Unknown Brand","No-Photo-2026");
 assert.equal(primaryTractorPhoto(unknown),null);
 const empty=modelStructuredData(unknown,"tr","https://tractorvs.com/")["@graph"];
 assert.equal(empty.find(part=>part["@type"]==="ImageObject"),undefined);
 assert.equal(empty.find(part=>part["@type"]==="WebPage").primaryImageOfPage,undefined);
});
