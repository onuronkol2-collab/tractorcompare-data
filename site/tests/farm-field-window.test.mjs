import test from "node:test";
import assert from "node:assert/strict";
import {estimateFieldWindow} from "../src/lib/farm-fleet-planning.mjs";
test("working window distinguishes headroom from shortfall",()=>{
 assert.deepEqual(estimateFieldWindow(60,8,10),{workdays:7.5,requiredDailyHours:6,availableHours:80,remainingHours:20});
 assert.equal(estimateFieldWindow(60,8,5).remainingHours,-20);
 assert.equal(estimateFieldWindow(60,8,2).requiredDailyHours,30);
});
test("missing inputs remain unknown; invalid input fails closed",()=>{
 assert.deepEqual(estimateFieldWindow(60,null,5),{workdays:null,requiredDailyHours:12,availableHours:null,remainingHours:null});
 assert.equal(estimateFieldWindow(60,8,null).remainingHours,null);
 for(const v of [0,NaN,3661,undefined,"5"])assert.throws(()=>estimateFieldWindow(60,8,v));
 assert.throws(()=>estimateFieldWindow(60,25,5));
});
