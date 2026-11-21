import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {CATALOG_FILTER_COPY} from "../src/lib/catalog-brand-index.mjs";
const catalog=readFileSync(new URL("../src/components/TractorCatalog.astro",import.meta.url),"utf8");

test("ten complete published-only catalogue feedback translations",()=>{
 assert.deepEqual(Object.keys(CATALOG_FILTER_COPY),[...LOCALES]);
 for(const lang of LOCALES){
  const {shown,clear}=CATALOG_FILTER_COPY[lang];
  assert.ok(shown.includes("{visible}") && shown.includes("{total}"),lang+" placeholders");
  assert.ok(clear.trim().length>3,lang+" clear");
  const rendered=shown.replace("{visible}","5").replace("{total}","379");
  assert.match(rendered,/5/);
  assert.match(rendered,/379/);
 }
});

test("published model links remain server-rendered and the accessible search count is factual",()=>{
 assert.match(catalog,/catalog\.tractors\.map\(\(tractor\)=>/);
 assert.match(catalog,/href=\{detailPrefix\+tractor\.slug\+"\/"\}/);
 assert.match(catalog,/id="tractor-search" type="search"/);
 assert.match(catalog,/aria-controls="tractor-card-grid"/);
 assert.match(catalog,/id="catalog-visible-count" role="status" aria-live="polite"/);
 assert.match(catalog,/data-count-template=\{filterCopy\.shown\}/);
 assert.match(catalog,/String\(catalog\.tractors\.length\)/);
 assert.match(catalog,/id="catalog-search-clear" type="button" hidden/);
 assert.match(catalog,/if \(clearSearch\) clearSearch\.hidden = !normalized/);
 assert.match(catalog,/filterCatalog\(""\)/);
 assert.match(catalog,/clearQueryFromURL\(\)/);
 assert.doesNotMatch(catalog,/const modelCount = [0-9]+|fakeResults|AI-generated result count/i);
});

test("search remains same-page client filtering; URLs only drop q on deliberate clear",()=>{
 assert.match(catalog,/normalizeTractorQuery\(query\)/);
 assert.match(catalog,/card\.hidden = !match/);
 assert.match(catalog,/next\.searchParams\.delete\("q"\)/);
 assert.match(catalog,/history\.replaceState\(history\.state/);
 assert.match(catalog,/new URLSearchParams\(window\.location\.search\)\.get\("q"\)/);
 assert.match(catalog,/if \(noResults\) noResults\.hidden = visible > 0/);
 assert.match(catalog,/search\.focus\(\)/);
 assert.match(catalog,/button\[hidden\] \{display:none\}/);
});
