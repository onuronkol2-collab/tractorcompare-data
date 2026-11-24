import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const home=read("components/HomeExperience.astro");
const photo=read("components/TractorPhoto.astro");
const grid=read("styles/home-experience.css");
const global=read("styles/global.css");

test("featured photo sizes track the actual card grid and container breakpoints",()=>{
  assert.ok(home.includes('mode="catalog" slotSizes="auto, (max-width:620px) min(calc(100vw - 88px), 508px), (max-width:720px) 219px, (max-width:800px) calc(50vw - 85px), min(calc(33.333vw - 80px), 323px)"'));
  assert.match(grid,/\.home-featured-grid\s*\{[^}]*repeat\(3,minmax\(0,1fr\)\)[^}]*gap:\s*18px/);
  assert.match(grid,/\.home-featured-card\s*\{[^}]*padding:\s*25px[^}]*border:\s*1px/);
  assert.match(grid,/@media\s*\(max-width:\s*800px\)/);
  assert.match(grid,/\.home-featured-grid\s*\{[^}]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(grid,/@media\s*\(max-width:\s*620px\)/);
  assert.match(grid,/\.home-featured-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.ok(global.includes("width: min(1160px, calc(100% - 48px))"));
  assert.ok(global.includes("width: min(100% - 36px, 560px)"));
});

test("non-hero slots and lazy hero extras use accurate sizes; first hero priority and attribution remain",()=>{
  const sizes='sizes={mode==="hero"?(index===0?"(max-width:760px) calc(100vw - 48px), 860px":"auto, (max-width:620px) min(calc(50vw - 23px), 275px), (max-width:720px) 180px, min(calc(33.333vw - 22.667px), 294px)"):(slotSizes ?? "(max-width:680px) calc(100vw - 36px), 400px")}';
  assert.equal(photo.split(sizes).length-1,2);
  assert.ok(photo.includes('loading={mode==="hero"&&index===0?"eager":"lazy"}'));
  assert.ok(photo.includes('fetchpriority={mode==="hero"&&index===0?"high":undefined}'));
  assert.ok(photo.includes('data-photo-url={photo.fullUrl}'));
  assert.ok(photo.includes('data-photo-license={photo.licenseUrl}'));
  assert.ok(photo.includes('data-photo-source={photo.sourcePage}'));
  assert.ok(photo.includes('photo.thumbUrl+" 480w, "'));
  assert.ok(photo.includes('photo.displayUrl+" 960w"'));
});

test("catalog and detail lazy image slots follow their actual layout rather than a hero width",()=>{
 const catalog=read("components/TractorCatalog.astro");
 const css=read("styles/tractor-photos.css");
 assert.ok(catalog.includes('mode="catalog" sprite slotSizes="auto, (max-width:540px) calc(100vw - 76px), (max-width:720px) 240px, (max-width:940px) 400px, 350px"'));
 assert.match(catalog,/\.catalog-results-panel \.tractor-card-grid\{grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,245px\),1fr\)\);gap:clamp\(12px,2vw,20px\)/);
 assert.match(catalog,/\.catalog-discovery-layout\{display:grid;grid-template-columns:minmax\(225px,270px\)/);
 assert.match(catalog,/@media\(max-width:940px\)\{\.catalog-discovery-layout\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(global,/\.tractor-card \{[^}]*padding: 23px; border: 1px/);
 assert.match(global,/\.tractor-card \{ padding: 19px; \}/);
 assert.match(css,/\.tractor-photo-gallery--hero\{max-width:900px/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\);\s*gap:10px/);
 assert.match(css,/@media\(max-width:620px\)\s*\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.tractor-photo-frame:first-child \{\s*grid-column:1 \/ -1/);
 assert.ok(photo.includes('loading={mode==="hero"&&index===0?"eager":"lazy"}'));
 assert.ok(photo.includes('srcset={mobile.webpUrl+" 720w"}'));
 assert.ok(photo.includes('mobile.jpegUrl+" 720w, "'));
});
