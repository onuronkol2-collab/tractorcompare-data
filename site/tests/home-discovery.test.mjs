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
  assert.match(english,/Tractor Specifications & Comparisons/);
  assert.match(turkish,/Traktör Teknik Verileri ve Karşılaştırma/);
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
