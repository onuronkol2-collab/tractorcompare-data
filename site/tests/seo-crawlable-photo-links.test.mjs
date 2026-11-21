import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=path=>readFileSync(new URL("../src/components/"+path,import.meta.url),"utf8");
const lightbox=file("PhotoLightbox.astro");
const compare=file("TractorComparison.astro");

test("shared full-screen photo modal has no href-less source anchors in static indexable HTML",()=>{
 assert.match(lightbox,/<span id="tractor-photo-dialog-credit"><\/span>/);
 assert.match(lightbox,/<span id="tractor-photo-dialog-license"><\/span>/);
 assert.doesNotMatch(lightbox,/<a id="tractor-photo-dialog-(?:credit|license)"/);
 assert.match(lightbox,/const sourceAnchor=\(destination:HTMLSpanElement,url:string,label:string\)=>/);
 assert.match(lightbox,/a\.href=url;/);
 assert.match(lightbox,/destination\.replaceChildren\(a\)/);
 assert.match(lightbox,/if\(!src\|\|!source\|\|!rights\)return;/);
 assert.match(lightbox,/sourceAnchor\(credit,source/);
 assert.match(lightbox,/sourceAnchor\(license,rights/);
 assert.match(lightbox,/a\.rel="noopener noreferrer";/);
});

test("comparison credits have real hrefs and keep model-specific source URLs when available",()=>{
 for(const side of ["Left","Right"]){
  assert.ok(compare.includes('href={initial'+side+'?.photo?.sourcePage || localizedPath(lang,"/tractors/")}'));
  assert.ok(compare.includes("photoCredit.href=photo.sourcePage;"));
  assert.ok(compare.includes('alt={initial'+side+'?.photo?.alt || photoText(lang,"pending")}'),
    "No-photo preview needs an honest localized alt fallback");
 }
 assert.match(compare,/id="tc-left-photo" hidden=\{!initialLeft\?\.photo\}/);
 assert.match(compare,/id="tc-right-photo" hidden=\{!initialRight\?\.photo\}/);
});


test("documented 4.37:1 review kicker contrast is improved without hiding source text",()=>{
 const review=file("Basak2075Review.astro");
 assert.match(review,/class="review-overline"/);
 assert.match(review,/\.review-overline\{font-weight:850;color:#315f3d;/);
 assert.doesNotMatch(review,/\.review-overline\{font-weight:850;color:#438253;/);
});
