import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {GLOSSARY_TERMS,GLOSSARY_SECTIONS,glossaryAnchorForKey} from "../src/lib/tractor-glossary.ts";

const component=readFileSync(new URL("../src/components/TractorGlossary.astro",import.meta.url),"utf8");
const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
const en=readFileSync(new URL("../src/pages/guides/tractor-technical-terms/index.astro",import.meta.url),"utf8");
const tr=readFileSync(new URL("../src/pages/tr/guides/tractor-technical-terms/index.astro",import.meta.url),"utf8");

test("96 original bilingual technical concepts with unique SEO-safe anchors and realistic comparison guidance",()=>{
 assert.equal(GLOSSARY_TERMS.length,96);
 const seen=new Set();
 for(const x of GLOSSARY_TERMS){
  assert.match(x.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!seen.has(x.id),`duplicated anchor: ${x.id}`);seen.add(x.id);
  assert.ok(x.category in GLOSSARY_SECTIONS);
  for(const lang of ["tr","en"]){
   for(const field of ["name","definition","example","caution"]){
    assert.ok(x[field][lang].trim().length>= (field==="name"?4:40),
      `missing thorough ${lang} ${field} for ${x.id}`);
   }
  }
 }
 assert.equal(Object.keys(GLOSSARY_SECTIONS).length,7);
});

test("model specification keys point only to valid glossary definitions",()=>{
 const cases={
  engine_model:"engine-model",engine_type:"engine-type",
  engine_rated_power:"rated-power",rated_engine_power:"rated-power",
  cab_suspension:"cab-suspension",battery_capacity:"battery",alternator:"alternator",
  hydraulic_external_control:"external-controls",manufacturer_model_code:"model-identity",
  engine_hp_category:"engine-power",
  engine_torque:"torque",engine_displacement:"displacement",
  power_range:"engine-power",pto_power_hp:"pto-power",
  rear_pto_speed:"pto-speeds",transmission_type:"manual-gearbox",
  hydraulic_pump_total_flow_lpm:"hydraulic-flow",
  hydraulic_lift_capacity:"rear-lift",wheelbase_mm:"wheelbase",
  tractor_weight_kg:"operating-weight",ground_clearance:"ground-clearance",
  hitch_category:"hitch-category",emission_standard:"emission",
  rear_tyre_options:"tyre-size",front_rop_structure:"rops",
 };
 const anchors=new Set(GLOSSARY_TERMS.map(x=>x.id));
 for(const [key,expected] of Object.entries(cases)){
  assert.equal(glossaryAnchorForKey(key),expected,key);
 }
 for(const key of Object.keys(cases))assert.ok(anchors.has(glossaryAnchorForKey(key)));
 assert.equal(glossaryAnchorForKey(null),null);
 assert.equal(glossaryAnchorForKey("unknown_completely"),null);
});

test("new indexable routes are human-translated TR and EN, not ten duplicated English pages",()=>{
 assert.match(en,/TractorGlossary lang="en"/);
 assert.match(tr,/TractorGlossary lang="tr"/);
 assert.match(component,/availableLocales=\{\["en","tr"\]\}/);
 assert.match(component,/localizedPath\(lang,"\/guides\/tractor-technical-terms\/"\)/);
 assert.match(component,/"@type":"TechArticle"/);
 assert.match(component,/"@type":"BreadcrumbList"/);
 assert.doesNotMatch(component,/"@type":"FAQPage"/);
 assert.match(component,/GLOSSARY_TERMS\.filter/);
 assert.match(component,/id=\{term.id\}/);
});

test("photo display uses approved licensed first-party library and open-in-lightbox controls",()=>{
 assert.match(component,/APPROVED_TRACTOR_PHOTOS/);
 assert.match(component,/photo\.licenseUrl/);
 assert.match(component,/data-photo-license=/);
 assert.match(component,/data-tractor-photo/);
 assert.match(component,/srcset=/);
 assert.match(component,/alt=/);
 assert.doesNotMatch(component,/unsplash|pexels|stockphoto/i);
});

test("glossary is discoverable on public model specification and global footer",()=>{
 assert.match(detail,/glossaryAnchorForKey\(spec\.canonical_key\)/);
 assert.match(detail,/class="model-spec-glossary-link"/);
 assert.match(detail,/model-spec-glossary-banner/);
 assert.match(layout,/href=\{glossaryPath\}/);
 assert.match(layout,/t\(lang,"navTechnicalTerms"\)/);
 assert.match(readFileSync(new URL("../src/lib/ui.ts",import.meta.url),"utf8"),/Traktör parçaları ve teknik terimler/);
 assert.match(readFileSync(new URL("../src/lib/ui.ts",import.meta.url),"utf8"),/Tractor parts & technical terms/);
 assert.match(component,/https:\/\/www\.oecd\.org\/en\/topics\/tractors\.html/);
 assert.match(component,/https:\/\/tractortestlab\.unl\.edu\//);
});
