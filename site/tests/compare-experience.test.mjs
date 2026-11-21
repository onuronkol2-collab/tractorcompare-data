import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {COMPARE_UX,compareText} from "../src/lib/compare-ux.ts";
import {advisorTranslationIssues} from "../src/lib/advisor-i18n.ts";
import {UI,assertCompleteTranslations} from "../src/lib/ui.ts";
import {HOME} from "../src/lib/home-ui.ts";
import {HOME_DISCOVERY} from "../src/lib/home-discovery-ui.ts";
const read=p=>readFileSync(new URL("../src/"+p,import.meta.url),"utf8");
const compare=read("components/TractorComparison.astro");
const detail=read("components/TractorDetail.astro");
const css=read("styles/compare-experience.css");
const catalog=read("lib/catalog.ts");
test("core visitor interface translation dictionaries cover all ten languages",()=>{
  assert.equal(LOCALES.length,10);
  assert.doesNotThrow(assertCompleteTranslations);
  assert.deepEqual(advisorTranslationIssues(),[]);
  for(const dictionary of [COMPARE_UX,UI,HOME,HOME_DISCOVERY]){
    for(const [key,translations] of Object.entries(dictionary)){
      assert.equal(translations.length,10,key+" locale count");
      assert.ok(translations.every(x=>typeof x==="string"&&x.trim().length>0),key+" empty translation");
    }
  }
  for(const locale of LOCALES)for(const key of Object.keys(COMPARE_UX)){
    assert.ok(compareText(locale,key).trim(),locale+" "+key);
  }
  assert.notEqual(compareText("en","cta"),compareText("tr","cta"));
});
test("comparison UI preserves sourced spec identities and deep-linked model selection",()=>{
  assert.match(compare,/getPublicCatalog\(\)/);
  assert.match(read("lib/comparison-specs.ts"),/comparisonKey\(spec\)/);
  assert.match(read("lib/comparison-specs.ts"),/specLabel\(spec, lang\)/);
  assert.match(read("lib/comparison-specs.ts"),/officialManufacturerSourceUrl\(spec, tractor.brand_name\)/);
  assert.match(compare,/new URLSearchParams\(window.location.search\)/);
  assert.match(compare,/params.get\("left"\)/);
  assert.match(compare,/params.get\("right"\)/);
  assert.match(compare,/role="combobox"/);
  assert.match(compare,/role="listbox"/);
  assert.match(compare,/id="tc-swap"/);
  assert.match(compare,/id="tc-shared"/);
  assert.match(compare,/id="tc-all"/);
  assert.match(compare,/commonOnly\?shared:keys/);
  assert.match(compare,/tbody.replaceChildren\(fragment\)/);
  assert.match(compare,/event.key==="ArrowDown"/);
  assert.match(compare,/event.key==="Escape"/);
  assert.match(compare,/window.history.replaceState/);
  assert.match(compare,/tractor.variant\?\.split\(";"\)/);
});
test("every published model detail has a comparison CTA using stable tractor id",()=>{
  assert.match(detail,/const compareUrl = localizedPath\(lang,"\/compare\/"\) \+ "\?left=" \+ encodeURIComponent\(tractor.tractor_id\)/);
  assert.match(detail,/class="model-compare-action" href=\{compareUrl\}/);
  assert.match(detail,/cx\(lang,"cta"\)/);
  assert.match(detail,/class="model-bottom-actions"/);
  assert.match(detail,/manufacturerDiscrepancies/);
});
test("responsive comparison offers mobile scrolling, readable controls and keyboard focus",()=>{
  assert.match(css,/\.tc-section \.tc-picker/);
  assert.match(css,/\.tc-combo-input:focus-visible/);
  assert.match(css,/\.tc-picker-results\[hidden\] \{ display: none; \}/);
  assert.match(css,/\.tc-section \.tc-table tbody th \{ position: sticky; left: 0/);
  assert.match(css,/@media\(max-width:690px\)/);
});

import {localizedCountryName} from "../src/lib/country-display.ts";
import {marketDisplayName} from "../src/lib/market-display.ts";
test("market and country labels are localized; underlying model identity is never changed",()=>{
  assert.equal(marketDisplayName("global","tr"),"Dünya geneli");
  assert.equal(marketDisplayName("Europe","tr"),"Avrupa");
  assert.equal(marketDisplayName("Europe","de"),"Europa");
  assert.equal(marketDisplayName("Unknown market","tr"),"Unknown market");
  assert.equal(localizedCountryName("TR","tr"),"Türkiye");
  assert.equal(localizedCountryName("US","tr"),"Amerika Birleşik Devletleri");
  assert.equal(localizedCountryName("DE","de"),"Deutschland");
  assert.notEqual(localizedCountryName("FR","fr"),localizedCountryName("FR","tr"));
});
