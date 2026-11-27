import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {convertPower,POWER_FACTOR_KW,POWER_SOURCE} from "../src/lib/power-unit-converter.mjs";
import {POWER_UNIT_COPY} from "../src/lib/power-unit-copy.ts";
import {LOCALES} from "../src/lib/locales.ts";
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8);
test("mechanical and metric horsepower use separate NIST factors",()=>{
 near(convertPower(100,"hp").kw,74.56999);
 near(convertPower(100,"ps").kw,73.54988);
 near(convertPower(100,"kw").hp,100/POWER_FACTOR_KW.hp);
 near(convertPower(100,"kw").ps,100/POWER_FACTOR_KW.ps);
 assert.notEqual(convertPower(100,"hp").kw,convertPower(100,"ps").kw);
});
test("all supported units round-trip without early rounding",()=>{
 for(const unit of ["kw","hp","ps"]){const start=123.456;const out=convertPower(start,unit);near(convertPower(out.kw,"kw")[unit],start);}
 assert.deepEqual(convertPower(0,"hp"),{kw:0,hp:0,ps:0});
});
test("invalid, unsupported and out-of-range inputs do not yield misleading output",()=>{
 for(const value of [NaN,Infinity,-1,1000001,"100",null,undefined,true,{}])assert.equal(convertPower(value,"kw"),null);
 for(const unit of ["HP","constructor","__proto__","pto","",null])assert.equal(convertPower(100,unit),null);
});
test("all ten languages contain the complete converter and measurement warning",()=>{
 assert.deepEqual(Object.keys(POWER_UNIT_COPY).sort(),[...LOCALES].sort());
 for(const copy of Object.values(POWER_UNIT_COPY)){
  assert.equal(Object.keys(copy).length,11);assert.ok(Object.values(copy).every(v=>typeof v==="string"&&v.trim()));
  assert.match(copy.note,/0[.,]7456999/);assert.match(copy.note,/0[.,]7354988/);
 }
 assert.match(POWER_SOURCE,/^https:\/\/www\.nist\.gov\//);
});
test("converter is reachable within existing guide with accessible localized controls",()=>{
 const guide=readFileSync(new URL("../src/components/TractorSelectionGuide.astro",import.meta.url),"utf8");
 const component=readFileSync(new URL("../src/components/PowerUnitConverter.astro",import.meta.url),"utf8");
 assert.match(guide,/<PowerUnitConverter lang=\{lang\} \/>/);
 assert.match(guide,/availableLocales=\{LOCALES\}/);
 assert.match(component,/aria-live="polite"/);assert.match(component,/valueAsNumber/);
 assert.match(component,/<fieldset data-power-controls disabled>/);assert.match(component,/<noscript>/);
 assert.match(component,/textContent/);assert.doesNotMatch(component,/innerHTML|fetch\(|localStorage|sessionStorage/);
});
