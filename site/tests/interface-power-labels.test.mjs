import test from "node:test";
import assert from "node:assert/strict";
import {CATALOG_FACET_COPY,matchesCatalogueFacet} from "../src/lib/catalog-facets.mjs";
test("numeric power categories are labelled HP in all ten locales",()=>{
 for(const [locale,copy] of Object.entries(CATALOG_FACET_COPY)){
  for(const key of ["up50","p51","p101","over150"]){
   assert.match(copy[key],/\bHP\b/,locale+":"+key);
  }
 }
});
test("HP filter boundaries retain exact exclusive/inclusive semantics",()=>{
 for(const [value,expected] of [[50,"up50"],[50.01,"p51"],[100,"p51"],[100.01,"p101"],[150,"p101"],[150.01,"over150"]]){
  assert.deepEqual(["up50","p51","p101","over150"].filter(power=>matchesCatalogueFacet({power:value},{power})),[expected]);
 }
 for(const value of [null,undefined,"",0,-1,NaN]){
  assert.equal(["up50","p51","p101","over150"].some(power=>matchesCatalogueFacet({power:value},{power})),false);
 }
});
