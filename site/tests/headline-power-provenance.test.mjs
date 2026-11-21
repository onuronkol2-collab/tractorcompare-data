import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {matchedHeadlinePowerSource} from "../src/lib/model-evidence-answers.ts";
import {HEADLINE_PROVENANCE_COPY} from "../src/lib/headline-provenance-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
import {modelSeoMetadata} from "../src/lib/model-seo.ts";

const official="https://www.mccormick-tractors.com/catalog.pdf";
function spec(overrides={}){
 return {
   spec_id:"power",spec_name:"Rated engine power",canonical_key:"engine_rated_power",
   spec_value:"114",unit:"hp",measurement_standard:"ECE R120",rated_rpm:2200,
   source_type:"manufacturer_specification",source_url:official,source_publisher:"McCormick",
   source_accessed_at:null,spec_source_priority:100,comparison_class:"engine",
   verified_at:"2026-11-20T10:00:00Z",evidence_text:"Reviewed exact X5.120 model-specific rated power table",
   ...overrides
 };
}
const model=(specifications=[spec()],horsepower=114)=>({
 brand_name:"McCormick",model_name:"X5.120",
 slug:"mccormick-x5-120-abc",
 tractor_id:"abc",brand_country:"Italy",brand_website_url:null,model_year:null,
 variant:"Stage V",market:"Europe",horsepower,
 engine:null,transmission:null,drivetrain:null,weight_kg:null,
 specifications
});

test("summary HP source is a real, exact, manufacturer-verified model measurement",()=>{
 const result=matchedHeadlinePowerSource(model());
 assert.deepEqual(result,{value:114,sourceUrl:official,sourceType:"manufacturer"});
});
test("matching headline must not silently certify contradictory versions or power standards",()=>{
 const cases=[
  model([spec({spec_value:"120"})]),
  model([spec(),spec({spec_id:"second",spec_value:"120"})]),
  model([spec(),spec({spec_id:"second",measurement_standard:"Different standard"})]),
  model([spec(),spec({spec_id:"second",canonical_key:"engine_power"})]),
  model([spec({unit:"kW"})]),
  model([spec({unit:"PS"})]),
  model([spec({canonical_key:"pto_power_hp"})]),
  model([spec({canonical_key:"engine_max_power"})]),
  model([spec({canonical_key:"engine_gross_power"})]),
  model([spec({source_url:null})]),
  model([spec({source_url:"https://malicious.example/catalog.pdf"})]),
  model([spec({verified_at:null})]),
  model([spec({evidence_text:null})]),
  model([],114),model([spec()],null),
 ];
 for(const item of cases)assert.equal(matchedHeadlinePowerSource(item),null,
    "Risky horsepower/evidence mismatch must remain unconfirmed");
});
test("already-sourced public power is not silently rewritten or turned into SEO evidence",()=>{
 const unverified=model([spec({source_url:null})],114);
 assert.equal(matchedHeadlinePowerSource(unverified),null);
 const valid=model();
 assert.match(modelSeoMetadata(valid,"en").description,/114 HP/);
 assert.doesNotMatch(modelSeoMetadata(unverified,"en").description,/114 HP/);
});
test("all ten locales clearly disclose matched source and unconfirmed summary status",()=>{
 assert.deepEqual(Object.keys(HEADLINE_PROVENANCE_COPY).sort(),[...LOCALES].sort());
 for(const locale of LOCALES){
  const text=HEADLINE_PROVENANCE_COPY[locale];
  for(const [key,value] of Object.entries(text)){
   assert.ok(value.length>15,locale+" should have meaningful "+key);
  }
  assert.notEqual(text.matched,text.unconfirmed,locale);
  assert.notEqual(text.summaryCaveat,HEADLINE_PROVENANCE_COPY.en.summaryCaveat);
 }
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 assert.match(detail,/HEADLINE_PROVENANCE_COPY\[lang\]/);
 assert.match(detail,/matchedHeadlinePowerSource\(tractor\)/);
 assert.match(detail,/href=\{powerProvenance\.sourceUrl\}/);
 assert.match(detail,/sourceCopy\.unconfirmed/);
 assert.match(detail,/sourceCopy\.summaryCaveat/);
 assert.match(detail,/!isSonalikaExport/);
 assert.match(detail,/rel="noopener noreferrer"/);
});
