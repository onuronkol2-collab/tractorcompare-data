import test from "node:test";
import assert from "node:assert/strict";
import {investmentScenarios} from "../src/lib/farm-investment-scenarios.mjs";
import {planSequentialFieldWork} from "../src/lib/farm-fleet-planning.mjs";
import {compareIndependentMeasurements} from "../src/lib/independent-measurement-comparison.mjs";
const investment={price:120000,down:0,annualRate:0,termMonths:24,annualHours:100,annualHectares:50,fuelPerHour:5,fuelPrice:2,maintenancePerHour:3,otherPerHour:0,annualFixed:100,rentalPerHour:100,resale:[90000,70000,null,30000]};
test("ownership horizon includes remaining principal exactly once",()=>{
 const out=investmentScenarios(investment);
 assert.equal(out.monthlyPayment,5000);
 assert.equal(out.scenarios[0].loanBalance,60000);
 assert.equal(out.scenarios[0].total,31400);
 assert.equal(out.scenarios[0].perHour,314);
 assert.equal(out.scenarios[1].loanBalance,0);
 assert.equal(out.scenarios[2].total,null);
});
test("interest and missing denominators are separate",()=>{
 const out=investmentScenarios({...investment,annualRate:12,annualHours:0,annualHectares:null,rentalPerHour:null});
 assert.ok(out.scenarios[0].interestPaid>0);
 assert.equal(out.scenarios[0].perHour,null);
 assert.equal(out.scenarios[0].perHectare,null);
 assert.equal(out.scenarios[0].rental,null);
 assert.throws(()=>investmentScenarios({...investment,annualHours:NaN}));
});
test("sequential passes use existing metric field arithmetic",()=>{
 const task={area:100,unit:"decare",passes:2,width:2,speed:5,efficiency:80,fuel:4,price:2,other:1};
 const out=planSequentialFieldWork([task,task]);
 assert.equal(out.totals.workedAreaHa,40);
 assert.equal(out.totals.hours,50);
 assert.equal(out.totals.litres,200);
 assert.equal(out.totals.operatingCost,450);
 assert.throws(()=>planSequentialFieldWork([{...task,passes:0}]));
});
const row={evidence:"independent_reviewed",metric:"pto_power_kw",value:100,modelId:"a",reportId:"r",reportLocator:"p. 3",protocol:"example",protocolVersion:"1",loadPoint:"rated",configuration:"standard",measurementBasis:"shaft",unit:"kW"};
test("measured comparisons fail closed on missing or unequal metadata",()=>{
 assert.deepEqual(compareIndependentMeasurements(row,{...row,modelId:"b",value:110}),{state:"matched_metadata",difference:10,percent:10});
 assert.equal(compareIndependentMeasurements(row,{...row,loadPoint:"partial"}).difference,null);
 assert.equal(compareIndependentMeasurements(row,{...row,evidence:"manufacturer"}).state,"insufficient_evidence");
 assert.equal(compareIndependentMeasurements(row,{...row,reportLocator:""}).state,"insufficient_evidence");
});
