import test from "node:test";
import assert from "node:assert/strict";
import {shaftPowerAtPoint,shaftTorqueAtPoint} from "../src/lib/shaft-power-calculator.mjs";
import {readFileSync} from "node:fs";
test("exact rotational power relationship and units",()=>{
 const v=shaftPowerAtPoint(400,1800);
 assert.ok(Math.abs(v.kw-75.398223686)<1e-8);
 assert.ok(v.ps>v.hp);
 assert.ok(Math.abs(shaftTorqueAtPoint(v.kw,1800)-400)<1e-9);
});
test("invalid and unrepresentable inputs are not silently zero",()=>{
 for(const v of [0,-1,NaN,Infinity,"400",undefined])assert.throws(()=>shaftPowerAtPoint(v,1800));
 assert.throws(()=>shaftPowerAtPoint(100,0));
 assert.throws(()=>shaftPowerAtPoint(Number.MIN_VALUE,Number.MIN_VALUE));
 assert.throws(()=>shaftTorqueAtPoint(100,Number.MIN_VALUE));
});
test("calculator appears only on existing power guide with explicit limitations",()=>{
 const parent=readFileSync(new URL("../src/components/TractorTechnicalDeepDive.astro",import.meta.url),"utf8");
 const tool=readFileSync(new URL("../src/components/ShaftPowerCalculator.astro",import.meta.url),"utf8");
 assert.match(parent,/hasPowerStandards && <ShaftPowerCalculator lang=\{lang\}/);
 assert.match(tool,/aynı çalışma noktasındaki/);
 assert.match(tool,/same shaft and operating point/);
 assert.match(tool,/hypothetical educational example/);
 assert.doesNotMatch(tool,/localStorage|fetch\(|innerHTML/);
});
