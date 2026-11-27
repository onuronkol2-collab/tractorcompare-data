import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { modelSourceIndex, MODEL_SOURCE_COPY, verifiedRecordDate } from "../src/lib/model-source-index.ts";
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

test("source-linked verification dates are calendar-validated and never mistaken for document publication dates",()=>{
 assert.equal(verifiedRecordDate("2026-11-20T10:00:00Z"),"2026-11-20");
 assert.equal(verifiedRecordDate("2026-11-20T13:00:00+03:00"),"2026-11-20");
 for (const raw of ["",null,"garbage","2026-02-30T10:00:00Z","3026-11-20T10:00:00Z","2026-11-20","2026-11-20T25:00:00Z"]) {
  assert.equal(verifiedRecordDate(raw),null,String(raw));
 }
 const first=spec("first",official,"manufacturer_specification");
 const second=spec("second",official,"manufacturer_specification");
 second.verified_at="2026-11-19T08:00:00Z";
 const item=modelSourceIndex(model([first,second])).documents[0];
 assert.equal(item.latestRecordVerification,"2026-11-20");
 const missing=modelSourceIndex(model([spec("missing",official,"manufacturer_specification")]));
 assert.ok(missing.documents[0].latestRecordVerification);
});

test("source verification dates are visibly rendered only when linked and published",()=>{
 const sourceView=readFileSync(new URL("../src/components/ModelSourceIndex.astro",import.meta.url),"utf8");
 assert.match(sourceView,/source\.latestRecordVerification/);
 assert.match(sourceView,/<time datetime=\{source\.latestRecordVerification\}>/);
 assert.match(sourceView,/copy\.recordReviewed/);
 for(const locale of LOCALES)assert.ok(MODEL_SOURCE_COPY[locale].recordReviewed.length>=8);
});


test("model citation points to the real localized catalogue page and preserves identity",async()=>{
 const {modelPageCitation,modelCitationCopy}=await import("../src/lib/model-page-citation.ts");
 const {localizedPath}=await import("../src/lib/locales.ts");
 const row={slug:"mccormick-x5-120",brand_name:"McCormick",model_name:"X5.120",variant:"Exact variant; original source note",market:"Europe",model_year:2025};
 for(const lang of LOCALES){
  const citation=modelPageCitation(row,lang,new URL("https://tractorvs.com/"));
  assert.ok(citation.includes("McCormick X5.120")&&citation.includes("Exact variant")&&citation.includes("2025"));
  assert.ok(citation.endsWith("https://tractorvs.com"+localizedPath(lang,"/tractors/"+row.slug+"/")));
  assert.doesNotMatch(citation,/original source note|undefined/);
  assert.ok(Object.values(modelCitationCopy(lang)).every(v=>v.trim()));
  assert.equal(modelPageCitation({...row,slug:"../other"},lang,new URL("https://tractorvs.com/")),null);
 }
 const view=readFileSync(new URL("../src/components/BrandDiscovery.astro",import.meta.url),"utf8");
 assert.match(view,/modelSourceIndex\(model\).documents.length>0/);
 assert.match(view,/PUBLIC_INDEXING_ENABLED==="true"&&Astro.site/);
 assert.match(view,/readonly aria-label/);
 assert.match(view,/navigator.clipboard.writeText\(field.value\)/);
 assert.doesNotMatch(view,/localStorage|sessionStorage|fetch\(/);
});
