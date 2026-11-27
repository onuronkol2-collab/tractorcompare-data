import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LOCALES } from "../src/lib/locales.ts";
import { HOME_DISCOVERY, homeDiscoveryText } from "../src/lib/home-discovery-ui.ts";

const read=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const home=read("components/HomeExperience.astro");
const catalog=read("components/TractorCatalog.astro");
const css=read("styles/home-experience.css");
const global=read("styles/global.css");
const english=read("pages/index.astro");
const turkish=read("pages/tr/index.astro");
const other=read("components/HomeLocalized.astro");

test("every new UX label has 10 deliberate translations",()=>{
  assert.equal(LOCALES.length,10);
  for (const [key,translations] of Object.entries(HOME_DISCOVERY)){
    assert.equal(translations.length,LOCALES.length,key+" count");
    for(const [index,text] of translations.entries()){
      assert.ok(typeof text==="string"&&text.trim().length>2,key+" language "+LOCALES[index]);
      assert.equal(homeDiscoveryText(LOCALES[index],key),text);
    }
  }
});
test("all 10 homepages share one task-first design and retain SEO descriptions",()=>{
  for(const file of [english,turkish,other])assert.match(file,/<HomeExperience/);
  assert.match(english,/Tractor Specifications & Model Comparisons/);
  assert.match(turkish,/Traktör Karşılaştırma ve Teknik Özellikler/);
  assert.match(other,/seoDesc/);
  for(const section of ['id="platform"','id="data"','id="approach"']){
    assert.ok(home.includes(section),section);
  }
  assert.match(home,/<h1 id="home-heading">/);
  assert.match(home,/<form class="home-find" action=\{catalogUrl\} method="get" role="search">/);
  assert.match(home,/name="q" type="search"/);
  assert.match(home,/href=\{compareUrl\}/);
  assert.match(home,/href=\{advisorUrl\}/);
  assert.match(home,/href=\{detailBase \+ tractor.slug \+ "\/"\}/);
  assert.match(home,/getPublicCatalog\(\)/);
  assert.doesNotMatch(home,/Math\.random|fake|hardcodedCount|aggregateRating|offers:/i);
});
test("homepage links only to source-backed, published EN/TR brand guides",()=>{
  assert.match(home,/import \{listedBrandCollections\} from "\.\.\/lib\/brand-discovery-pilot\.mjs"/);
  assert.match(home,/const publishedBrandGuides=\(lang==="en"\|\|lang==="tr"\)/);
  assert.match(home,/listedBrandCollections\(catalogue\.tractors\)/);
  assert.match(home,/<nav class="home-brand-row home-brand-guides"/);
  assert.match(home,/href=\{localizedPath\(lang,"\/brands\/"\+brand\.slug\+"\/"\)\}/);
  assert.match(home,/publishedBrandGuides\.length > 0/);
});

test("homepage model/brand searches are actually used to filter catalogue",()=>{
  assert.match(home,/encodeURIComponent\(brand\)/);
  assert.match(catalog,/new URLSearchParams\(window.location.search\).get\("q"\)/);
  assert.match(catalog,/filterCatalog\(requested\)/);
  assert.match(catalog,/card\.hidden = !match/);
  assert.match(catalog,/id="catalog-no-results" role="status"/);
});
test("search, mobile cards and keyboard interaction have responsive styles",()=>{
  assert.match(css,/\.home-search-row \{ position: relative;/);
  assert.match(css,/@media \(max-width:620px\)/);
  assert.match(css,/@media \(max-width:800px\)/);
  assert.match(css,/\.home-search-row button:focus-visible/);
  assert.match(css,/\.home-action-card:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(global,/@media\(max-width:1150px\)/);
  assert.match(global,/\.catalog-toolbar input \{ min-height: 50px; font-size: 16px;/);
});

test("homepage autocomplete appears beneath search and supports keyboard",()=>{
  assert.match(home,/role="combobox" aria-autocomplete="list" aria-expanded="false"/);
  assert.match(home,/id="home-search-results" role="listbox"/);
  assert.match(home,/role="status" aria-live="polite"/);
  assert.match(home,/suggestionPayload/);
  assert.match(home,/findTractorSuggestions\(models,query,6\)/);
  assert.match(home,/option.href = model.url/);
  assert.match(home,/event.key === "ArrowDown"/);
  assert.match(home,/event.key === "ArrowUp"/);
  assert.match(home,/event.key === "Escape"/);
  assert.match(home,/event.key === "Enter"/);
  assert.match(css,/\.home-search-results\[hidden\] \{ display: none; \}/);
  assert.match(css,/\.home-search-option:focus-visible/);
});


test("home hero editorial links directly to the two published glossary locales",()=>{
  assert.match(home,/const glossaryUrl = \(lang==="tr" \|\| lang==="en"\)/);
  assert.match(home,/href=\{glossaryUrl\}/);
  assert.match(home,/class="home-editorial-resource"/);
  assert.match(home,/lang==="tr"\?"Traktör teknik terimleri ve parçaları":"Tractor technical terms and parts"/);
  assert.match(css,/\.home-editorial-resource \.home-outline-link:focus-visible/);
});


test("homepage search preserves IME entry, touch scrolling and meaningful option identity",()=>{
 assert.match(home,/compositionstart/);
 assert.match(home,/compositionend/);
 assert.match(home,/event instanceof InputEvent && event.isComposing/);
 assert.match(home,/if \(composing \|\| event.isComposing/);
 assert.match(home,/event.pointerType === "mouse" && selectedIndex !== index\) select\(index,false\)/);
 assert.match(home,/if \(reveal\) chosen.scrollIntoView/);
 assert.match(home,/aria-describedby="home-search-hint"/);
 assert.match(home,/id="home-search-empty" aria-hidden="true" hidden/);
 assert.match(home,/close\(\);\s*emptyMessage.hidden = false;\s*status.textContent = labels.noResults/);
 assert.doesNotMatch(home,/popup.appendChild\(empty\)/);
 assert.doesNotMatch(css,/-webkit-line-clamp: 2/);
 assert.match(css,/\.home-search-empty-inline\[hidden\] \{ display: none; \}/);
 assert.match(css,/48dvh/);
});


test("homepage prioritizes four real research tasks directly inside the hero",()=>{
 const panel=home.slice(home.indexOf('<section class="home-task-panel"'),home.indexOf('{spotlight ? ('));
 assert.match(panel,/aria-labelledby="home-choices-title"/);
 assert.equal((panel.match(/<a class="home-action-card/g)||[]).length,4);
 assert.match(panel,/href=\{catalogUrl\}/);
 assert.match(panel,/href=\{compareUrl\}/);
 assert.match(panel,/href=\{advisorUrl\}/);
 assert.match(panel,/href=\{localizedPath\(lang,"\/guides\/farm-cost-calculator\/"\)\}/);
 assert.doesNotMatch(home,/class="home-tractor-art"|<section class="home-choices"/);
 assert.ok(home.indexOf('class="home-find"')<home.indexOf('class="home-task-panel"'));
 assert.ok(home.indexOf('class="home-task-panel"')<home.indexOf('class="home-models"'));
 assert.match(home,/\{count\}/);
 assert.match(home,/\{brandCounts.size\}/);
 assert.match(home,/<TractorPhoto tractor=\{tractor\}/);
 assert.equal(HOME_DISCOVERY.costCardBody.length,10);
 assert.match(css,/\.home-task-panel \.home-action-grid/);
 assert.match(css,/grid-template-columns: auto minmax\(0,1fr\) auto/);
});
