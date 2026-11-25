import test from "node:test";
import assert from "node:assert/strict";
import {reviewedIdentityFallback,reviewedIdentityFallbackHeadings} from "../src/lib/reviewed-identity-heading-fallback.ts";
import {specLabel} from "../src/lib/catalog.ts";
const locales=["tr","zh","hi","pt-br","fr","de","ru","ja","es"];
test("every reviewed stable-ID English display heading has a native fallback in all nine target languages",()=>{
 assert.equal(reviewedIdentityFallbackHeadings.length,327);
 assert.equal(new Set(reviewedIdentityFallbackHeadings).size,327);
 for(const heading of reviewedIdentityFallbackHeadings){
  for(const lang of locales){
   assert.notEqual(reviewedIdentityFallback(heading,heading,lang),heading,lang+" "+heading);
   assert.ok(reviewedIdentityFallback(heading,heading,lang).trim());
   assert.equal(reviewedIdentityFallback(heading,"Already localized",lang),"Already localized");
   assert.equal(reviewedIdentityFallback(heading+" with EPM",heading+" with EPM",lang),heading+" with EPM");
  }
  assert.equal(reviewedIdentityFallback(heading,heading,"en"),heading);
 }
 assert.equal(reviewedIdentityFallback("PTO","PTO","ja"),"PTO");
 assert.equal(reviewedIdentityFallback("ISO 14396","ISO 14396","tr"),"ISO 14396");
});
test("high impact reviewed engineering labels preserve source details and values",()=>{
 const spec=Object.freeze({spec_name:"Maximum System Pressure",canonical_key:null,spec_value:"180",unit:"bar",measurement_standard:"source",evidence_text:"Maximum system pressure 180 bar"});
 assert.equal(specLabel(spec,"en"),"Maximum System Pressure");
 for(const lang of locales)assert.notEqual(specLabel(spec,lang),specLabel(spec,"en"),lang);
 assert.equal(spec.spec_value,"180");assert.equal(spec.unit,"bar");assert.equal(spec.measurement_standard,"source");
 const rated="Engine Max/Rated Power ECE R120 (Hp)";
 for(const lang of locales){
  const heading=reviewedIdentityFallback(rated,rated,lang);
  assert.match(heading,/ECE R120/);assert.match(heading,/HP/);
 }
 const lift="Continuous Rear Lift Capacity At 610 Mm (OECD)";
 for(const lang of locales)assert.match(reviewedIdentityFallback(lift,lift,lang),/610/);
});


test("second reviewed batch preserves measurement standards and qualifiers",()=>{
 for(const locale of locales){
  for(const [label,pattern] of [["Engine Rpm At Maximum Power (ISO 14396)",/ISO 14396/],["Lift Capacity At 610mm Behind Lift Point",/610/],["Engine RPM At 540 PTO",/540/],["Engine RPM At 1000 PTO",/1000/],["Category V Drawbar Vertical Load",/V/]])assert.match(reviewedIdentityFallback(label,label,locale),pattern,locale+" "+label);
  assert.notEqual(reviewedIdentityFallback("Maximum Reverse Speed","Maximum Reverse Speed",locale),reviewedIdentityFallback("Minimum Reverse Speed","Minimum Reverse Speed",locale));
 }
 assert.equal(reviewedIdentityFallback("Engine Max Power Hp 2000 25 Ec","Engine Max Power Hp 2000 25 Ec","fr"),"Engine Max Power Hp 2000 25 Ec");
});


test("maximum operating pressure cannot collapse into unqualified working pressure",()=>{
 for(const lang of locales)assert.notEqual(reviewedIdentityFallback("Maximum Hydraulic Operating Pressure","Maximum Hydraulic Operating Pressure",lang),reviewedIdentityFallback("Hydraulic Working Pressure","Hydraulic Working Pressure",lang),lang);
});


test("third batch preserves distinct limits, speed conditions, units and axle/PTO qualifiers",()=>{
 for(const lang of locales){
  const translated=label=>reviewedIdentityFallback(label,label,lang);
  for(const [label,pattern] of [["Width Max Mm",/mm|мм/],["Width Min Mm",/mm|мм/],["Maximum Total Weight At 40 Km/H",/40/],["Maximum Total Weight At 50 Km/H",/50/],["PTO Horsepower",/HP/],["AdBlue/DEF Tank Capacity",/AdBlue\/DEF/],["2WD Front Axle Configuration",/2WD|2RM|两轮/]])assert.match(translated(label),pattern,lang+" "+label);
  for(const [a,b] of [["Width Max Mm","Width Min Mm"],["Maximum Total Weight At 40 Km/H","Maximum Total Weight At 50 Km/H"],["Front PTO Speed","Rear PTO Shaft"],["Length With Front Linkage Lowered","Length With Front Linkage In Transport Position"]])assert.notEqual(translated(a),translated(b),lang);
 }
});


