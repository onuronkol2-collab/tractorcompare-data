import test from "node:test";
import assert from "node:assert/strict";
import {OEM_20261122_SPEC_LABELS,oem20261122SpecLabel} from "../src/lib/oem-20261122-spec-labels.ts";
const targets=["tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const headings=[
 "Braking system","Front axle type","PTO speed selection",
 "Clutch options","Manufacturer-stated service interval","Manufacturer-quoted PTO power",
 "Manufacturer-listed clutch feature","Manufacturer-listed implement side-shift feature",
 "Wheel arrangement"
];
test("all nine exact OEM source-qualified headings have nine nonempty language labels",()=>{
 // This legacy contract protects the original nine source-qualified headings.
 // The dictionary is intentionally extensible; nominal-source-heading-coverage.test.mjs
 // independently protects the complete new 35-heading set.
 for(const heading of headings) assert.ok(Object.hasOwn(OEM_20261122_SPEC_LABELS,heading),heading+" missing");
 for(const heading of headings){
  for(const locale of targets){
   const translated=oem20261122SpecLabel(heading,locale);
   assert.equal(typeof translated,"string",heading+" missing "+locale);
   assert.ok(translated.length>3,heading+" too short "+locale);
   assert.notEqual(translated,heading,"English source heading must be localized");
  }
  assert.equal(oem20261122SpecLabel(heading,"en"),heading,"English OEM qualifier must remain exact");
 }
});
test("raw numbers, OEM names and unreviewed headings never get altered",()=>{
 for(const literal of ["36.4 kW","400 hours","MSPTO","ARJUN 605 DI MS V1","Agrale 4233","Dual clutch / SLIPTO"]){
  for(const lang of ["tr","fr","zh"])assert.equal(oem20261122SpecLabel(literal,lang),null);
 }
 assert.equal(oem20261122SpecLabel("Manufacturer-quoted PTO power","tr"),"Üreticinin bildirdiği PTO gücü");
 assert.equal(oem20261122SpecLabel("Manufacturer-stated service interval","de"),"Wartungsintervall laut Hersteller");
});
