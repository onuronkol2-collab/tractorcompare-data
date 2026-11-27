import test from "node:test";import assert from "node:assert/strict";
import {compareFieldScenarios,serviceInterval,readShortlist,addShortlist} from "../src/lib/farm-extras.mjs";
import {farmExtrasText} from "../src/lib/farm-extras-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
test("same area comparison uses separate measured width, speed, fuel and other expenses",()=>{const a={width:3,speed:6,efficiency:75,fuel:8,other:0},b={...a,width:6,fuel:10};const x=compareFieldScenarios({area:100,unit:"decare",price:2},a,b);assert.ok(Math.abs(x.left.time-10/1.35)<1e-9);assert.equal(x.right.time,x.left.time/2);assert.ok(x.difference.litres<0);assert.throws(()=>compareFieldScenarios({area:0,unit:"ha",price:1},a,b));});
test("service interval arithmetic and invalid meter order",()=>{assert.deepEqual(serviceInterval(100,150,250),{next:350,remaining:200,overdue:0});assert.deepEqual(serviceInterval(100,400,250),{next:350,remaining:0,overdue:50});assert.throws(()=>serviceInterval(100,99,250));assert.throws(()=>serviceInterval(100,150,0));});
test("shortlist bounded unique published slug format",()=>{assert.deepEqual(addShortlist(["one"],"one"),["one"]);assert.throws(()=>addShortlist(Array.from({length:20},(_,i)=>"model-"+i),"extra"));assert.throws(()=>readShortlist(["https://evil.example"]));assert.throws(()=>readShortlist({}));});
test("all ten locale labels present",()=>{for(const lang of LOCALES)assert.ok(Object.values(farmExtrasText(lang)).every(v=>typeof v==="string"&&v.trim()));});


test("scenario comparison includes normalized fuel and costs without assuming model consumption",()=>{
 const a={width:2,speed:5,efficiency:100,fuel:8,other:4};
 const b={...a,width:4,fuel:12};
 const x=compareFieldScenarios({area:100,unit:"decare",price:2},a,b);
 assert.equal(x.left.capacity,1);assert.equal(x.right.capacity,2);
 assert.equal(x.left.fuelPerHa,8);assert.equal(x.right.fuelPerHa,6);assert.equal(x.difference.fuelPerHa,-2);
 assert.equal(x.left.fuelPerDecare,.8);assert.equal(x.right.fuelPerDecare,.6);
 assert.equal(x.left.operatingPerHa,20);assert.equal(x.right.operatingPerHa,14);
 assert.equal(x.left.operatingPerDecare,2);assert.equal(x.right.operatingPerDecare,1.4);
 assert.equal(x.difference.capacity,1);assert.equal(x.difference.fieldCost,-40);
 const equal=compareFieldScenarios({area:10,unit:"ha",price:0},a,a);
 assert.ok(Object.values(equal.difference).every(v=>v===0));
 const zero=compareFieldScenarios({area:10,unit:"ha",price:0},{...a,fuel:0,other:0},b);
 assert.equal(zero.left.fuelPerHa,0);assert.equal(zero.left.operatingPerHa,0);
});
test("scenario density labels exist in ten languages",async()=>{
 const {farmScenarioDensityText}=await import("../src/lib/farm-extras-i18n.ts");
 for(const lang of LOCALES)assert.equal(Object.values(farmScenarioDensityText(lang)).filter(v=>typeof v==="string"&&v.trim()).length,4);
});


test("daily work window compares field area and fractional workdays with no hidden default",()=>{
 const a={width:2,speed:5,efficiency:100,fuel:8,other:4},b={...a,width:4};
 const shared={area:160,unit:"decare",price:2};
 const x=compareFieldScenarios({...shared,dailyHours:4},a,b);
 assert.equal(x.left.dailyAreaHa,4);assert.equal(x.right.dailyAreaHa,8);
 assert.equal(x.left.dailyAreaDecare,40);assert.equal(x.right.dailyAreaDecare,80);
 assert.equal(x.left.equivalentDays,4);assert.equal(x.right.equivalentDays,2);
 assert.equal(x.difference.equivalentDays,-2);
 assert.equal(compareFieldScenarios({...shared,dailyHours:8},a,b).left.equivalentDays,2);
 assert.equal(compareFieldScenarios({...shared,dailyHours:24},a,b).left.dailyAreaHa,24);
 const prior=compareFieldScenarios(shared,a,b);
 assert.ok(!("dailyAreaHa" in prior.left));
 assert.equal(x.left.time,prior.left.time);assert.equal(x.left.fieldCost,prior.left.fieldCost);
 for(const dailyHours of [0,-1,25,NaN,Infinity,"4",null,.001])assert.throws(()=>compareFieldScenarios({...shared,dailyHours},a,b),RangeError);
});
test("daily window labels and scope limitations are supplied in all ten languages",async()=>{
 const {farmScenarioWindowText}=await import("../src/lib/farm-extras-i18n.ts");
 for(const lang of LOCALES)assert.equal(Object.values(farmScenarioWindowText(lang)).filter(v=>typeof v==="string"&&v.trim()).length,6);
});


test("server-rendered worked scenario distinguishes hourly and area consumption",async()=>{
 const {farmScenarioExample,FARM_SCENARIO_EXAMPLE_COPY}=await import("../src/lib/farm-scenario-example.ts");
 const {readFileSync}=await import("node:fs");
 const {a,b,result}=farmScenarioExample();
 assert.ok(b.fuel>a.fuel);
 assert.equal(result.left.capacity,.8);assert.equal(result.right.capacity,1.6);
 assert.equal(result.left.time,10);assert.equal(result.right.time,5);
 assert.equal(result.left.litres,80);assert.equal(result.right.litres,60);
 assert.equal(result.left.fuelPerHa,10);assert.equal(result.right.fuelPerHa,7.5);
 assert.equal(result.left.equivalentDays,2);assert.equal(result.right.equivalentDays,1);
 for(const lang of LOCALES)assert.equal(FARM_SCENARIO_EXAMPLE_COPY[lang].filter(v=>v.trim()).length,3);
 const view=readFileSync(new URL("../src/components/FarmScenarioTools.astro",import.meta.url),"utf8");
 assert.match(view,/exampleRows\.map/);
 assert.match(view,/aria-labelledby="scenario-worked-heading"/);
});
