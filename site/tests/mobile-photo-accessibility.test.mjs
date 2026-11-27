import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const photo=readFileSync(new URL("../src/components/TractorPhoto.astro",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles/tractor-photos.css",import.meta.url),"utf8");

test("primary hero image has high fetch priority without forcing all catalog photos eagerly",()=>{
 assert.match(photo,/fetchpriority=\{mode==="hero"&&index===0\?"high":undefined\}/);
 assert.match(photo,/loading=\{mode==="hero"&&index===0\?"eager":"lazy"\}/);
 assert.match(photo,/srcset=/);
 assert.match(photo,/width=\{photo\.width\} height=\{photo\.height\}/);
});
test("catalog photo credits use accessible 24px+ hit areas and visible keyboard focus",()=>{
 const rule=css.match(/\.tractor-photo-short-credit a\{([^}]+)\}/)?.[1]||"";
 assert.match(rule,/display:inline-flex/);
 assert.match(rule,/min-height:2[4-9]px/);
 assert.match(css,/\.tractor-photo-short-credit a:focus-visible/);
});


test("multi-photo controls have unique ordinal labels and image-independent focus treatment",()=>{
 assert.match(photo,/aria-label=\{photoText\(lang,"open"\)\+": "\+label\+\(visiblePhotos\.length>1\?" — "\+\(index\+1\)\+"\/"\+visiblePhotos\.length:""\)\}/);
 assert.match(css,/\.tractor-photo-button:focus-visible::after\s*\{/);
 assert.match(css,/pointer-events: none/);
 assert.match(css,/forced-colors: active/);
 assert.match(css,/env\(safe-area-inset-top\)/);
 assert.match(photo,/href=\{photo\.sourcePage\}/);
 assert.match(photo,/href=\{photo\.licenseUrl\}/);
});
