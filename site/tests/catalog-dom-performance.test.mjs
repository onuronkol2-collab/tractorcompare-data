import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = (path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

const catalog = read("components/TractorCatalog.astro");
const photo = read("components/TractorPhoto.astro");

test("all catalog photo placeholders reuse one local SVG symbol; no unlicensed image is substituted",()=>{
 assert.equal((catalog.match(/<symbol id="tractorvs-catalog-photo-symbol"/g)||[]).length,1);
 assert.match(catalog,/class="catalog-photo-sprite"/);
 assert.match(catalog,/<TractorPhoto tractor=\{tractor\} lang=\{lang\} mode="catalog" sprite \/>/);
 assert.match(photo,/sprite && mode==="catalog"/);
 assert.match(photo,/<use href="#tractorvs-catalog-photo-symbol" \/>/);
 assert.match(photo,/photos\.length===0/);
 assert.match(photo,/tractor-photo-placeholder/);
 assert.match(photo,/role="note"/);
 assert.match(photo,/photoText\(lang,"pending"\)/);
 // Retain a standalone inline silhouette for hero/compare, where the catalog
 // symbol is deliberately not guaranteed to exist.
 assert.match(photo,/<circle cx="41" cy="53" r="13"/);
 assert.match(photo,/sprite=false/);
});

test("SEO-safe catalog optimization retains every published SSR detail link and global filtering",()=>{
 assert.match(catalog,/catalog\.tractors\.map\(\(tractor\)=>/);
 assert.match(catalog,/href=\{detailPrefix\+tractor\.slug\+"\/"\}/);
 assert.match(catalog,/data-search=/);
 assert.match(catalog,/card\.hidden = !match/);
 assert.match(catalog,/filterCatalog\(requested\)/);
 assert.match(catalog,/data-catalog-brand-jump/);
 assert.doesNotMatch(catalog,/catalog\\.tractors\\.slice\\(0,\\s*60\\)/);
});

test("one sprite definition is decorative and never introduces a keyboard focus target",()=>{
 assert.match(catalog,/<svg class="catalog-photo-sprite"[^>]*aria-hidden="true" focusable="false"/);
 assert.match(photo,/<use href="#tractorvs-catalog-photo-symbol" \/>/);
 assert.doesNotMatch(catalog,/content-visibility:\s*hidden|display:\s*none\s*;\s*\/\*\s*all models/);
});

test("published-only mobile search caches normalized card text and avoids redundant DOM writes",()=>{
 // A growing SSR catalogue must not normalize hundreds of strings per keystroke.
 assert.match(catalog,/const cardSearchKeys = cards\.map\(card => normalizeTractorQuery\(card\.dataset\.search \|\| ""\)\)/);
 assert.match(catalog,/const match = cardSearchKeys\[i\]\.includes\(normalized\)/);
 assert.match(catalog,/if \(card\.hidden !== !match\) card\.hidden = !match/);
 assert.doesNotMatch(catalog,/const match = normalizeTractorQuery\(card\.dataset\.search/);
 assert.match(catalog,/for \(let i = 0; i < cards\.length; i\+\+\)/);
 assert.match(catalog,/if \(match\) visible\+\+/);
 assert.match(catalog,/catalog\.tractors\.map\(\(tractor\)=>/);
});
