import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {reviewedIndependentSourceUrl,officialManufacturerSourceUrl,specificationEvidenceLevel} from "../src/lib/catalog.ts";
import {INDEPENDENT_SOURCE_COPY} from "../src/lib/independent-source-i18n.ts";
import {modelSeoMetadata,modelStructuredData} from "../src/lib/model-seo.ts";

const ref={
 source_url:"https://www.tractordata.com/farm-tractors/008/2/3/8231-ls-j27-engine.html",
 source_type:"web_page",
 evidence_text:"TractorData, LS J27 Mitsubishi S3L2 3-cylinder engine technical details.",
 verified_at:"2026-11-19T18:00:00Z"
};
const dl={
 source_url:"https://pruefberichte.dlg.org/filestorage/CASE-IH_JX_90_U-Nr2078-2003-englisch.pdf",
 source_type:"independent_test",
 evidence_text:"DLG independent JX 90 test: measured results and protocol",
 verified_at:"2026-11-19T18:00:00Z"
};
test("independent source URL is explicitly attributed, not manufacturer-labelled",()=>{
 assert.equal(specificationEvidenceLevel(ref),"third_party_reported");
 assert.equal(reviewedIndependentSourceUrl(ref),ref.source_url);
 assert.equal(officialManufacturerSourceUrl(ref,"LS Tractor"),null);
 assert.equal(reviewedIndependentSourceUrl(dl),dl.source_url);
 for(const source_url of [
  "https://www.tractordata.com.bad.example/farm-tractors/008/a.html",
  "https://www.tractordata.com@bad.example/farm-tractors/008/a.html",
  "http://www.tractordata.com/farm-tractors/008/a.html",
  "javascript:alert(1)",
  "https://www.tractordata.com/",
  "https://pruefberichte.dlg.org.fraud.example/filestorage/data.pdf",
  "https://pruefberichte.dlg.org/filestorage/report.exe",
  "https://www.tractordata.com/farm-tractors/fake.htm",
 ])assert.equal(reviewedIndependentSourceUrl({...ref,source_url}),null,source_url);
 for(const invalid of [
  {...ref,evidence_text:""},
  {...ref,verified_at:null},
  {...ref,source_type:"manufacturer_specification"},
  {...ref,source_type:"dealer_listing"},
  {...ref,source_url:"https://www.tractordata.com@bad.example/farm-tractors/008/a.html"},
 ])assert.equal(reviewedIndependentSourceUrl(invalid),null);
});
test("verified manufacturer host permissions do not authorize lookalike unrelated origins",()=>{
 for(const [brand,url] of [
  ["Yanmar","https://www.yanmar.com/tr/agri/products/tractor/sa222r/"],
  ["Swaraj","https://www.swarajtractors.com/swaraj-717-tractor"],
  ["Kioti","https://www.kioti.com/products/tractors/cx/cx2510"],
  ["Kioti","https://www.kioti-uk.com/wp-content/uploads/2025/01/brochure.pdf"]
 ])assert.equal(officialManufacturerSourceUrl({...ref,source_url:url,source_type:"manufacturer_specification"},brand),url);
 assert.equal(officialManufacturerSourceUrl({...ref,source_type:"manufacturer_specification",source_url:"https://kioti-uk.com.evil.example/brochure.pdf"},"Kioti"),null);
});
test("all ten locales distinguish independent evidence from manufacturer confirmation",()=>{
 const model={tractor_id:"ls-j27",brand_name:"LS Tractor",model_name:"J27",variant:"GEAR",market:"global",model_year:null,horsepower:27,
 brand_country:"South Korea",brand_website_url:"https://www.lstractor.com/",slug:"ls-tractor-j27-fixture",
 engine:null,transmission:null,drivetrain:null,weight_kg:null,
 specifications:[{...ref,spec_id:"j27-engine",spec_name:"Engine model",spec_value:"Mitsubishi S3L2",unit:null,canonical_key:"engine_model",
 comparison_class:"engine",measurement_standard:null,rated_rpm:null,source_publisher:"TractorData",source_accessed_at:"2026-11-19T18:00:00Z",spec_source_priority:60}]};
 for(const lang of LOCALES){
  const copy=INDEPENDENT_SOURCE_COPY[lang]; assert.ok(copy?.label.length>5&&copy?.seoOnlyIndependent.length>12);
  const meta=modelSeoMetadata(model,lang);
  assert.ok(meta.description.includes(copy.seoOnlyIndependent),lang+": independent evidence must not imply manufacturer confirmation");
  const ld=modelStructuredData(model,lang,"https://tractorvs.com");
  const text=JSON.stringify(ld);
  assert.ok(text.includes(ref.source_url),"independent citation linked in structured metadata "+lang);
 }
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 assert.match(detail,/reviewedIndependentSourceUrl\(spec\)/);
 assert.match(detail,/INDEPENDENT_SOURCE_COPY\[lang\]\.label/);
});
