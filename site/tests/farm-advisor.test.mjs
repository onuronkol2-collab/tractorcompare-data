import test from "node:test";
import assert from "node:assert/strict";
import {
  AREA_SQM, COUNTRY_AREA_UNITS, areaToHectares, horsepowerScreening,
  recommendTractors, supportedMarketCountry,
} from "../src/lib/farm-advisor.ts";
import { MARKET_PRICES, matchingPrice, formatMarketPriceRange } from "../src/lib/market-prices.ts";
import { advisorText, advisorTranslationIssues } from "../src/lib/advisor-i18n.ts";
import { LOCALES } from "../src/lib/locales.ts";

test("area conversions are exact for metric, acre, Chinese mu, Japanese tan", () => {
  assert.equal(areaToHectares(50,"dekar"), 5);
  assert.equal(areaToHectares(50000,"m2"), 5);
  assert.equal(areaToHectares(5,"hectare"), 5);
  assert.ok(Math.abs(areaToHectares(1,"acre")-0.40468564224)<1e-11);
  assert.ok(Math.abs(areaToHectares(15,"mu")-1)<1e-11);
  assert.ok(Math.abs(areaToHectares(1,"tan")-0.099173553719)<1e-12);
  assert.equal(COUNTRY_AREA_UNITS.TR,"dekar");
  assert.equal(COUNTRY_AREA_UNITS.CN,"mu");
  assert.equal(COUNTRY_AREA_UNITS.JP,"tan");
  assert.equal(COUNTRY_AREA_UNITS.IN,"acre");
  assert.equal(supportedMarketCountry("ZZ"),null);
  assert.equal(AREA_SQM.bigha,undefined); // Varies by state, never guess.
  assert.throws(()=>areaToHectares(0,"hectare"));
  assert.throws(()=>areaToHectares(-3,"dekar"));
});

const farm = {
  country:"TR", hectares:5, crop:"grain", soil:"medium",
  terrain:"flat", operation:"general", implement:"medium",
  trailer:"none", annualHours:200, budget:null, condition:"either",
  servicePriority:true,
};

test("workload changes initial power screening for the same field size",()=>{
  const base=horsepowerScreening(farm);
  const hard=horsepowerScreening({...farm,terrain:"steep",soil:"heavy",implement:"heavy",trailer:"heavy"});
  assert.ok(hard.min>base.min);
  assert.ok(hard.max>base.max);
  assert.ok(base.max>base.min);
  assert.throws(()=>horsepowerScreening({...farm,annualHours:10000}));
});

const tractors = [
  {tractor_id:"tr",slug:"nh",brand_name:"New Holland",model_name:"T5.110",
    variant:"Bluemaster MasterDrive",market:"Turkey",model_year:2026,horsepower:110},
  {tractor_id:"in",slug:"swaraj",brand_name:"Swaraj",model_name:"735 FE",
    variant:null,market:"India",model_year:null,horsepower:40},
  {tractor_id:"unknown",slug:"unknown",brand_name:"Example",model_name:"A",
    variant:null,market:"global",model_year:null,horsepower:48},
  {tractor_id:"not-power",slug:"np",brand_name:"Example",model_name:"B",
    variant:null,market:"global",model_year:null,horsepower:null},
];

test("official price never leaks across variants, markets or countries",()=>{
  const found=matchingPrice(tractors[0],"TR");
  assert.equal(found?.min,6464891);
  assert.equal(found?.max,6464891);
  assert.equal(found?.taxBasis,"included");
  assert.equal(matchingPrice(tractors[0],"US"),null);
  assert.equal(matchingPrice({...tractors[0],variant:"Bluemaster"},"TR"),null);
  assert.equal(matchingPrice({...tractors[0],market:"South Africa"},"TR"),null);
  assert.equal(matchingPrice({...tractors[0],model_year:2025},"TR"),null);
  assert.ok(formatMarketPriceRange(found,"tr-TR").includes("6.464.891"));
  assert.equal(MARKET_PRICES.every(p=>p.sourceUrl.startsWith("https:")),true);
});

test("Indian aggregator price is only for same known model",()=>{
  const found=matchingPrice(tractors[1],"IN");
  assert.equal(found?.min,583000);
  assert.equal(found?.max,618000);
  assert.equal(found?.quoteKind,"aggregator_range");
  assert.equal(matchingPrice({...tractors[1],variant:"4WD deluxe"},"IN"),null);
});

test("published catalog input is respected, foreign market records excluded",()=>{
  const choices=recommendTractors(tractors,farm,5);
  assert.equal(choices.some(m=>m.tractor.tractor_id==="in"),false);
  assert.equal(choices.some(m=>m.tractor.tractor_id==="not-power"),false);
  assert.equal(choices.some(m=>m.tractor.tractor_id==="unknown"),true);
  const withBudget=recommendTractors(tractors,{...farm,budget:1000000},5);
  assert.equal(withBudget.find(m=>m.tractor.tractor_id==="tr")?.priceFit,"over_budget");
  const overseas=recommendTractors(tractors,{...farm,country:"US"},5);
  assert.equal(overseas.some(m=>m.tractor.tractor_id==="tr"),false);
});

test("all advisor labels exist in all ten supported languages",()=>{
  assert.deepEqual(advisorTranslationIssues(),[]);
  for (const lang of LOCALES) {
    for(const key of ["nav","heading","country","area","budget","priceUnknown","guideWarning","bigha"]){
      assert.ok(advisorText(lang,key).length>1);
    }
  }
});
