import test from "node:test";import assert from "node:assert/strict";
import {compareFieldScenarios,serviceInterval,readShortlist,addShortlist} from "../src/lib/farm-extras.mjs";
import {farmExtrasText} from "../src/lib/farm-extras-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
test("same area comparison uses separate measured width, speed, fuel and other expenses",()=>{const a={width:3,speed:6,efficiency:75,fuel:8,other:0},b={...a,width:6,fuel:10};const x=compareFieldScenarios({area:100,unit:"decare",price:2},a,b);assert.ok(Math.abs(x.left.time-10/1.35)<1e-9);assert.equal(x.right.time,x.left.time/2);assert.ok(x.difference.litres<0);assert.throws(()=>compareFieldScenarios({area:0,unit:"ha",price:1},a,b));});
test("service interval arithmetic and invalid meter order",()=>{assert.deepEqual(serviceInterval(100,150,250),{next:350,remaining:200,overdue:0});assert.deepEqual(serviceInterval(100,400,250),{next:350,remaining:0,overdue:50});assert.throws(()=>serviceInterval(100,99,250));assert.throws(()=>serviceInterval(100,150,0));});
test("shortlist bounded unique published slug format",()=>{assert.deepEqual(addShortlist(["one"],"one"),["one"]);assert.throws(()=>addShortlist(Array.from({length:20},(_,i)=>"model-"+i),"extra"));assert.throws(()=>readShortlist(["https://evil.example"]));assert.throws(()=>readShortlist({}));});
test("all ten locale labels present",()=>{for(const lang of LOCALES)assert.ok(Object.values(farmExtrasText(lang)).every(v=>typeof v==="string"&&v.trim()));});
