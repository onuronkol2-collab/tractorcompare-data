import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {modelEvidenceAnswers} from "../src/lib/model-evidence-answers.ts";
import {modelStructuredData} from "../src/lib/model-seo.ts";
import {LOCALES,NEW_LOCALES,LOCALE_TAGS} from "../src/lib/locales.ts";
import {MODEL_ANSWER_UI,modelAnswerMethodLocale} from "../src/lib/model-evidence-answer-i18n.ts";

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
 assert.match(html,/modelEvidenceAnswers\(safeEvidenceTractor,lang\)/);
 assert.match(html,/specifications:tractor\.specifications\.filter\(spec=>!isUnresolvedComparisonSpec\(tractor,spec\)\)/);
 assert.match(html,/class="model-evidence-answers"/);
 assert.match(html,/item\.question/);
 assert.match(html,/item\.answer/);
 assert.match(html,/href=\{item\.sourceUrl\}/);
 assert.match(html,/const answerItems=modelEvidenceAnswers\(safeEvidenceTractor,lang\)/);
 assert.match(html,/localizedPath\(answerMethodLocale,"\/methodology\/"\)/);
 assert.match(html,/hreflang=\{lang==="en"\|\|lang==="tr"\?undefined:answerMethodLocale\}/);
 assert.doesNotMatch(html,/\"@type\":\"FAQPage\"/);
});

test("source-backed engine displacement and rear hitch lift add useful, qualified AI answers",()=>{
 const model={...base,specifications:[
  spec("engine_displacement","3.6","L"),
  spec("rear_lift_capacity_kg","4500","kg",{measurement_standard:"with assistor rams"})
 ]};
 const en=modelEvidenceAnswers(model,"en");
 const tr=modelEvidenceAnswers(model,"tr");
 assert.deepEqual(en.map(a=>a.id),["engine-displacement","rear-hitch-lift"]);
 assert.deepEqual(tr.map(a=>a.id),["engine-displacement","rear-hitch-lift"]);
 assert.match(en[0].answer,/3.6 litres/);
 assert.match(tr[1].answer,/4.500 kg/);
 assert.match(en[1].answer,/measurement point and fitted equipment/);
 assert.ok(en.every(a=>a.sourceUrl===source&&a.sourceType==="manufacturer"));
});

test("new GEO answers fail closed for units, conflicting capacities and unsupported documents",()=>{
 const model={...base,specifications:[
  spec("engine_displacement","3600","cc"),
  spec("rear_lift_capacity_kg","4500","kg"),
  spec("rear_lift_capacity_kg","5500","kg",{spec_id:"conflicting"}),
  spec("hydraulic_lift_capacity","4000","kg",{source_url:null})
 ]};
 assert.deepEqual(modelEvidenceAnswers(model,"en"),[]);
 const wrong={...base,specifications:[
  spec("engine_displacement","3.6","kW"),
  spec("rear_lift_capacity_kg","4500","daN")
 ]};
 assert.deepEqual(modelEvidenceAnswers(wrong,"tr"),[]);
});

test("new GEO fields do not crowd out previously verified wheelbase and fuel answers",()=>{
 const model={...base,specifications:[
  spec("engine_rated_power","114","hp"),
  spec("pto_power_hp","89","hp"),
  spec("engine_displacement","3.6","L"),
  spec("rear_lift_capacity_kg","4500","kg"),
  spec("wheelbase_mm","2355","mm"),
  spec("fuel_tank_capacity","135","L")
 ]};
 const answers=modelEvidenceAnswers(model,"tr");
 assert.deepEqual(answers.map(x=>x.id),[
  "rated-power","pto-power","engine-displacement","rear-hitch-lift","wheelbase","fuel"
 ]);
 assert.ok(answers.every(x=>x.sourceUrl===source));
});

test("manufacturer HTML product pages are labelled sources, not presumed documents",()=>{
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 const index=readFileSync(new URL("../src/lib/model-source-index.ts",import.meta.url),"utf8");
 assert.equal(MODEL_ANSWER_UI.en.manufacturer,"Manufacturer source");
 assert.equal(MODEL_ANSWER_UI.tr.manufacturer,"Üretici kaynağı");
 assert.match(detail,/answerCopy\.manufacturer/);
 assert.doesNotMatch(detail,/Manufacturer document|Üretici belgesi/);
 assert.match(index,/official: "Manufacturer source"/);
 assert.match(index,/official: "Üretici kaynağı"/);
 assert.match(detail,/href=\{item\.sourceUrl\}/);
});

test("preserve long measurement conditions and distinguish test speeds",()=>{
 const note="Lift measured at the link ends with the optional assist cylinders fitted, at the specified hydraulic pressure.";
 const lift=spec("rear_lift_capacity_kg","12000","kg",{measurement_standard:note});
 const engine=spec("engine_rated_power","114","hp",{rated_rpm:2200});
 const answers=modelEvidenceAnswers({...base,specifications:[engine,lift]},"tr");
 assert.equal(answers[0].measurementNote,"2.200 dev/dk");
 assert.equal(answers[1].measurementNote,note);
 assert.equal(answers[1].guidePath,"/guides/tractor-hydraulic-lift-explained/");
 for(const other of [{...engine,rated_rpm:1800},{...engine,spec_value:"110-114"}]){
   assert.deepEqual(modelEvidenceAnswers({...base,specifications:[engine,other]},"en"),[]);
 }
});

