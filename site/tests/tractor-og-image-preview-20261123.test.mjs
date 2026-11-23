import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {
 APPROVED_TRACTOR_PHOTOS,preferredTractorPreviewUrl,primaryTractorPhoto,
 resolveApprovedPhotoSource
} from "../src/lib/tractor-photos.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";

const read=(name)=>readFileSync(new URL(name,import.meta.url),"utf8");

test("on-page LCP stays unchanged; social metadata uses approved responsive preview only",()=>{
 const detail=read("../src/components/TractorDetail.astro");
 const layout=read("../src/layouts/SiteLayout.astro");
 const img=read("../src/components/TractorPhoto.astro");
 assert.match(detail,/const cover=primaryTractorPhoto\(tractor\)/);
 assert.match(detail,/const socialPreviewImage=preferredTractorPreviewUrl\(cover\)/);
 assert.match(detail,/ogImage=\{socialPreviewImage && Astro\.site \? new URL\(socialPreviewImage,Astro\.site\)\.toString\(\) : null\}/);
 assert.match(layout,/<meta property="og:image" content=\{ogImage\}/);
 assert.match(layout,/<meta name="twitter:image" content=\{ogImage\}/);
 assert.match(layout,/max-image-preview:large/);
 assert.match(img,/loading=\{mode==="hero"&&index===0\?"eager":"lazy"\}/);
 assert.match(img,/fetchpriority=\{mode==="hero"&&index===0\?"high":undefined\}/);
});

test("only original source width at least 1200 qualifies for approved large preview",()=>{
 assert.ok(APPROVED_TRACTOR_PHOTOS.length>0);
 let large=0,small=0;
 for(const photo of APPROVED_TRACTOR_PHOTOS){
  const preview=preferredTractorPreviewUrl(photo);
  assert.equal(preview,photo.width>=1200?photo.fullUrl:photo.displayUrl,photo.fileId);
  if(photo.width>=1200){large++;assert.equal(resolveApprovedPhotoSource(preview),photo.originFullUrl);}
  else{small++;assert.equal(resolveApprovedPhotoSource(preview),photo.originDisplayUrl);}
  assert.match(preview,/^\/images\/tractors\/[a-z0-9-]+-(?:960|1920)\.jpg$/);
  assert.ok(photo.photographer&&photo.licenseUrl&&photo.sourcePage);
 }
 assert.ok(large>0,"large image fixture must be present");
 assert.equal(preferredTractorPreviewUrl(null),null);
 const photo=APPROVED_TRACTOR_PHOTOS[0];
 assert.equal(preferredTractorPreviewUrl({...photo,width:1000}),photo.displayUrl);
 assert.equal(preferredTractorPreviewUrl({...photo,height:0}),photo.displayUrl);
 assert.equal(preferredTractorPreviewUrl({...photo,width:NaN}),photo.displayUrl);
});

test("all ten locales use the SAME verified model image and existing rights provenance",()=>{
 const seen=new Set();
 for(const image of APPROVED_TRACTOR_PHOTOS){
  const tractor={
   tractor_id:image.tractorId||"11111111-1111-4111-8111-111111111111",
   slug:"approved-photo-model",brand_name:image.brand,model_name:image.model,
   market:null,variant:null,model_year:null,horsepower:null,brand_country:null,
   brand_website_url:null,engine:null,transmission:null,drivetrain:null,
   weight_kg:null,specifications:[]
  };
  const selected=primaryTractorPhoto(tractor);
  if(!selected)continue;
  const id=tractor.tractor_id+":"+tractor.brand_name+":"+tractor.model_name;
  if(seen.has(id))continue;
  seen.add(id);
  const preview=preferredTractorPreviewUrl(selected);
  assert.match(preview,/^\/images\/tractors\//);
  for(const locale of LOCALES){
   const obj=modelStructuredData(tractor,locale,"https://tractorvs.com/")["@graph"]
    .find(x=>x["@type"]==="ImageObject");
   assert.ok(obj,locale+" "+id);
   assert.equal(obj.contentUrl,"https://tractorvs.com"+selected.fullUrl);
   assert.equal(obj.license,selected.licenseUrl);
   assert.equal(obj.acquireLicensePage,selected.sourcePage);
   assert.equal(obj.creator.name,selected.photographer);
   assert.equal(preview,selected.width>=1200?selected.fullUrl:selected.displayUrl);
  }
 }
 assert.ok(seen.size>0);
 const unknown={brand_name:"Unknown",model_name:"Missing"};
 assert.equal(primaryTractorPhoto(unknown),null);
 assert.equal(preferredTractorPreviewUrl(primaryTractorPhoto(unknown)),null);
});
