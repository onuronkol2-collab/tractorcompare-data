import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {EDITORIAL_DISCOVERY,EDITORIAL_READING_LANGUAGE} from "../src/lib/editorial-discovery-i18n.mjs";

const file=name=>readFileSync(new URL("../src/"+name,import.meta.url),"utf8");

test("published article library search is available across ten locales, not e-commerce",()=>{
  assert.deepEqual(Object.keys(EDITORIAL_DISCOVERY).sort(),[...LOCALES].sort());
  for(const locale of LOCALES){
    assert.deepEqual(Object.keys(EDITORIAL_DISCOVERY[locale]).sort(),
      ["clear","heading","none","placeholder","results"],locale);
    for(const [key,text] of Object.entries(EDITORIAL_DISCOVERY[locale]))
      assert.ok(text.trim().length>1,locale+" "+key);
    assert.ok(EDITORIAL_DISCOVERY[locale].results.includes("{visible}"));
    assert.ok(EDITORIAL_DISCOVERY[locale].results.includes("{total}"));
  }
});

test("homepage uses reviewed, licensed photography with valid link semantics",()=>{
  const home=file("components/HomeExperience.astro");
  const photos=file("components/TractorPhoto.astro");
  const css=file("styles/home-experience.css");
  assert.match(home,/import TractorPhoto from "\.\/TractorPhoto\.astro"/);
  assert.match(home,/<article class="home-featured-card">/);
  assert.match(home,/<TractorPhoto tractor=\{tractor\} lang=\{lang\} mode="catalog" slotSizes="[^"]+"\s*\/>/);
  assert.match(home,/<a class="home-featured-main" href=\{detailBase \+ tractor.slug \+ "\/"\}>/);
  assert.doesNotMatch(home,/<a class="home-featured-card"/);
  assert.match(photos,/href=\{photo.sourcePage\}/);
  assert.match(photos,/href=\{photo.licenseUrl\}/);
  assert.match(photos,/!photo.configurationExact/);
  assert.match(css,/\.home-featured-main:focus-visible/);
  assert.match(css,/\.home-featured-card \.tractor-photo-gallery img/);
});

test("technical shortcuts are progressive enhancement; SSR manufacturer specification HTML stays unchanged",()=>{
  const detail=file("components/TractorDetail.astro");
  const stylesheet=file("styles/model-research-toc.css");
  assert.match(detail,/import "\.\.\/styles\/model-research-toc\.css"/);
  assert.match(detail,/const sections=\[\.\.\.document\.querySelectorAll<HTMLElement>\("\.model-spec-section \.model-spec-group"\)\]/);
  assert.match(detail,/const id="model-spec-group-"\+\(index\+1\)/);
  assert.match(detail,/container\.insertBefore\(nav,list\)/);
  assert.match(detail,/link\.textContent=heading/);
  assert.doesNotMatch(detail,/groups\.length>1&&<nav class="model-spec-toc"/,
    "No bulk SSR model-body modification merely to add a navigation shortcut");
  assert.match(detail,/groups\.length>0\?<div class="model-spec-groups">\{groups\.map\(\(group\)=>/);
  assert.match(detail,/<section class="model-spec-group"><h3>\{group\.label\}<\/h3>/);
  assert.match(detail,/<ModelSourceIndex tractor=/);
  assert.match(stylesheet,/\.model-spec-toc a:focus-visible/);
  assert.match(stylesheet,/\.model-spec-group\[id\]\{scroll-margin-top:7rem\}/);
});

test("farm advisor keeps its existing evidence rules and gains three accessible step links",()=>{
  const advisor=file("components/FarmAdvisor.astro");
  assert.match(advisor,/class="advisor-step-jumps" aria-label=\{heading\}/);
  for(const id of ["advisor-land-title","advisor-equipment-title","advisor-more-title"])
    assert.ok(advisor.includes('href="#'+id+'"'),id);
  assert.match(advisor,/id="advisor-more-title">\{tx\(lang,"stepDetails"\)\}/);
  assert.match(advisor,/aria-live="polite"/);
  assert.match(advisor,/recommendTractors/);
  assert.match(advisor,/\.advisor-step-jumps a:focus-visible/);
});

test("editorial search only hides SSR-published cards, without creating new indexable pages",()=>{
  const hub=file("components/EditorialHub.astro");
  assert.match(hub,/import \{EDITORIAL_DISCOVERY,EDITORIAL_READING_LANGUAGE\}/);
  assert.match(hub,/id="editorial-discovery" hidden/);
  assert.match(hub,/id="editorial-query" type="search"/);
  assert.match(hub,/\[data-editorial-card\]/);
  assert.match(hub,/row.hidden=!match/);
  assert.match(hub,/aria-live="polite"/);
  assert.match(hub,/id="editorial-no-results" hidden/);
  assert.match(hub,/id="editorial-reset"/);
  assert.match(hub,/id="editorial-results-count" role="status" aria-live="polite"/);
  assert.match(hub,/entries\.filter\(x=>x.type==="guide"\)/);
  assert.match(hub,/entries\.filter\(x=>x.type==="review"\)/);
  assert.doesNotMatch(hub,/window\.history|history\.pushState|history\.replaceState/);
});

test("reading-language labels are complete and coverage placeholders are intact",()=>{
 assert.deepEqual(Object.keys(EDITORIAL_READING_LANGUAGE).sort(),[...LOCALES].sort());
 for(const lang of LOCALES){
  const labels=EDITORIAL_READING_LANGUAGE[lang];
  assert.deepEqual(Object.keys(labels).sort(),["all","coverage","language","local","other","reset","sections"]);
  for(const label of Object.values(labels))assert.ok(label.trim().length>1);
  assert.ok(labels.coverage.includes("{local}")&&labels.coverage.includes("{total}"));
 }
});
