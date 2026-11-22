import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {comparisonSpecs} from "../src/lib/comparison-specs.ts";
import {OEM_SOURCE_CONFLICT_COPY,modelSourceDiscrepancies,hasUnresolvedTigreDisplacement,
 isUnresolvedComparisonSpec,hasUnresolvedBasak4wdLength} from "../src/lib/manufacturer-conflicts.mjs";

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
test("OEM warning survives public-view suppression, while other variants are unaffected",()=>{
 const publicTigre=tractor("TIGRE 3800 F","Antonio Carraro",[
   spec("engine_cylinders",3,IT),
   spec("transmission_forward_gears",8,IT)
 ],{variant:"Stage V"});
 const onlyItalian=tractor("TIGRE 3800 F","Antonio Carraro",[spec("engine_displacement_cc",1331,IT,"cc")]);
 const other=tractor("TIGRE 3800","Antonio Carraro",tigre.specifications);
 assert.equal(modelSourceDiscrepancies(publicTigre,"en").length,1);
 assert.equal(modelSourceDiscrepancies(onlyItalian,"en").length,1);
 assert.equal(modelSourceDiscrepancies(other,"en").length,0);
 assert.equal(isUnresolvedComparisonSpec(onlyItalian,onlyItalian.specifications[0]),true);
 assert.ok(comparisonSpecs(publicTigre,"en").some(s=>s.notice?.includes("1,642")));
 assert.equal(comparisonSpecs(onlyItalian,"en").some(s=>s.value==="1331"),false);
 assert.ok(comparisonSpecs(other,"en").some(s=>s.value==="1331"));
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

const BASAK_PRODUCT="https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2075-bk";
const BASAK_PDF="https://admin.basaktraktor.com.tr/upload/7c743eaf-5228-4ae7-94d7-25df6a13e778-2075%20BK%204WD.pdf";
const basak=tractor("2075 BK","Başak Traktör",[
 spec("overall_length","3830",BASAK_PRODUCT,"mm"),
 spec("overall_length_with_front_ballast_mm","3930",BASAK_PDF,"mm"),
 spec("wheelbase","2205",BASAK_PDF,"mm"),
 spec("rear_lift_capacity","3000",BASAK_PDF,"kg")
],{variant:"4WD",model_year:null,market:"global",tractor_id:"9ef236be-0d91-4c87-af3d-8c0cf33f08a1"});

test("Başak 2075 BK 4WD unresolved 100 mm overall-length discrepancy is explicit in all ten locales",()=>{
 assert.equal(hasUnresolvedBasak4wdLength(basak),true);
 for(const lang of LOCALES){
  const copy=OEM_SOURCE_CONFLICT_COPY[lang].basakLength;
  assert.ok(copy.length>70,lang+" requires clear full context");
  assert.match(copy,/3[., ]?830/);
  assert.match(copy,/3[., ]?930/);
  assert.match(copy,/4WD/);
  const conflicts=modelSourceDiscrepancies(basak,lang);
  assert.equal(conflicts.length,1,lang);
  assert.deepEqual(conflicts[0].sourceUrls,[BASAK_PRODUCT,BASAK_PDF],lang);
  assert.equal(conflicts[0].id,"basak-2075-bk-4wd-overall-length");
 }
});

test("disputed Başak lengths are not comparable; legitimate specs and a warning survive",()=>{
 const safe=comparisonSpecs(basak,"tr");
 assert.ok(safe.length>=2);
 assert.equal(safe.some(s=>s.value==="3930"||s.value==="3830"),false);
 assert.equal(safe.some(s=>["overall_length","overall_length_with_front_ballast_mm"].includes(s.key)),false);
 assert.ok(safe.some(s=>s.key==="wheelbase"&&s.value==="2205"));
 assert.ok(safe.some(s=>s.key==="rear_lift_capacity"&&s.value==="3000"));
 assert.ok(safe.some(s=>s.notice?.includes("3.930")&&s.notice?.includes("3.830")));
 assert.equal(isUnresolvedComparisonSpec(basak,basak.specifications[0]),true);
 assert.equal(isUnresolvedComparisonSpec(basak,basak.specifications[1]),true);
 assert.equal(isUnresolvedComparisonSpec(basak,basak.specifications[2]),false);
 // Raw official values and citations remain intact on the model detail; no destructive data mutation.
 assert.equal(basak.specifications[1].spec_value,"3930");
 assert.equal(basak.specifications[1].source_url,BASAK_PDF);
});

test("Başak length warning never contaminates 2WD, other years, different markets or unrelated models",()=>{
 for(const model of [
  {...basak,variant:"2WD"},
  {...basak,model_year:2026},
  {...basak,market:"Europe"},
  {...basak,model_name:"2075 BT"},
  {...basak,brand_name:"Other Brand"},
  {...basak,variant:"4WD Special 2027",model_year:2027}
 ]){
  assert.equal(hasUnresolvedBasak4wdLength(model),false,JSON.stringify([model.brand_name,model.model_name,model.variant,model.model_year]));
  assert.deepEqual(modelSourceDiscrepancies(model,"en"),[]);
  assert.ok(comparisonSpecs(model,"en").some(s=>s.value==="3930"));
 }
});
