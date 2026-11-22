import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {comparisonSpecs} from "../src/lib/comparison-specs.ts";
import {OEM_SOURCE_CONFLICT_COPY,modelSourceDiscrepancies,hasUnresolvedTigreDisplacement,
 isUnresolvedComparisonSpec} from "../src/lib/manufacturer-conflicts.mjs";

const IT="https://www.antoniocarraro.it/it/catalogo/tigre-3800-f";
const EN="https://www.antoniocarraro.it/en/catalogue/tigre-3800-f";
const MACH="https://www.antoniocarraro.it/en/catalogue/mach-2-r";
const SON="https://www.sonalika.com/tractor/gt-22-4wd";
function spec(key,value,source_url,unit=null) {
 return {
  spec_id:key+"-"+value,spec_name:key.replaceAll("_"," "),spec_value:String(value),
  canonical_key:key,comparison_class:"engine",unit,source_url,
  source_type:"official_product_page",source_publisher:"Official manufacturer",
  source_accessed_at:"2026-11-22",verified_at:"2026-11-22",
  source_priority:100,spec_source_priority:100,
  evidence_text:"Original manufacturer statement",
  rated_rpm:null,measurement_standard:null
 };
}
function tractor(name,brand,specs,override={}) {
 return {
  tractor_id:"mock-id",slug:"mock-slug",brand_name:brand,
  model_name:name,variant:null,status:"published",
  horsepower:null,engine:null,market:null,specifications:specs,...override
 };
}
const tigre=tractor("TIGRE 3800 F","Antonio Carraro",[
 spec("engine_displacement_cc",1331,IT,"cc"),
 spec("engine_description","Yanmar 3-cylinder, 1642 cc, Stage V",EN),
 spec("transmission_forward_gears",8,IT),
 spec("rear_lift_capacity",1000,IT,"kg")
]);
test("all ten locales explain exact OEM conflicts rather than asserting which number is true",()=>{
 assert.deepEqual(Object.keys(OEM_SOURCE_CONFLICT_COPY),[...LOCALES]);
 for(const lang of LOCALES){
  const texts=OEM_SOURCE_CONFLICT_COPY[lang];
  for(const field of ["tigre","mach","sonalika"])
   assert.ok(texts[field].length>=35,lang+":"+field);
  assert.match(texts.tigre,/1[.,\s]?331/);
  assert.match(texts.tigre,/1[.,\s]?642/);
  assert.match(texts.mach,/74[.,]2/);
  assert.match(texts.mach,/98/);
  assert.match(texts.sonalika,/4WD/);
  assert.match(texts.sonalika,/2WD/);
 }
});
test("TIGRE 3800 F contradictory manufacturer locales trigger two source links",()=>{
 assert.equal(hasUnresolvedTigreDisplacement(tigre),true);
 const note=modelSourceDiscrepancies(tigre,"tr");
 assert.equal(note.length,1);
 assert.deepEqual(note[0].sourceUrls,[IT,EN]);
 assert.match(note[0].message,/1.331/);
});
test("side by side comparison cannot treat 1331 or 1642 cc as settled; other specs remain",()=>{
 const safe=comparisonSpecs(tigre,"en");
 assert.ok(safe.length>=2);
 assert.equal(safe.some(s=>s.value==="1331"),false);
 assert.equal(safe.some(s=>String(s.value).includes("1642")),false);
 assert.equal(safe.some(s=>s.value==="8"),true);
 assert.ok(safe.some(s=>s.notice?.includes("1,642")));
 assert.equal(isUnresolvedComparisonSpec(tigre,tigre.specifications[0]),true);
});
test("fail open on no conflict and never conflate TIGRE 3800 without suffix F",()=>{
 const single=tractor("TIGRE 3800 F","Antonio Carraro",[spec("engine_displacement_cc",1331,IT,"cc")]);
 const other=tractor("TIGRE 3800","Antonio Carraro",tigre.specifications);
 assert.equal(modelSourceDiscrepancies(single,"en").length,0);
 assert.equal(modelSourceDiscrepancies(other,"en").length,0);
 assert.equal(isUnresolvedComparisonSpec(single,single.specifications[0]),false);
 assert.ok(comparisonSpecs(single,"en").some(s=>s.value==="1331"));
});
test("MACH 2 R and Sonalika warning is scoped to actually published source evidence",()=>{
 const mach=tractor("MACH 2 R","Antonio Carraro",[
  spec("manufacturer_engine_power_unspecified_standard","74.2",MACH,"hp")]);
 const son=tractor("GT 22 4WD","Sonalika",[spec("drivetrain","4WD",SON)]);
 assert.equal(modelSourceDiscrepancies(mach,"en")[0].sourceUrls[0],MACH);
 assert.equal(modelSourceDiscrepancies(son,"en")[0].sourceUrls[0],SON);
 assert.ok(comparisonSpecs(mach,"en").some(s=>s.notice?.includes("98 hp")));
 assert.ok(comparisonSpecs(son,"en").some(s=>s.notice?.includes("2WD")));
 assert.deepEqual(modelSourceDiscrepancies(tractor("MACH 2 R","Antonio Carraro",
    [spec("manufacturer_engine_power_unspecified_standard","74.2","https://elsewhere.invalid","hp")]),"en"),[]);
});
test("detail pages show a prominent evidence-linked banner and short answers omit disputed claims",()=>{
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 assert.match(detail,/model-source-conflict-banner/);
 assert.match(detail,/unresolvedManufacturerConflicts\.map/);
 assert.match(detail,/issue\.sourceUrls\.map/);
 assert.match(detail,/modelEvidenceAnswers\(safeEvidenceTractor,lang\)/);
 assert.match(detail,/isUnresolvedComparisonSpec\(tractor,spec\)/);
 const comp=readFileSync(new URL("../src/lib/comparison-specs.ts",import.meta.url),"utf8");
 assert.match(comp,/filter\(spec => !isUnresolvedComparisonSpec\(tractor,spec\)\)/);
});
