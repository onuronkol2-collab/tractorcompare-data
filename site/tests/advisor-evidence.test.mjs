import test from "node:test";
import assert from "node:assert/strict";
import { extractAdvisorFacts, selectAdvisorFacts } from "../src/lib/advisor-evidence.ts";
import { advisorText, advisorTranslationIssues } from "../src/lib/advisor-i18n.ts";
import { LOCALES } from "../src/lib/locales.ts";

const tractor = (specifications) => ({
  brand_name:"Başak Traktör", specifications,
});
const spec = (key, value, unit, overrides={}) => ({
  spec_id:"fixture",spec_name:key,canonical_key:key,spec_value:value,unit,
  evidence_text:"Fixture excerpt from original manufacturer brochure",
  verified_at:"2026-11-21T00:00:00Z",
  source_type:"manufacturer_specification",
  source_url:"https://www.basaktraktor.com.tr/technical-specifications",
  measurement_standard:null,rated_rpm:null,...overrides,
});
const farm={
  country:"TR",hectares:5,crop:"grain",terrain:"flat",soil:"medium",
  operation:"general",implement:"light",implements:[],trailer:"none",
  annualHours:200,condition:"either",budget:null,servicePriority:true,
};

test("technical facts require approved, evidenced manufacturer or reviewed sources",()=>{
  const facts=extractAdvisorFacts(tractor([
    spec("pto_speeds","540 / 540E","rpm"),
    spec("rear_lift_capacity","2100","kg"),
    spec("overall_width","1650","mm",{verified_at:null}),
    spec("hydraulic_main_flow","60","L/min",{source_url:"https://phishing.example/data"}),
    spec("transmission_type","Synchromesh",null,{evidence_text:""}),
  ]));
  assert.deepEqual(facts.map(f=>f.kind),["pto","rearLift"]);
  assert.ok(facts.every(f=>f.sourceUrl.startsWith("https://www.basaktraktor.com.tr/")));
  assert.ok(facts.every(f=>f.provenance==="manufacturer"));
});

test("conflicting claimed measurements are omitted instead of cherry-picked",()=>{
  const facts=extractAdvisorFacts(tractor([
    spec("pto_speeds","540","rpm"),
    spec("rear_pto_speeds","1000","rpm"),
    spec("rear_lift_capacity","2000","kg"),
    spec("rear_lift_capacity","2500","kg"),
    spec("drivetrain","4WD",null),
  ]));
  assert.deepEqual(facts.map(f=>f.kind),["drivetrain"]);
});

test("equipment selection reveals relevant documented facts without claiming fit",()=>{
  const facts=extractAdvisorFacts(tractor([
    spec("pto_speeds","540","rpm"),
    spec("rear_lift_capacity","2000","kg"),
    spec("hydraulic_service_flow_standard_lpm","58","L/min"),
    spec("hydraulic_main_flow","70","L/min"),
    spec("overall_width","1500","mm"),
    spec("transmission_type","Synchromesh",null),
  ]));
  assert.deepEqual(selectAdvisorFacts(facts,{...farm,implements:["mower"]}).map(f=>f.kind),["pto"]);
  assert.deepEqual(selectAdvisorFacts(facts,{...farm,implements:["plow"]}).map(f=>f.kind),["rearLift"]);
  assert.deepEqual(selectAdvisorFacts(facts,{...farm,implements:["front_loader"]}).map(f=>f.kind),["hydraulicService"]);
  assert.deepEqual(selectAdvisorFacts(facts,{...farm,crop:"orchard"}).map(f=>f.kind),["width"]);
  assert.deepEqual(selectAdvisorFacts(facts,{...farm,annualHours:900}).map(f=>f.kind),["transmission"]);
});

test("all explanatory evidence labels are translated to all ten locales",()=>{
  assert.deepEqual(advisorTranslationIssues(),[]);
  for(const locale of LOCALES){
    for(const key of [
      "factTitle","factCaution","factSource","factManufacturer","factIndependent",
      "fact_pto","fact_rearLift","fact_hydraulicService","fact_hydraulicMain",
      "fact_width","fact_transmission","fact_drivetrain",
    ]) assert.ok(advisorText(locale,key).trim().length>=1,locale+"/"+key); // CJK labels may contain 2 characters.
  }
});
