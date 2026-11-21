import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { modelSourceIndex, MODEL_SOURCE_COPY } from "../src/lib/model-source-index.ts";
import { LOCALES } from "../src/lib/locales.ts";
import { pricedCatalogModels } from "../src/lib/catalog-price-payload.ts";
import { MARKET_COUNTRIES, matchingPrice } from "../src/lib/market-prices.ts";

const official = "https://www.mccormick-tractors.com/tractors/x5-120/";
const otherOfficial = "https://www.mccormick-tractors.com/docs/x5-120-brochure.pdf";
const independent = "https://www.tractordata.com/farm-tractors/012/345/12345-mccormick-x5120.html";
function spec(id, url, source_type, publisher = "Source") {
  return {
    spec_id:id, spec_name:"Wheelbase", spec_value:"2355", unit:"mm",
    canonical_key:"wheelbase", comparison_class:"dimensions_weights",
    measurement_standard:"manufacturer data", rated_rpm:null,
    evidence_text:"Explicit X5.120 source table for this configuration",
    verified_at:"2026-11-20T10:00:00Z",
    source_publisher:publisher, source_url:url, source_type,
    source_accessed_at:null, spec_source_priority:100,
  };
}
const model = (specifications) => ({
  brand_name:"McCormick", specifications,
});

test("source index only includes reviewed URLs allowed by the same public evidence gate",()=>{
  const tractor = model([
    spec("a",official,"manufacturer_specification","McCormick"),
    spec("b",official,"manufacturer_specification","McCormick"),
    spec("c",otherOfficial,"manufacturer_specification","McCormick"),
    spec("d",independent,"technical_database","TractorData"),
    spec("e","https://unrelated-example.invalid/model","manufacturer_specification","Invalid"),
    { ...spec("f",official,"manufacturer_specification"),evidence_text:null },
    { ...spec("g",official,"manufacturer_specification"),verified_at:null },
  ]);
  const actual=modelSourceIndex(tractor);
  assert.equal(actual.totalDocuments,3);
  assert.equal(actual.manufacturerDocuments,2);
  assert.equal(actual.independentDocuments,1);
  assert.equal(actual.linkedSpecifications,4);
  assert.equal(actual.documents[0].url,official);
  assert.equal(actual.documents[0].specificationCount,2);
  assert.equal(actual.documents[0].kind,"manufacturer");
  assert.equal(actual.documents[2].kind,"independent");
  assert.ok(actual.documents.every(item=>item.url.startsWith("https://")));
});

test("source index remains deterministic, bounded and never adds invented sources",()=>{
  const tractor=model([
    spec("a",official,"manufacturer_specification"),
    spec("b",otherOfficial,"manufacturer_specification"),
    spec("c",independent,"technical_database"),
  ]);
  const limited=modelSourceIndex(tractor,2);
  assert.equal(limited.documents.length,2);
  assert.equal(limited.remainingDocuments,1);
  assert.equal(limited.totalDocuments,3);
  assert.deepEqual(limited,modelSourceIndex(tractor,2));
  assert.equal(modelSourceIndex(model([])).totalDocuments,0);
});

test("all ten languages contain informative non-identical source labels and explicit caveats",()=>{
  assert.deepEqual(Object.keys(MODEL_SOURCE_COPY).sort(),[...LOCALES].sort());
  const tr=MODEL_SOURCE_COPY.tr;
  const en=MODEL_SOURCE_COPY.en;
  assert.notEqual(tr.title,en.title);
  for(const locale of LOCALES){
    const c=MODEL_SOURCE_COPY[locale];
    for(const [key,value] of Object.entries(c)){
      // Short native-language labels can be only a few characters
      // (e.g. Japanese and Chinese); do not pad translations for tests.
      assert.ok(value.trim().length>=2,locale+" missing "+key);
    }
    assert.notEqual(c.official,c.independent);
    assert.ok(c.introduction.length>25,locale+" needs clear source context");
    assert.ok(c.caution.length>25,locale+" needs variant and measurement caveat");
  }
  const source=readFileSync(new URL("../src/components/ModelSourceIndex.astro",import.meta.url),"utf8");
  const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
  assert.match(source,/modelSourceIndex\(tractor\)/);
  assert.match(detail,/<ModelSourceIndex tractor=\{tractor\} lang=\{lang\}/);
  assert.doesNotMatch(source,/Product|AggregateRating|Offer/);
});

test("catalogue client payload includes only tractors with real curated market prices",()=>{
  const tractors=[
    {tractor_id:"price",brand_name:"New Holland",model_name:"T5.110",variant:"Bluemaster MasterDrive",market:"Turkey",model_year:2026},
    {tractor_id:"otherVariant",brand_name:"New Holland",model_name:"T5.110",variant:"Unknown transmission",market:"Turkey",model_year:2026},
    {tractor_id:"otherModel",brand_name:"New Holland",model_name:"T6.180",variant:"Standard",market:"Turkey",model_year:2026},
  ];
  const filtered=pricedCatalogModels(tractors);
  assert.deepEqual(filtered.map(x=>x.tractor_id),["price"]);
  assert.ok(MARKET_COUNTRIES.some(country=>matchingPrice(filtered[0],country)));
  assert.ok(MARKET_COUNTRIES.every(country=>!matchingPrice(tractors[1],country)));
  const component=readFileSync(new URL("../src/components/TractorCatalog.astro",import.meta.url),"utf8");
  assert.match(component,/models:\s*pricedCatalogModels\(catalog\.tractors\)/);
  assert.match(component,/catalog\.tractors\.map\(\(tractor\)=>/); // crawlable SSR card links are retained
  assert.match(component,/data-price-for=\{tractor\.tractor_id\}/);
});
