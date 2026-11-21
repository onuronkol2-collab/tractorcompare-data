import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {evaluateSource,sourceUrl,containsPhrase,groupFetches,aggregateTriage}
 from "./tractor-free-source-triage.mjs";

const base={
 target:{brand:"Antonio Carraro",model:"TONY 8900 SR",variant:"Catalog listing - review",
  market:"global",modelYear:null},
 document:{url:"https://www.antoniocarraro.it/en/catalogue/tony-10900-sr",
  finalUrl:"https://www.antoniocarraro.it/en/catalogue/tony-10900-sr",
  httpStatus:200,contentType:"text/html",title:"Tony 10900 SR | Antonio Carraro"},
 evidence:{key:"engine_power",label:"Power",value:"74.2",unit:"hp",
  modelTechnicalBlock:"TONY 8900 SR\nPower 54.6 kW / 74.2 hp at 2400 rpm"},
 trustedHosts:["antoniocarraro.it"]
};
const changed=(data)=>({
 ...base,
 target:{...base.target,...(data.target||{})},
 document:{...base.document,...(data.document||{})},
 evidence:{...base.evidence,...(data.evidence||{})},
 trustedHosts:data.trustedHosts??base.trustedHosts
});

test("manufacturer shared-page slug is not treated as proof of the wrong model",()=>{
 const result=evaluateSource(base);
 assert.equal(result.state,"review_candidate");
 assert.ok(result.warnings.includes("shared_or_differently_named_catalogue_page"));
 assert.ok(result.warnings.includes("model_year_not_proven"));
 assert.ok(result.warnings.includes("market_not_proven"));
 assert.ok(result.warnings.includes("editorial_variant_not_proven"));
 assert.equal(result.reason,"bounded_source_fact_for_editorial_review");
});

test("a navigation-only mention or another model tab never proves a measurement",()=>{
 assert.equal(evaluateSource(changed({evidence:{modelTechnicalBlock:"TONY 10900 SR\nPower 74.2 hp"}})).state,"needs_identity");
 assert.equal(evaluateSource(changed({evidence:{modelTechnicalBlock:"TONY 8900 SR – click here to view"}})).state,"needs_evidence");
 assert.equal(evaluateSource(changed({evidence:{modelTechnicalBlock:"TONY 8900 SR\nPower 174.2 hp"}})).state,"needs_evidence");
});

test("equipment variant, market and year need their own explicit identity in evidence",()=>{
 assert.equal(evaluateSource(changed({target:{variant:"4WD"}})).reason,"variant_not_explicit");
 assert.equal(evaluateSource(changed({target:{market:"Turkey"}})).reason,"market_not_explicit");
 assert.equal(evaluateSource(changed({target:{modelYear:2025}})).reason,"year_not_explicit");
 assert.equal(evaluateSource(changed({
  target:{variant:"4WD",market:"Turkey",modelYear:2025},
  evidence:{modelTechnicalBlock:"TONY 8900 SR 4WD Turkey 2025 — Power 74.2 hp"}
 })).state,"review_candidate");
});

test("rated or maximum power is blocked until its measurement standard appears",()=>{
 assert.equal(evaluateSource(changed({evidence:{key:"engine_rated_power_hp"}})).state,"needs_standard");
 assert.equal(evaluateSource(changed({evidence:{
  key:"engine_rated_power_hp",measurementStandard:"ECE R120",
  modelTechnicalBlock:"TONY 8900 SR Power 74.2 hp tested under ECE R120"
 }})).state,"review_candidate");
});

test("private redirects, spoofed domains and untrusted schemes are rejected",()=>{
 for(const url of [
  "http://www.antoniocarraro.it/en/catalogue/tony-10900-sr",
  "https://user:secret@www.antoniocarraro.it/model",
  "https://www.antoniocarraro.it.attacker.invalid/model",
  "https://127.0.0.1/model",
  "https://www.antoniocarraro.it:8443/model"
 ])assert.equal(sourceUrl(url,base.trustedHosts),null,url);
 assert.equal(sourceUrl(base.document.url,[]),null);
 assert.equal(evaluateSource(changed({document:{finalUrl:"https://not-official.example/model"}})).state,"blocked");
});

