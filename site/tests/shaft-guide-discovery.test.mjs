import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("power guide calculator deep link targets an existing heading and remains scoped",()=>{
 const guide=read("../src/components/TractorTechnicalDeepDive.astro");
 const shaft=read("../src/components/ShaftPowerCalculator.astro");
 assert.match(shaft,/id="shaft-title"/);
 assert.match(guide,/hasPowerStandards&&<a[^>]*href="#shaft-title"/);
 assert.match(guide,/hasPtoSafety&&<a[^\n]*tractor-engine-power-and-torque/);
 assert.match(guide,/hasPowerStandards && <ShaftPowerCalculator/);
});