test("every locale renders the same six source-qualified facts, not translated measurement units",()=>{
 const model={...base,specifications:[
  spec("engine_rated_power","114","hp",{rated_rpm:2200}),
  spec("pto_power_hp","89","hp"),spec("engine_displacement","3.6","L"),
  spec("rear_lift_capacity_kg","4500","kg",{measurement_standard:"with assistor rams"}),
  spec("wheelbase_mm","2355","mm"),spec("fuel_tank_capacity","135","L")
 ]};
 const expected=modelEvidenceAnswers(model,"en").map(({id,sourceUrl,sourceType})=>({id,sourceUrl,sourceType}));
 for(const locale of LOCALES){
  const answers=modelEvidenceAnswers(model,locale);
  assert.deepEqual(answers.map(({id,sourceUrl,sourceType})=>({id,sourceUrl,sourceType})),expected,locale);
  assert.ok(Object.values(MODEL_ANSWER_UI[locale]).every(s=>s.trim()),locale);
  assert.ok(answers.every(a=>a.question.includes("McCormick X5.120")&&!/\{[nv]\}|undefined|NaN/.test(a.answer+a.question)),locale);
  assert.match(answers[0].answer,/114 (?:HP|hp)/);
  const fmt=new Intl.NumberFormat(LOCALE_TAGS[locale],{maximumFractionDigits:2});
  assert.ok(answers[2].answer.includes(fmt.format(3.6)),locale);
  assert.ok(answers[0].measurementNote.includes(fmt.format(2200)),locale);
  assert.ok((answers[3].measurementNote||answers[3].answer).includes("with assistor rams"),locale);
  if(NEW_LOCALES.includes(locale)){
   assert.ok(answers.every(a=>a.guidePath===null),locale+" cannot link to an unpublished localized guide");
   assert.notEqual(answers[0].question,modelEvidenceAnswers(model,"en")[0].question,locale);
   assert.equal(modelAnswerMethodLocale(locale),"en");
  }
 }
 assert.equal(modelAnswerMethodLocale("tr"),"tr");
});
test("search-demand pilot: LS J27 GEAR and HST stay distinct in German with original source units",()=>{
 const source="https://www.lstractor.com/en/product/tractor/tractor_J";
 const rows=[spec("engine_power","27","HP",{source_url:source,source_type:"official_product_page",measurement_standard:"J27 GEAR factory specification"}),spec("fuel_tank_capacity","25","L",{source_url:source,source_type:"official_product_page"}),spec("wheelbase","1500","mm",{source_url:source,source_type:"official_product_page"}),spec("rear_lift_capacity","650","kgf",{source_url:source,source_type:"official_product_page"})];
 const model={...base,brand_name:"LS Tractor",model_name:"J27",variant:"GEAR",specifications:rows};
 const answers=modelEvidenceAnswers(model,"de");
 assert.deepEqual(answers.map(a=>a.id),["rated-power","wheelbase","fuel"]);
 assert.match(answers[0].question,/J27 \(GEAR\)/);assert.match(answers[0].answer,/27 HP/);
 assert.equal(answers[0].measurementNote,"J27 GEAR factory specification");
 assert.ok(answers.every(a=>a.sourceUrl===source));
 const hst=modelEvidenceAnswers({...model,variant:"HST",specifications:rows.map(s=>({...s,measurement_standard:s.measurement_standard?.replace("GEAR","HST")}))},"de");
 assert.match(hst[0].question,/J27 \(HST\)/);
 assert.notEqual(hst[0].question,answers[0].question);
});
test("search-demand pilot: Swaraj 735 FE Hindi answer uses verified lift, wheelbase and fuel, not power class",()=>{
 const source="https://www.swarajtractors.com/swaraj-735-fe-tractor";
 const official={source_url:source,source_type:"official_product_specification"};
 const model={...base,brand_name:"Swaraj",model_name:"735 FE",variant:null,market:"India",horsepower:40,specifications:[
  spec("engine_power","31-40","HP",official),spec("engine_displacement","2734","cm3",official),
  spec("rear_lift_capacity","1650","kg",official),spec("wheelbase_mm","2090","mm",official),spec("fuel_tank_capacity","47","L",official)
 ]};
 const answers=modelEvidenceAnswers(model,"hi");
 assert.deepEqual(answers.map(a=>a.id),["rear-hitch-lift","wheelbase","fuel"]);
 assert.ok(answers.every(a=>a.question.includes("Swaraj 735 FE")&&a.sourceUrl===source));
 assert.match(answers[0].answer,/1,650 kg/);
 assert.ok(!answers.some(a=>a.id==="rated-power"));
});
test("all locales keep the existing fail-closed evidence gate",()=>{
 const model={...base,specifications:[spec("engine_rated_power","114","hp"),spec("engine_rated_power","115","hp"),spec("fuel_tank_capacity","150","L",{verified_at:null}),spec("rear_lift_capacity","5000","kgf"),spec("engine_displacement","3600","cc"),spec("wheelbase_mm","2355","mm",{source_url:"https://unreviewed.example/model"})]};
 for(const locale of LOCALES)assert.deepEqual(modelEvidenceAnswers(model,locale),[],locale);
});

test("English and Turkish legacy answer text, formatting and guide links stay unchanged",()=>{
 const model={...base,variant:"4WD",specifications:[
  spec("engine_rated_power","114","hp",{rated_rpm:2200,measurement_standard:"ECE R120"}),
  spec("wheelbase_mm","2355","mm")
 ]};
 for(const locale of ["en","tr"]){
  const answers=modelEvidenceAnswers(model,locale);
  assert.deepEqual(answers,modelEvidenceAnswers({...model,variant:null},locale));
  assert.equal(answers[0].guidePath,"/guides/tractor-engine-power-and-torque/");
  assert.equal(answers[0].measurementNote,locale==="en"?"2,200 rpm":"2.200 dev/dk");
  assert.match(answers[0].answer,/ECE R120/);
 }
});