test("HTTP errors, unknown content types and non-extracted PDFs are held",()=>{
 assert.equal(evaluateSource(changed({document:{httpStatus:404}})).reason,"source_not_http_200");
 assert.equal(evaluateSource(changed({document:{contentType:"application/octet-stream"}})).reason,"unsupported_content_type");
 assert.equal(evaluateSource(changed({document:{contentType:"application/pdf",textExtracted:false}})).reason,"pdf_text_not_extracted");
 assert.equal(evaluateSource(changed({document:{contentType:"application/pdf",textExtracted:true}})).state,"review_candidate");
});

test("text matching preserves exact model numbers, units and boundaries",()=>{
 assert.equal(containsPhrase("TONY 10900 SR / 174.2 hp","TONY 8900 SR"),false);
 assert.equal(containsPhrase("54.6 kW / 74.2 hp","74.2"),true);
 assert.equal(containsPhrase("174.2 hp","74.2"),false);
 assert.equal(containsPhrase("Stage V | 4WD","4WD"),true);
});

test("one document fetch can support multiple independent model-review records",()=>{
 const differentModel=changed({target:{model:"TONY 10900 SR"},evidence:{
  modelTechnicalBlock:"TONY 10900 SR Power 98.0 hp",value:"98.0"
 }});
 const g=groupFetches([base,differentModel]);
 assert.equal(g.size,1);
 assert.equal([...g.values()][0].length,2);
 assert.equal(evaluateSource(differentModel).state,"review_candidate");
});

test("12+ source records are triaged offline without approval or publication",()=>{
 const dozen=[
 base,
 changed({evidence:{modelTechnicalBlock:"TONY 10900 SR Power 74.2 hp"}}),
 changed({evidence:{modelTechnicalBlock:"TONY 8900 SR navigation only"}}),
 changed({target:{variant:"4WD"}}),
 changed({target:{market:"Turkey"}}),
 changed({target:{modelYear:2025}}),
 changed({evidence:{key:"engine_rated_power_hp"}}),
 changed({document:{httpStatus:429}}),
 changed({document:{contentType:"application/pdf",textExtracted:false}}),
 changed({document:{finalUrl:"https://malicious.example/path"}}),
 changed({evidence:{modelTechnicalBlock:""}}),
 changed({document:{contentType:"application/pdf",textExtracted:true}}),
 changed({target:{variant:"4WD",market:"Turkey",modelYear:2025},
  evidence:{modelTechnicalBlock:"TONY 8900 SR 4WD Turkey 2025 Power 74.2 hp"}})
 ];
 const summary=aggregateTriage(dozen);
 assert.equal(summary.records,13);
 assert.equal(summary.published,0);
 assert.equal(summary.paid_ai_calls,0);
 assert.equal(summary.db_changes,0);
 assert.equal(summary.unique_trusted_documents,1);
 assert.ok(summary.outcomes.review_candidate>=3);
 assert.equal(summary.outcomes.blocked,1);
 assert.throws(()=>aggregateTriage(Array(1001).fill(base)),/Bounded/);
});

test("CLI never prints raw private model, URL, excerpt, or API fields",()=>{
 const script=fileURLToPath(new URL("./tractor-free-source-triage.mjs",import.meta.url));
 const raw=JSON.stringify([base]);
 const child=spawnSync(process.execPath,[script],{encoding:"utf8",input:raw});
 assert.equal(child.status,0,child.stderr);
 const parsed=JSON.parse(child.stdout);
 assert.equal(parsed.records,1);
 for(const privateText of ["TONY","antoniocarraro.it","74.2","TONY 8900 SR"]){
  assert.equal(child.stdout.includes(privateText),false);
 }
});


