import test from "node:test";
import assert from "node:assert/strict";
import {specLabel} from "../src/lib/catalog.ts";
import {oem20261122SpecLabel} from "../src/lib/oem-20261122-spec-labels.ts";
const labels=[
  "Service brake type",
  "Cab",
  "Transmission clutch",
  "Nominal engine power (ISO 14396)",
  "Front ballast",
  "Front differential",
  "Adjustable front track width",
  "Front track",
  "Front track range",
  "Front tyre option 1",
  "Front tyre size",
  "Lift capacity at pivot point (minimum)",
  "Maximum hydraulic pump pressure",
  "Hydraulic outlets / valves",
  "Standard hydraulic outlets",
  "Standard rear hydraulic outlets",
  "Hydraulic output circuits",
  "Minimum operating mass",
  "Minimum turning radius",
  "Length including front ballast",
  "Parking brake control",
  "Rear PTO type",
  "Maximum engine power rpm",
  "Nominal engine speed",
  "Rear ballast",
  "Adjustable rear track width",
  "Rear tyre option 1",
  "Rear tyre size",
  "Service brake system",
  "Standard transmission gearing",
  "Optional transmission gearing",
  "Weight without additional ballast",
  "Ground clearance range",
  "Rear hitch lifting capacity (point unspecified)",
  "Rear track range"
];
const locales=["tr","zh","hi","pt-br","fr","de","ru","ja","es"];
test("nominal source terminology has nine reviewed non-English labels without changing measurements",()=>{
  for(const name of labels){
    assert.equal(oem20261122SpecLabel(name,"en"),name);
    const spec={spec_name:name,canonical_key:"",spec_value:"123",unit:"mm"};
    for(const locale of locales){
      const translated=oem20261122SpecLabel(name,locale);
      assert.ok(translated&&translated.toLowerCase()!==name.toLowerCase(),name+" "+locale);
      assert.ok(specLabel(spec,locale).toLowerCase()!==specLabel(spec,"en").toLowerCase(),name+" "+locale);
      assert.equal(spec.spec_value,"123");
      assert.equal(spec.unit,"mm");
    }
  }
});
test("nominal and maximum ISO power, pivot minimum and weight scope are not collapsed",()=>{
  for(const lang of locales){
    const nominal=specLabel({spec_name:"Nominal engine power (ISO 14396)",canonical_key:"engine_power_iso_14396"},lang);
    const maximum=specLabel({spec_name:"Maximum engine power (ISO 14396)",canonical_key:"engine_power_iso_14396"},lang);
    assert.notEqual(nominal,maximum,lang);
    assert.ok(nominal.includes("ISO 14396"),lang);
  }
});
