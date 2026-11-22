import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const component=readFileSync(new URL("../src/components/TractorCatalog.astro",import.meta.url),"utf8");
const photo=readFileSync(new URL("../src/components/TractorPhoto.astro",import.meta.url),"utf8");

test("offscreen paint optimization is restricted to large SSR catalogues",()=>{
 assert.match(component,/"tractor-card-grid--large": catalog\.tractors\.length >= 100/);
 assert.match(component,/@supports \(content-visibility: auto\)/);
 assert.match(component,/\.tractor-card-grid--large > \.tractor-card\s*\{\s*content-visibility: auto;/);
 assert.match(component,/contain-intrinsic-block-size: auto 410px/);
 assert.match(component,/@media \(max-width:680px\)/);
 assert.match(component,/contain-intrinsic-block-size: auto 520px/);
 assert.doesNotMatch(component,/content-visibility:\s*hidden/);
});

test("every published card remains server-rendered, crawlable, searchable and comparable",()=>{
 assert.match(component,/catalog\.tractors\.map\(\(tractor\)=>/);
 assert.match(component,/href=\{detailPrefix\+tractor\.slug\+"\/"\}/);
 assert.match(component,/data-search=/);
 assert.match(component,/cardSearchKeys\[i\]\.includes\(normalized\)/);
 assert.match(component,/if \(card\.hidden !== !match\) card\.hidden = !match/);
 assert.match(component,/id=\{firstBrandCard\.get/);
 assert.match(component,/data-catalog-brand-jump/);
 assert.match(component,/form="catalog-compare"/);
 assert.match(component,/<TractorPhoto tractor=\{tractor\} lang=\{lang\} mode="catalog" sprite \/>/);
 assert.match(photo,/loading=\{mode==="hero"&&index===0\?"eager":"lazy"\}/);
});

test("optimizing rendering does not add scripts, remote data or change data privacy",()=>{
 assert.doesNotMatch(component,/requestIdleCallback|IntersectionObserver/);
 assert.doesNotMatch(component,/fetch\(["']https?:\/\//);
 assert.doesNotMatch(component,/catalog\.tractors\.slice\(/);
});
