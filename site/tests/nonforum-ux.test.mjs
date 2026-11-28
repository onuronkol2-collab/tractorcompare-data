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
  assert.match(hub,/href="#editorial-query" data-editorial-search-jump/);
  assert.match(hub,/minimumIntegerDigits:2/);
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


test("shared form focus and readable research surfaces keep existing behavior and locale coverage",()=>{
 const styles=file("styles/interaction-accessibility.css");
 const layout=file("styles/research-layout.css");
 const advisor=file("components/FarmAdvisor.astro");
 assert.match(styles,/\.tc-picker-side \.tc-combo-input/);
 assert.match(styles,/\.catalog-toolbar input/);
 assert.match(styles,/\.advisor-budget-input:focus-within/);
 assert.match(styles,/\.cost-page textarea/);
 assert.match(styles,/forced-colors: active/);
 assert.match(styles,/prefers-reduced-motion: reduce/);
 assert.match(layout,/\.tc-result-main small/);
 assert.match(layout,/\.cost-page \.history-scroll/);
 assert.match(layout,/font-variant-numeric: tabular-nums/);
 assert.match(layout,/font-size: max\(16px, 1rem\)/);
 assert.match(advisor,/\.advisor-fact-note\{color:#405948;font-size:13px;line-height:1.6/);
 assert.match(advisor,/\.advisor-result-facts small\{display:block;color:#405948;font-size:14px/);
 assert.match(advisor,/recommendTractors/);
});


test("narrow navigation and forum reading styles retain native controls and visible links",()=>{
 const shared=file("styles/global.css");
 const forum=file("styles/forum-readable.css");
 const shell=file("layouts/SiteLayout.astro");
 assert.match(shared,/@media \(max-width: 420px\)[\s\S]*?\.mobile-menu-search-row\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
 assert.match(shell,/<details class="mobile-nav" data-site-disclosure>/);
 assert.match(shell,/<form class="mobile-menu-search"/);
 assert.match(forum,/\.forum-topic-toc summary\{[^}]*min-height:44px/);
 assert.match(forum,/\.forum-topic-toc li a\{[^}]*text-decoration:underline/);
 assert.match(forum,/overscroll-behavior-inline: contain/);
});


test("catalogue and brand research surfaces preserve real links and readable technical evidence",()=>{
 const style=file("styles/research-layout.css");
 const brand=file("components/BrandDiscovery.astro");
 const source=file("components/ModelSourceIndex.astro");
 const toc=file("styles/model-research-toc.css");
 assert.match(style,/\.catalog-search-feedback button/);
 assert.match(style,/\.catalog-price-filter select/);
 assert.match(style,/min-height: 48px/);
 assert.match(brand,/href=\{modelPrefix\+model\.slug\+"\/"\}/);
 assert.match(brand,/href=\{source\.url\}/);
 assert.match(brand,/\.brand-model-links a\{[^}]*text-decoration:underline/);
 assert.match(source,/href=\{source\.url\}/);
 assert.match(style,/\.model-sources-list a strong \{ font-size:16px/);
 assert.match(style,/\.model-sources-list small \{ font-size:13px/);
 assert.match(toc,/\.model-spec-group\[id\]\{scroll-margin-top:7rem\}/);
 assert.match(toc,/\.model-spec-toc a\{line-height:1\.5\}/);
});


test("technical editorial reading remains reachable with native links and short viewport reflow",()=>{
 const layout=file("styles/research-layout.css");
 const access=file("styles/interaction-accessibility.css");
 const glossary=file("components/TractorGlossary.astro");
 const guide=file("components/TractorSelectionGuide.astro");
 const deep=file("components/TractorTechnicalDeepDive.astro");
 assert.match(layout,/@media \(min-width: 861px\) and \(max-height: 720px\)\s*\{\s*#main \.learn-toc \{ position: static; \}/);
 assert.match(layout,/#main \.glossary-search-box input \{\s*font-size: max\(16px, 1rem\)/);
 assert.match(layout,/#main \.glossary-qa-list summary \{ min-height: 44px/);
 assert.match(layout,/\.glossary-card-header a \{[^}]*min-width: 44px;[^}]*min-height: 44px/);
 assert.match(layout,/\.learn-source-case-table,\.guide-table-scroll/);
 assert.match(access,/\.learn-source-case-table:focus-visible/);
 assert.match(access,/\.learn-next,\.glossary-next,\.guide-next,\.editorial-cta/);
 assert.match(glossary,/id="glossary-search-status" role="status" aria-live="polite"/);
 assert.match(guide,/class="guide-table-scroll" role="region" tabindex="0"/);
 assert.match(deep,/class="learn-source-case-table" role="region" tabindex="0"/);
});


test("comparison presentation retains source-backed rows and native recovery with narrow-screen controls",()=>{
 const css=file("styles/compare-experience.css");
 const compare=file("components/TractorComparison.astro");
 assert.match(css,/#main \.tc-section \.tc-entry a \{[^}]*min-height: 44px/);
 assert.match(css,/@media screen and \(max-width:390px\)/);
 assert.match(css,/max-height: min\(260px, 45dvh\)/);
 assert.match(css,/\.tc-entry \+ \.tc-entry/);
 assert.match(css,/#tc-load-error:not\(\[hidden\]\)/);
 assert.match(css,/#tc-load-error\[hidden\] \{ display: none; \}/);
 assert.match(css,/@media print/);
 assert.match(compare,/<table class="tc-table" role="table">/);
 assert.match(compare,/<th scope="row" role="rowheader">/);
 assert.match(compare,/href=\{spec\.source\}/);
 assert.match(compare,/requiresConditionCaution/);
 assert.match(compare,/requiresTransmissionCaution/);
 assert.match(compare,/id="tc-load-error" role="alert" hidden/);
 assert.match(compare,/id="tc-retry" type="button"/);
 assert.match(compare,/id="tc-share-url" type="url" readonly/);
});
