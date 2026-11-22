import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {EDITORIAL_DISCOVERY} from "../src/lib/editorial-discovery-i18n.mjs";

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
  assert.match(home,/<TractorPhoto tractor=\{tractor\} lang=\{lang\} mode="catalog"\s*\/>/);
  assert.match(home,/<a class="home-featured-main" href=\{detailBase \+ tractor.slug \+ "\/"\}>/);
  assert.doesNotMatch(home,/<a class="home-featured-card"/);
  assert.match(photos,/href=\{photo.sourcePage\}/);
  assert.match(photos,/href=\{photo.licenseUrl\}/);
  assert.match(photos,/!photo.configurationExact/);
  assert.match(css,/\.home-featured-main:focus-visible/);
  assert.match(css,/\.home-featured-card \.tractor-photo-gallery img/);
});

test("model technical navigation is generated only from real published groups",()=>{
  const detail=file("components/TractorDetail.astro");
  assert.match(detail,/groups\.length>1&&<nav class="model-spec-toc"/);
  assert.match(detail,/groups\.map\(\(group,index\)=><a href=\{"#model-spec-group-"\+\(index\+1\)\}>\{group.label\}<\/a>\)/);
  assert.match(detail,/groups\.map\(\(group,index\)=>/);
  assert.match(detail,/id=\{"model-spec-group-"\+\(index\+1\)\}/);
  assert.match(detail,/scroll-margin-top:7rem/);
  assert.match(detail,/focus-visible/);
  assert.match(detail,/<ModelSourceIndex tractor=/);
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
  assert.match(hub,/import \{EDITORIAL_DISCOVERY\}/);
  assert.match(hub,/id="editorial-discovery" hidden/);
  assert.match(hub,/id="editorial-query" type="search"/);
  assert.match(hub,/\[data-editorial-card\]/);
  assert.match(hub,/row.hidden=!match/);
  assert.match(hub,/aria-live="polite"/);
  assert.match(hub,/id="editorial-no-results" role="status" hidden/);
  assert.match(hub,/entries\.filter\(x=>x.type==="guide"\)/);
  assert.match(hub,/entries\.filter\(x=>x.type==="review"\)/);
  assert.doesNotMatch(hub,/window\.history|history\.pushState|history\.replaceState/);
});
