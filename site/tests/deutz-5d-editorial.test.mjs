import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {DEUTZ_5D_GS_PILOT,curatedDeutz5DPair} from "../src/lib/deutz-5d-editorial.ts";

const source=DEUTZ_5D_GS_PILOT.source;
const fields=[
 ["engine_rated_power","HP","86","97","ECE R120; same Stage V GS brochure"],
 ["engine_max_power","HP","91","102","ECE R120; same Stage V GS brochure"],
 ["engine_torque","Nm","372","417","same brochure; maximum torque"],
 ["engine_displacement","L","2.887","2.887",null],
 ["transmission_gear_configuration",null,"30F/30R Hi-Lo","30F/30R Hi-Lo","5 speeds, 3 ranges, 2 steps"],
 ["pto_speeds","rpm","540/540E","540/540E","PTO speed not PTO shaft horsepower"],
 ["hydraulic_main_flow","L/min","56","56","hydraulic pump, not steering flow"],
 ["rear_lift_capacity","kg","3500","3500","measurement point not supplied"],
 ["wheelbase","mm","2100","2100","same GS dimensional table"],
 ["fuel_tank_capacity","L","90","90","diesel, not AdBlue"],
 ["adblue_tank_capacity","L","12","12","AdBlue, not diesel"],
 ["operating_weight_cab","kg","3450","3450","cab without ballast"],
];
function tractor(side){
 const left=side==="left",id=left?DEUTZ_5D_GS_PILOT.leftId:DEUTZ_5D_GS_PILOT.rightId;
 return {tractor_id:id,slug:"deutz-fahr-"+(left?"5090-d":"5100-d")+"-"+id.slice(0,8),
  brand_name:"Deutz-Fahr",model_name:left?"5090 D":"5100 D",
  variant:DEUTZ_5D_GS_PILOT.variant,market:"Türkiye",model_year:null,
  specifications:fields.map(([key,unit,a,b,standard],index)=>({
   spec_id:String(index),canonical_key:key,spec_name:key,spec_value:left?a:b,unit,
   source_url:source,source_type:"manufacturer_specification",
   evidence_text:"5D GS page 15, matching source column",verified_at:"2026-11-21T12:00:00Z",
   measurement_standard:standard,rated_rpm:null
  }))};
}
const fixtures=()=>[tractor("left"),tractor("right")];
test("exact 5090 D / 5100 D Türkiye GS records give 12 verified paired specifications",()=>{
 const pair=curatedDeutz5DPair(fixtures());
 assert.ok(pair);
 assert.equal(pair.rows.length,12);
 assert.equal(pair.ratedDelta,11);
 assert.equal(pair.torqueDelta,45);
 assert.deepEqual(pair.rows.filter(x=>!x.same).map(x=>x.key),
  ["engine_rated_power","engine_max_power","engine_torque"]);
 assert.equal(pair.source,source);
 assert.equal(pair.rows.find(x=>x.key==="rear_lift_capacity").context,
  "measurement point not supplied");
});
test("never merge a different market, equipment package, model identity or assumed model year",()=>{
 for(const [key,value] of [
  ["market","Europe"],["variant","5D Series LS / Stage V"],["model_year",2025],
  ["model_name","5100 D"],["brand_name","Other Brand"],["tractor_id","unknown"]
 ]){
  const [a,b]=fixtures();a[key]=value;
  assert.equal(curatedDeutz5DPair([a,b]),null,"incorrect "+key);
 }
 assert.equal(curatedDeutz5DPair([tractor("left")]),null,"missing comparison partner");
});
test("source, evidence, standard, value or unit disputes fail closed",()=>{
 for(const [key,value] of [
  ["source_url","https://unverified.example/guess.pdf"],
  ["source_type","community_comment"],["evidence_text",""],
  ["verified_at",null],["spec_value","91 / 102 guessed"],["unit","kW"],
  ["measurement_standard","other test method"]
 ]){
  const [a,b]=fixtures();const affected=b.specifications.find(x=>x.canonical_key==="engine_rated_power");
  affected[key]=value;
  assert.equal(curatedDeutz5DPair([a,b]),null,"incorrect "+key);
 }
 const [a,b]=fixtures();b.specifications.push({...b.specifications[0],spec_id:"duplicate"});
 assert.equal(curatedDeutz5DPair([a,b]),null,"duplicate technical measurement");
});
test("two real localized static paths, no invented eight-language editorial text",()=>{
 const root=new URL("../src/pages/",import.meta.url);
 const slug="deutz-fahr-5090-d-gs-vs-5100-d-gs/index.astro";
 for(const [prefix,lang] of [["compare/","en"],["tr/compare/","tr"]]){
  const path=new URL(prefix+slug,root);
  assert.ok(existsSync(path),lang+" independently authored editorial route");
  assert.match(readFileSync(path,"utf8"),
   new RegExp('<Deutz5DGSEditorialComparison lang="'+lang+'"'));
 }
 for(const locale of ["zh","hi","pt-br","fr","de","ru","ja","es"])
  assert.ok(!existsSync(new URL(locale+"/compare/"+slug,root)),
   "do not manufacture an unreviewed translation for "+locale);
 const component=readFileSync(new URL("../src/components/Deutz5DGSEditorialComparison.astro",import.meta.url),"utf8");
 assert.match(component,/indexableLocales=\{\["en","tr"\]\}/);
 assert.match(component,/availableLocales=\{\["en","tr"\]\}/);
 assert.match(component,/indexable=\{Boolean\(pair\)\}/);
 assert.match(component,/editorial evidence gate/);
 assert.match(component,/rel="noopener noreferrer"/);
 assert.match(component,/2025.*broşür bağlamı/);
 assert.match(component,/year 2025 describes the source brochure context/);
 assert.doesNotMatch(component,/"@type":"Product"/);
});
test("editorial discoverability stays visible from SSR comparison and exact model detail",()=>{
 const compare=readFileSync(new URL("../src/components/TractorComparison.astro",import.meta.url),"utf8");
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 const articles=readFileSync(new URL("../src/components/EditorialHub.astro",import.meta.url),"utf8");
 assert.match(compare,/editorialPilotAvailable/);
 assert.match(compare,/curatedDeutz5DPair\(catalog\.tractors\)/);
 assert.match(compare,/href=\{localizedPath\(lang,DEUTZ_5D_GS_PILOT\.path\)\}/);
 assert.match(detail,/hasReviewedDeutzComparison/);
 assert.match(detail,/DEUTZ_5D_GS_PILOT\.leftId/);
 assert.match(detail,/DEUTZ_5D_GS_PILOT\.rightId/);
 assert.match(detail,/href=\{localizedPath\(lang,DEUTZ_5D_GS_PILOT\.path\)\}/);
 assert.match(articles,/DEUTZ_5D_GS_PILOT\.path/);
 assert.match(articles,/lang==="tr"\|\|lang==="en"/);
});
