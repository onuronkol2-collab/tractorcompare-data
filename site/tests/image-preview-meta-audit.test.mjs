import test from "node:test";
import assert from "node:assert/strict";
import {previewMetadataIssues} from "../scripts/image-preview-meta-audit.mjs";
import {LOCALES} from "../src/lib/locales.ts";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";
const origin="https://tractorvs.com";
const photo=APPROVED_TRACTOR_PHOTOS.find(p=>p.fileId==="belarus-82-1-homoatrox-2019");
assert.ok(photo,"approved rights proof must remain");
const ogImage=origin+photo.fullUrl;
const canonical=origin+"/tr/tractors/belarus-82-1-940a988a/";
const fixture=(values={})=>{
 const p={ogImage,twitter:ogImage,canonical,robots:"index,follow,max-image-preview:large",...values};
 return "<!doctype html><html><head>"+
  "<meta property='og:image' content='"+p.ogImage+"'>"+
  "<meta name='twitter:image' content='"+p.twitter+"'>"+
  "<meta name='twitter:card' content='summary_large_image'>"+
  "<meta name='robots' content='"+p.robots+"'>"+
  "<link href='"+p.canonical+"' rel='canonical'>"+
  "</head><body></body></html>";
};
const inspect=(html,overrides={})=>previewMetadataIssues(html,{canonical,ogImage,jsonLdImage:ogImage,...overrides});
test("approved full-size preview and canonical pass",()=>{assert.deepEqual(inspect(fixture()),[]);});
test("stale 960px preview is caught",()=>{
 assert.ok(inspect(fixture({ogImage:origin+photo.displayUrl})).some(v=>v.includes("og:image")));
});
test("Twitter, canonical, robots, and structured image mismatch each fail",()=>{
 for(const wrong of [
 {twitter:origin+"/images/tractors/another-1920.jpg"},
 {canonical:origin+"/tr/tractors/wrong/"},
 {robots:"index,follow"}
 ])assert.ok(inspect(fixture(wrong)).length>0);
 assert.ok(inspect(fixture(),{jsonLdImage:origin+"/images/tractors/wrong-1920.jpg"}).length>0);
});
test("duplicate tags, unknown URLs and missing server HTML fail",()=>{
 assert.ok(inspect(fixture().replace("</head>","<meta property='og:image' content='"+ogImage+"'></head>")).length>0);
 assert.ok(inspect("<body></body>").length>0);
 assert.ok(inspect(fixture(),{ogImage:"https://example.invalid/unlicensed.jpg"}).length>0);
});
test("all ten localized canonical model URLs validate without changing the approved photo",()=>{
 assert.equal(LOCALES.length,10);
 for(const locale of LOCALES){
  const url=origin+(locale==="en"?"":"/"+locale)+"/tractors/belarus-82-1-940a988a/";
  assert.deepEqual(previewMetadataIssues(fixture({canonical:url}),{canonical:url,ogImage,jsonLdImage:ogImage}),[],locale);
 }
});
