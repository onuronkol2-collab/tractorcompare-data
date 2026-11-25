import test from "node:test";
import assert from "node:assert/strict";
import {reviewedIdentityFallback,reviewedIdentityFallbackHeadings} from "../src/lib/reviewed-identity-heading-fallback.ts";
import {specLabel} from "../src/lib/catalog.ts";
const locales=["tr","zh","hi","pt-br","fr","de","ru","ja","es"];
test("every reviewed stable-ID English display heading has a native fallback in all nine target languages",()=>{
 assert.equal(reviewedIdentityFallbackHeadings.length,96);
 assert.equal(new Set(reviewedIdentityFallbackHeadings).size,96);
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
