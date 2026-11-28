import test from "node:test";
import assert from "node:assert/strict";
import {areaToHectares,horsepowerScreening,recommendTractors} from "../src/lib/farm-advisor.ts";
import {selectAdvisorFacts} from "../src/lib/advisor-evidence.ts";
import {multiComparisonRows,multiComparisonShareUrl} from "../src/lib/multi-comparison.mjs";
import {investmentScenarios} from "../src/lib/farm-investment-scenarios.mjs";
const input={country:"TR",hectares:5,crop:"grain",soil:"medium",terrain:"flat",operation:"general",implement:"medium",trailer:"none",annualHours:200,budget:null,condition:"either",servicePriority:true};
test("invalid runtime farm options fail closed",()=>{
 for(const unit of ["constructor","toString","__proto__"])assert.throws(()=>areaToHectares(1,unit));
 assert.throws(()=>areaToHectares(1000001,"hectare"));
 for(const invalid of [{country:"ZZ"},{crop:"unknown"},{budget:NaN},{budget:-1},{implements:["constructor"]},{implements:"plow"}])assert.throws(()=>horsepowerScreening({...input,...invalid}));
 const model={tractor_id:"x",slug:"x",brand_name:"Fixture",model_name:"X",variant:null,market:"constructor",model_year:null,horsepower:55};
 assert.deepEqual(recommendTractors([model],input),[]);
 assert.deepEqual(selectAdvisorFacts([{kind:"transmission",value:"x"}],input,0),[]);
});
const spec=(key,value,context=null)=>({key,label:key,value,unit:"kW",context,rpm:null,source:null,notice:null});
const models=[{id:"a",specs:[spec("pto","50"),spec("engine","60")]},{id:"b",specs:[spec("pto","55"),spec("engine","60")]},{id:"c",specs:[spec("pto","50","rated")]},{id:"d",specs:[spec("pto","50")]}];
test("three or four model union preserves missing and condition-specific values",()=>{
 const out=multiComparisonRows(models);
 assert.equal(out.total,2);assert.equal(out.shared,1);assert.equal(out.different,1);
 assert.deepEqual(out.rows.find(r=>r.key==="engine").cells.slice(2),[[],[]]);
 assert.equal(multiComparisonRows(models,"different").rows[0].key,"pto");
 assert.throws(()=>multiComparisonRows([models[0],models[0]]));
 assert.throws(()=>multiComparisonRows([{id:"x",specs:[null]},models[0]]));
});
test("multi share strips tracking and rejects wrong paths, origins and duplicates",()=>{
 assert.equal(multiComparisonShareUrl("https://tractorvs.com/tr/compare/?utm_source=x#x",["a","b","c"],"shared"),"https://tractorvs.com/tr/compare/?left=a&right=b&third=c&view=shared");
 assert.equal(multiComparisonShareUrl("https://tractorvs.com.evil.test/compare/",["a","b"]),null);
 assert.equal(multiComparisonShareUrl("https://tractorvs.com/other/",["a","b"]),null);
 assert.equal(multiComparisonShareUrl("https://tractorvs.com/compare/",["a","a"]),null);
 assert.equal(multiComparisonShareUrl("https://tractorvs.com/compare/",["a",,"c"]),null);
 assert.throws(()=>multiComparisonRows([{id:"a",specs:Array(2)},models[1]]));
});
test("investment avoids sparse resale and infinite per-unit output",()=>{
 const v={price:100,down:100,annualRate:0,termMonths:1,annualHours:Number.MIN_VALUE,annualHectares:Number.MIN_VALUE,fuelPerHour:0,fuelPrice:0,maintenancePerHour:0,otherPerHour:0,annualFixed:0,rentalPerHour:null,resale:[0,0,0,0]};
 assert.equal(investmentScenarios(v).scenarios[0].perHour,null);
 assert.equal(investmentScenarios(v).scenarios[0].perHectare,null);
 assert.throws(()=>investmentScenarios({...v,resale:Array(4)}));
 const tiny=investmentScenarios({...v,down:0,annualRate:Number.MIN_VALUE,termMonths:12});
 assert.ok(Number.isFinite(tiny.monthlyPayment));
 assert.ok(Number.isFinite(tiny.scenarios[0].total));
});
