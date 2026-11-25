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

test("asynchronous comparison loading is announced without stale rows or stuck busy state",()=>{
  assert.match(compare, /id="tc-summary" role="status" aria-live="polite"/);
  assert.match(compare, /<tbody id="tc-rows" role="rowgroup" aria-busy="false">/);
  assert.match(compare, /loading: cx\(lang,"loading"\)/);
  assert.match(compare, /loading:string/);
  assert.match(compare, /if \(!left\.specs \|\| !right\.specs\) \{/);
  assert.match(compare, /tbody\.setAttribute\("aria-busy","true"\)/);
  assert.match(compare, /if \(summary\) summary\.textContent = l10n\.loading/);
  assert.match(compare, /if \(current === revision\) \{\s*tbody\.setAttribute\("aria-busy","false"\)/);
  assert.match(compare, /if \(current !== revision\) return/);
  assert.match(compare, /tbody\.replaceChildren\(fragment\);\s*tbody\.setAttribute\("aria-busy","false"\)/);
  for(const locale of LOCALES){
    // CJK scripts convey the same status in fewer characters than Latin scripts.
    assert.ok(Array.from(compareText(locale,"loading").trim()).length>=8,locale+" loading status");
  }
  assert.notEqual(compareText("en","loading"),compareText("tr","loading"));
});

test("every published model detail has a comparison CTA using stable tractor id",()=>{
  assert.match(detail,/const compareUrl = localizedPath\(lang,"\/compare\/"\) \+ "\?left=" \+ encodeURIComponent\(tractor.tractor_id\)/);
  assert.match(detail,/class="model-compare-action" href=\{compareUrl\}/);
  assert.match(detail,/cx\(lang,"cta"\)/);
  assert.match(detail,/class="model-bottom-actions"/);
  assert.match(detail,/manufacturerDiscrepancies/);
});
test("responsive comparison offers side-by-side mobile values, readable controls and keyboard focus",()=>{
  assert.match(css,/\.tc-section \.tc-picker/);
  assert.match(css,/\.tc-combo-input:focus-visible/);
  assert.match(css,/\.tc-picker-results\[hidden\] \{ display: none; \}/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(compare,/class="tc-cell-model"/);
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

import {differentPublishedEntries} from "../src/lib/compare-display.mjs";
import {nextComboboxOption} from "../src/lib/combobox-navigation.mjs";
test("different entries never interpret missing values as differences or normalize measurements",()=>{
  const a={value:"100",unit:"hp",context:"rated",rpm:2200,notice:null,source:"https://example.com/a"};
  assert.equal(differentPublishedEntries([a],[]),false);
  assert.equal(differentPublishedEntries([],[a]),false);
  assert.equal(differentPublishedEntries([a],[{...a,source:"https://example.com/b"}]),false);
  for(const patch of [{value:"101"},{unit:"kW"},{context:"peak"},{rpm:2100},{notice:"Different conditions"}]){
    assert.equal(differentPublishedEntries([a],[{...a,...patch}]),true);
  }
  const b={...a,value:"80"};
  assert.equal(differentPublishedEntries([a,b],[b,a]),false);
  assert.equal(differentPublishedEntries([a],[a,b]),true);
  assert.match(compare,/differentOnly\?different:commonOnly\?shared:keys/);
  assert.match(compare,/id="tc-different"/);
  assert.match(compare,/url\.searchParams\.set\("view","different"\)/);
});
test("combobox keyboard selects the first or last option from no selection",()=>{
  assert.equal(nextComboboxOption(-1,8,1),0);
  assert.equal(nextComboboxOption(-1,8,-1),7);
  assert.equal(nextComboboxOption(0,8,-1),7);
  assert.equal(nextComboboxOption(7,8,1),0);
  assert.equal(nextComboboxOption(-1,0,1),-1);
  assert.match(compare,/button\.tabIndex=-1/);
  assert.match(compare,/event\.isComposing/);
  assert.match(compare,/event\.key==="Tab"/);
});

test("home and comparison use the same accessible combobox keyboard rules",()=>{
  const home=read("components/HomeExperience.astro");
  assert.match(home,/nextComboboxOption\(selectedIndex,links.length/);
  assert.match(compare,/nextComboboxOption\(active,buttons.length/);
  assert.match(home,/option\.tabIndex = -1/);
  assert.match(home,/event\.isComposing/);
  assert.match(home,/event\.key === "Tab"/);
});
