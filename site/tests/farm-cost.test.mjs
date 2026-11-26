import {test} from "node:test";
import assert from "node:assert/strict";
import {farmCost} from "../src/lib/farm-cost.mjs";
import {farmCostText} from "../src/lib/farm-cost-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
const base={area:10,width:3,speed:6,efficiency:75,fuel:8,price:2,annualHours:200,other:4,fixed:100};
test("field capacity, time, hourly/decare/hectare fuel and annual costs use consistent units",()=>{
 const r=farmCost(base);
 assert.equal(r.capacity,1.35);
 assert.ok(Math.abs(r.time-10/1.35)<1e-9);
 assert.equal(r.hourly,16);
 assert.equal(r.perDekar,r.perHa/10);
 assert.ok(Math.abs(r.fieldCost-r.perHa*10)<1e-9);
 assert.equal(r.annualFuel,3200);
 assert.equal(r.annualTotal,4100);
});
test("zero price, fuel, hours and nonzero fixed costs remain legitimate",()=>{
 const r=farmCost({...base,fuel:0,price:0,annualHours:0});
 assert.equal(r.fieldCost,0);assert.equal(r.annualTotal,100);
});
test("invalid input fails closed rather than yielding infinity or NaN",()=>{
 for(const patch of [{area:0},{width:0},{speed:0},{efficiency:101},{efficiency:0},{fuel:-1},{price:Infinity},{annualHours:8761},{other:NaN},{fixed:"12"},{area:undefined}])assert.throws(()=>farmCost({...base,...patch}),RangeError);
});
test("all ten locales have complete distinct human-readable calculator strings",()=>{
 for(const lang of LOCALES){
  const copy=farmCostText(lang);
  assert.equal(Object.keys(copy).length,28);
  assert.ok(Object.values(copy).every(value=>typeof value==="string"&&value.trim().length>0));
 }
 assert.equal(new Set(LOCALES.map(lang=>farmCostText(lang).title)).size,10);
});
