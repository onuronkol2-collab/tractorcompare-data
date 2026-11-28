import test from "node:test";
import assert from "node:assert/strict";
import {investmentScenarios} from "../src/lib/farm-investment-scenarios.mjs";
const input={price:120000,down:0,annualRate:0,termMonths:24,annualHours:100,annualHectares:50,fuelPerHour:5,fuelPrice:2,maintenancePerHour:3,otherPerHour:0,annualFixed:100,rentalPerHour:100,resale:[90000,70000,null,30000]};
test("fuel sensitivity changes only entered fuel expenditure",()=>{
 const out=investmentScenarios(input);
 assert.equal(out.scenarios[0].fuelPriceLow,31200);
 assert.equal(out.scenarios[0].fuelPriceHigh,31600);
 assert.equal(out.scenarios[1].fuelPriceHigh-out.scenarios[1].total,600);
 assert.equal(out.scenarios[2].fuelPriceHigh,null);
 assert.equal(out.scenarios[2].fuelPriceLow,null);
});
test("zero fuel price or usage has no sensitivity effect",()=>{
 for(const override of [{fuelPrice:0},{annualHours:0},{fuelPerHour:0}]){
  const s=investmentScenarios({...input,...override}).scenarios[0];
  assert.equal(s.fuelPriceLow,s.total);
  assert.equal(s.fuelPriceHigh,s.total);
 }
});
test("financing does not change across fuel scenarios",()=>{
 const a=investmentScenarios({...input,annualRate:12}).scenarios[0];
 const b=investmentScenarios({...input,annualRate:12,fuelPrice:2.4}).scenarios[0];
 assert.ok(Math.abs(a.fuelPriceHigh-b.total)<1e-7);
 assert.equal(a.loanBalance,b.loanBalance);
});
