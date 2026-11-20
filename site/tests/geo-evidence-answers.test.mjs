import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {modelEvidenceAnswers} from "../src/lib/model-evidence-answers.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";

const base={
 tractor_id:"4f83ab62-0000-0000-0000-000000000000",
 slug:"mccormick-x5-120-4f83ab62",
 brand_name:"McCormick",
 model_name:"X5.120",
 variant:"Stage V, EU",
 market:"Europe",model_year:null,horsepower:null,brand_country:"Italy",
 brand_website_url:null,engine:null,transmission:null,drivetrain:null,weight_kg:null,
 specifications:[]
};
const source="https://www.mccormick-tractors.com/catalog.pdf";
function spec(key,value,unit,extra={}){
 return {spec_id:key,canonical_key:key,spec_name:key,
  spec_value:value,unit,comparison_class:"engine",
  measurement_standard:null,rated_rpm:null,
  evidence_text:"Manufacturer specification table for exact model",verified_at:"2026-11-18T12:00:00Z",
  source_url:source,source_publisher:"McCormick",source_type:"manufacturer_specification",
  source_accessed_at:null,spec_source_priority:100,...extra};
}
test("GEO direct answers explain only sourced, verified exact model fields",()=>{
 const tractor={...base,specifications:[
  spec("engine_rated_power","114","hp"),spec("wheelbase_mm","2355","mm"),
  spec("fuel_tank_capacity","150","l")
 ]};
 const tr=modelEvidenceAnswers(tractor,"tr");
 const en=modelEvidenceAnswers(tractor,"en");
 assert.equal(tr.length,3);
 assert.equal(en.length,3);
 assert.ok(tr[0].answer.includes("114 HP"));
 assert.ok(en[0].answer.includes("114 hp"));
 assert.ok(tr[1].answer.includes("2.355 mm"));
 assert.ok(en[1].answer.includes("2,355 mm"));
 assert.ok(tr.every(a=>a.sourceUrl===source&&a.sourceType==="manufacturer"));
 assert.ok(tr.some(a=>a.guidePath==="/guides/tractor-engine-power-and-torque/"));
 assert.ok(tr.every(a=>!a.answer.includes("NaN")&&!a.answer.includes("undefined")));
});
test("never fabricate numbers from arbitrary summary fields or unverified evidence",()=>{
 const tractor={...base,horsepower:130,specifications:[
  spec("engine_rated_power","130","hp",{source_url:null}),
  spec("wheelbase_mm","2355","mm",{verified_at:null}),
  spec("fuel_tank_capacity","150","l",{evidence_text:null}),
  spec("pto_power_hp","100","hp",{source_type:"some_unknown_source"})
 ]};
 assert.deepEqual(modelEvidenceAnswers(tractor,"tr"),[]);
});
test("conflicting verified values and incomparable standards fail closed",()=>{
 const model={...base,specifications:[
  spec("engine_rated_power","114","hp"),
  spec("engine_rated_power","120","hp"),
  spec("wheelbase_mm","2355","mm",{measurement_standard:"At wheel centres"}),
  spec("wheelbase_mm","2355","mm",{measurement_standard:"Different measurement"}),
  spec("fuel_tank_capacity","150","l")
 ]};
 const answers=modelEvidenceAnswers(model,"tr");
 assert.equal(answers.length,1);
 assert.equal(answers[0].id,"fuel");
});
test("avoid interpreting kW as horsepower, PTO output as engine power, or ranges as exact values",()=>{
 const model={...base,specifications:[
  spec("engine_rated_power","75","kW"),
  spec("pto_power_hp","100-120","hp"),
  spec("wheelbase_mm","2355","cm"),
  spec("fuel_tank_capacity","100/150","l")
 ]};
 assert.deepEqual(modelEvidenceAnswers(model,"en"),[]);
});
test("Model schema citations match real reviewed source URLs, not invented offers or ratings",()=>{
 const tractor={...base,specifications:[spec("wheelbase_mm","2355","mm")]};
 const data=modelStructuredData(tractor,"en","https://tractorvs.example");
 const graph=data["@graph"];
 const page=graph[0];
 assert.ok(page.citation?.includes(source));
 assert.deepEqual(page.citation,graph[2].subjectOf?.map(s=>s.url));
 assert.ok(!graph.some(part=>["Product","Vehicle","FAQPage"].includes(part["@type"])));
 const empty=modelStructuredData({...tractor,specifications:[spec("wheelbase_mm","2355","mm",{source_url:null})]},"en","https://tractorvs.example");
 assert.equal(empty["@graph"][0].citation,undefined);
});
test("visible model answers and public sources are part of server-rendered HTML template",()=>{
 const html=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 assert.match(html,/modelEvidenceAnswers\(tractor,lang\)/);
 assert.match(html,/class="model-evidence-answers"/);
 assert.match(html,/item\.question/);
 assert.match(html,/item\.answer/);
 assert.match(html,/href=\{item\.sourceUrl\}/);
 assert.match(html,/availableLocales|lang==="tr"\|\|lang==="en"/);
 assert.doesNotMatch(html,/\"@type\":\"FAQPage\"/);
});
