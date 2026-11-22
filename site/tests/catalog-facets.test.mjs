import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {
  CATALOG_FACET_COPY,normalizedFacetState,matchesCatalogueFacet,
  compareCatalogueRows,VALID_POWER,VALID_YEAR,VALID_SORT,
} from "../src/lib/catalog-facets.mjs";

test("research-only catalogue filters are available and named in every supported locale",()=>{
  assert.deepEqual(Object.keys(CATALOG_FACET_COPY).sort(),[...LOCALES].sort());
  const keys=Object.keys(CATALOG_FACET_COPY.en);
  for(const code of LOCALES){
    const current=CATALOG_FACET_COPY[code];
    assert.deepEqual(Object.keys(current).sort(),[...keys].sort(),code);
    for(const key of keys)assert.ok(typeof current[key]==="string"&&current[key].length>1,code+" "+key);
    assert.doesNotMatch(Object.values(current).join(" "),/Buy now|Checkout|Satın al|Teklif al/i,
      "The directory is a tractor reference library, not a marketplace");
  }
});

test("facet values are strictly bounded to published brands and known choices",()=>{
  const brands=["Başak Traktör","John Deere"];
  const p=new URLSearchParams({
    brand:"Başak Traktör",power:"p51",year:"recent",sort:"powerDesc",unknown:"ignored"
  });
  assert.deepEqual(normalizedFacetState(p,brands),{
    brand:"Başak Traktör",power:"p51",year:"recent",sort:"powerDesc"
  });
  assert.deepEqual(normalizedFacetState(new URLSearchParams({
    brand:"Unpublished",power:"zero",year:"1900",sort:"buy_now"
  }),brands),{brand:"",power:"",year:"",sort:"brand"});
  assert.deepEqual(VALID_POWER,["up50","p51","p101","over150"]);
  assert.deepEqual(VALID_YEAR,["recent","older"]);
  assert.deepEqual(VALID_SORT,["brand","newest","powerAsc","powerDesc"]);
});

test("strict power band boundaries do not invent horsepower or years",()=>{
  const make=(power,year)=>({brand:"TYM",power,year});
  for(const [power,expected] of [[50,"up50"],[50.1,"p51"],[100,"p51"],[100.1,"p101"],[150,"p101"],[150.1,"over150"]]){
    for(const name of VALID_POWER)
      assert.equal(matchesCatalogueFacet(make(power,2026),{power:name}),name===expected,power+" "+name);
  }
  assert.equal(matchesCatalogueFacet(make(null,2026),{power:"up50"}),false);
  assert.equal(matchesCatalogueFacet(make("",2026),{power:"up50"}),false);
  assert.equal(matchesCatalogueFacet(make("unknown",2026),{power:"up50"}),false);
  assert.equal(matchesCatalogueFacet(make(89,null),{year:"recent"}),false);
  assert.equal(matchesCatalogueFacet(make(89,""),{year:"recent"}),false);
  assert.equal(matchesCatalogueFacet(make(89,2019),{year:"older"}),true);
  assert.equal(matchesCatalogueFacet(make(89,2020),{year:"recent"}),true);
  assert.equal(matchesCatalogueFacet(make(89,2020),{brand:"TYM"}),true);
  assert.equal(matchesCatalogueFacet(make(89,2020),{brand:"CLAAS"}),false);
});

test("sort keeps missing technical values behind verified ones without deleting links",()=>{
  const records=[
    {name:"C",power:null,year:null},
    {name:"A",power:115,year:2019},
    {name:"B",power:70,year:2024}
  ];
  const asc=[...records].sort((a,b)=>compareCatalogueRows(a,b,"powerAsc"));
  assert.deepEqual(asc.map(x=>x.name),["B","A","C"]);
  const desc=[...records].sort((a,b)=>compareCatalogueRows(a,b,"powerDesc"));
  assert.deepEqual(desc.map(x=>x.name),["A","B","C"]);
  const newer=[...records].sort((a,b)=>compareCatalogueRows(a,b,"newest"));
  assert.deepEqual(newer.map(x=>x.name),["B","A","C"]);
});

test("catalogue stays a crawlable technical reference, even with a two-column research sidebar",()=>{
  const source=readFileSync(new URL("../src/components/TractorCatalog.astro",import.meta.url),"utf8");
  const compare=readFileSync(new URL("../src/components/TractorComparison.astro",import.meta.url),"utf8");
  const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
  for(const selector of [
    'class="catalog-discovery-layout"','class="catalog-results-panel"',
    'id="catalog-facet-brand"','id="catalog-facet-power"',
    'id="catalog-facet-year"','id="catalog-facet-sort"',
    "matchesCatalogueFacet(rows[i],facetState())",
    'catalog.tractors.map((tractor)=><article',
    'href={detailPrefix+tractor.slug+"/"}',
    '<TractorPhoto tractor={tractor} lang={lang} mode="catalog" sprite />',
  ])assert.ok(source.includes(selector),selector);
  assert.match(source,/history.replaceState\(history.state,"",next.pathname\+next.search\+next.hash\)/);
  assert.match(source,/tractorvs:route-state-changed/);
  assert.match(layout,/const canonicalUrl = indexingEnabled\s*\? new URL\(Astro.url.pathname, Astro.site!\)/);
  assert.match(layout,/href: new URL\(localizedPath\(locale, plainPath\), Astro.site!\)/);
  assert.match(compare,/const initiallySharedOnly=Astro.url.searchParams.get\("view"\)==="shared"/);
  assert.match(compare,/let commonOnly=params.get\("view"\)==="shared"/);
  assert.match(compare,/if\(commonOnly\)url.searchParams.set\("view","shared"\)/);
  assert.match(compare,/else url.searchParams.delete\("view"\)/);
  assert.match(source,/catalog-facet-panel\{position:sticky/);
  assert.doesNotMatch(source,/satın al|buy now|checkout|order tractor|seller listing/ig);
});