test("fourth reviewed batch preserves power ratings, front/rear PTO and hydraulic pump distinctions",()=>{
 for(const lang of locales){
  const t=label=>reviewedIdentityFallback(label,label,lang);
  for(const [label,pattern] of [["Engine Rated Power Kw",/kW|кВт/],["Gross Engine Power (KW)",/kW|кВт/],["Urea/AdBlue Tank Capacity",/AdBlue/],["Mid Pto Speed Rpm",/rpm|dev\/dk|tr\/min|U\/min|об\/мин/]])assert.match(t(label),pattern,lang+" "+label);
  for(const [a,b] of [["Engine Rated Power Kw","Gross Engine Power (KW)"],["Optional Front PTO Speed","Rear PTO System"],["Implement Pump Flow","Steering Pump Flow"],["Maximum Hydraulic Pump Flow","Main Hydraulic Pump Pressure"],["Three Point Hitch Category","Three Point Hitch"],["Service Brakes","Main Brake"],["Standard Front Ballast","Length Without Front Weight"]])assert.notEqual(t(a),t(b),lang);
 }
 for(const label of ["Pump Capacity","Intercooler","Engine Max Power Hp 2000 25 Ec","Liftomatic"])assert.equal(reviewedIdentityFallback(label,label,"tr"),label);
 assert.equal(reviewedIdentityFallback("Battery Capacity","Battery capacity already localized","tr"),"Battery capacity already localized");
});


test("fifth batch retains vehicle configuration, measurement units and operating distinctions",()=>{
 for(const lang of locales){
  const t=label=>reviewedIdentityFallback(label,label,lang);
  for(const [label,pattern] of [["Engine Gross Horsepower",/HP/],["Permissible Gvw 2wd Kg",/2WD|2RM/],["Wheelbase 2wd Mm",/mm|мм/],["Hydraulic Steering Pump Flow Lpm",/L\/min|L\/dk|л\/мин/],["Height To ROPS",/ROPS/],["Height To Top ROPS Or Cab",/ROPS/]])assert.match(t(label),pattern,lang+" "+label);
  for(const [a,b] of [["Max Speed 2wd Kmh","Min Speed 2wd Kmh"],["Unladen Cab 2wd Kg","Unladen Platform 2wd Kg"],["4WD Control","4WD Engagement Control"],["Weight Without Extra Ballast","Weight Without Ballast"],["Height To ROPS","Height To Top ROPS Or Cab"],["Ag Front Tyre","Ag Rear Tyre"],["Optional Electronic Remotes","Standard Electronic Remotes"]])assert.notEqual(t(a),t(b),lang);
 }
});


test("sixth batch preserves drive, exact units, conditions and manufacturer scope",()=>{
 for(const lang of locales){
  const t=label=>reviewedIdentityFallback(label,label,lang);
  for(const [label,pattern] of [["Maximum Engine Power With PowerPlus For Eligible Hydraulic, Mobile PTO And Haulage Work",/PowerPlus/],["Height With Maximum Tyre SRI",/SRI/],["Height With Minimum Tyre SRI",/SRI/],["Manufacturer ROPS/Cabin Weight Range Boundary, Load Status Unspecified",/ROPS/],["Manufacturer Cab/ROPS Weight Boundary (Load Condition Unstated)",/ROPS/],["Length, CVT",/CVT/],["Length, Powershift",/Powershift/],["Engine Max Power Cv Iso",/CV.*ISO/],["Engine Max Power Kw Iso",/(kW|кВт).*ISO/],["Rear Lift Capacity At 24 Inches Behind Link Ends",/24/],["Front Hitch Lift Option Kg",/kg|кг/],["Front Steering Angle Deg",/°/],["Ground Clearance Mm",/mm|мм/],["PTO Power (KW)",/kW|кВт/]])assert.match(t(label),pattern,lang+" "+label);
  for(const [a,b] of [["Height With Maximum Tyre SRI","Height With Minimum Tyre SRI"],["Length, CVT","Length, Powershift"],["Working Weight – CVT","Working Weight – Powershift"],["Minimum Speed","Minimum Speed With Creeper"],["Engine Max Power Cv Iso","Engine Max Power Kw Iso"],["Transmission Gears – Standard","Transmission Gears – Creeper Option"],["Largest Manufacturer-Listed Front Tire Size","Largest Manufacturer-Listed Rear Tire Size"],["PTO Rated Power","PTO Power (KW)"],["Maximum Height","Maximum Width"]])assert.notEqual(t(a),t(b),lang);
 }
});