test("model mention after a different technical box does not validate earlier model's power",()=>{
 const candidate=changed({
  target:{brand:"Antonio Carraro",model:"MACH 2 R"},
  document:{url:"https://www.antoniocarraro.it/en/catalogue/mach-2-r",
   finalUrl:"https://www.antoniocarraro.it/en/catalogue/mach-2-r"},
  evidence:{value:"74.2",modelTechnicalBlock:
   "8900 R Power 74.2 hp \n MACH 2 R - tractor navigation heading"}
 });
 const result=evaluateSource(candidate);
 assert.equal(result.state,"needs_evidence");
 assert.equal(result.reason,"value_label_or_unit_missing_after_model");
});

test("two contradictory official TIGRE 3800 F engine displacements become conflict_review",()=>{
 const a=changed({
  target:{model:"TIGRE 3800 F"},
  document:{url:"https://www.antoniocarraro.it/it/catalogo/tigre-3800-f",
   finalUrl:"https://www.antoniocarraro.it/it/catalogo/tigre-3800-f",title:"TIGRE 3800 F"},
  evidence:{key:"engine_displacement_cc",label:"Displacement",value:"1331",unit:"cc",
   modelTechnicalBlock:"TIGRE 3800 F Displacement 1331 cc"}
 });
 const b=changed({
  target:{model:"TIGRE 3800 F"},
  document:{url:"https://www.antoniocarraro.it/en/catalogue/tigre-3800-f",
   finalUrl:"https://www.antoniocarraro.it/en/catalogue/tigre-3800-f",title:"TIGRE 3800 F"},
  evidence:{key:"engine_displacement_cc",label:"Displacement",value:"1642",unit:"cc",
   modelTechnicalBlock:"TIGRE 3800 F Displacement 1642 cc"}
 });
 assert.equal(evaluateSource(a).state,"review_candidate");
 assert.equal(evaluateSource(b).state,"review_candidate");
 const result=aggregateTriage([a,b]);
 assert.equal(result.cross_source_conflicts,2);
 assert.equal(result.outcomes.conflict_review,2);
 assert.equal(result.outcomes.review_candidate,undefined);
 assert.equal(result.published,0);
});

test("same numeric fact in decimal comma and dot notation does not create conflict",()=>{
 const first=changed({evidence:{value:"25,7",modelTechnicalBlock:"TONY 8900 SR Power 25,7 hp"}});
 const second=changed({document:{
  url:"https://www.antoniocarraro.it/it/catalogo/tony-8900-sr",
  finalUrl:"https://www.antoniocarraro.it/it/catalogo/tony-8900-sr"
 },evidence:{value:"25.7",modelTechnicalBlock:"TONY 8900 SR Power 25.7 hp"}});
 const out=aggregateTriage([first,second]);
 assert.equal(out.cross_source_conflicts,0);
 assert.equal(out.outcomes.review_candidate,2);
});

test("independent market and standard scopes are never silently merged",()=>{
 const eur=changed({target:{market:"Europe"},evidence:{
   value:"74.2",modelTechnicalBlock:"TONY 8900 SR Europe Power 74.2 hp"
 }});
 const us=changed({target:{market:"US"},evidence:{
   value:"98",modelTechnicalBlock:"TONY 8900 SR US Power 98 hp"
 }});
 const out=aggregateTriage([eur,us]);
 assert.equal(out.cross_source_conflicts,0);
 assert.equal(out.outcomes.review_candidate,2);
});

test("a blocked source cannot manufacture a cross-source conflict",()=>{
 const verified=base;
 const blocked=changed({document:{finalUrl:"https://evil.example/false"},evidence:{
   value:"174.2",modelTechnicalBlock:"TONY 8900 SR Power 174.2 hp"
 }});
 const out=aggregateTriage([verified,blocked]);
 assert.equal(out.cross_source_conflicts,0);
 assert.equal(out.outcomes.blocked,1);
 assert.equal(out.outcomes.review_candidate,1);
});
