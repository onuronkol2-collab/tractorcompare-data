import test from "node:test";
import assert from "node:assert/strict";
import {inspectVisibleMainImages} from "../scripts/seo-main-markup.mjs";

test("indexable public HTML images always have alt, including explicit decorative empty alt",()=>{
 const html=`<!doctype html><html lang="tr"><body>
 <header><img src="/brand.svg" alt="TractorVS"></header>
 <main id="main">
  <h1>Başak 2075 BK</h1>
  <img src="/tractor.jpg" alt="Başak 2075 BK tractor photo" width="800">
  <img src="/decorative.svg" alt="" aria-hidden="true">
  <img src='/source.jpg' alt='Source-backed tractor'>
 </main>
 <dialog><img id="zoom" alt=""></dialog>
 </body></html>`;
 assert.deepEqual(inspectVisibleMainImages(html),{
  foundMain:true,imagesChecked:3,missingAlt:[]
 });
});

test("missing or empty-attribute image alt is detected without treating alt empty quotes as missing",()=>{
 const html=`<main id="main"><img src="/a.jpg"><img alt="" src="/dec.svg">
 <img alt='descriptive' src="/b.jpg"><img alt src="/c.jpg"></main>`;
 assert.deepEqual(inspectVisibleMainImages(html),{
   foundMain:true,imagesChecked:4,missingAlt:[1,4]
 });
});

test("no main landmark is a distinct failure, but main with no photos is valid",()=>{
 assert.deepEqual(inspectVisibleMainImages("<html><body><img src='a.png'></body></html>"),
  {foundMain:false,imagesChecked:0,missingAlt:[]});
 assert.deepEqual(inspectVisibleMainImages("<main><h1>Published guide</h1></main>"),
  {foundMain:true,imagesChecked:0,missingAlt:[]});
});

test("SEO regex rejects scripts and images outside the main content, including photo modal",()=>{
 const html=`<main id="main"><p>Text only</p></main>
  <script type="module">let t="<img src='bad.png'>"</script>
  <dialog><img src="/lightbox.jpg"></dialog>`;
 assert.deepEqual(inspectVisibleMainImages(html),
  {foundMain:true,imagesChecked:0,missingAlt:[]});
});
