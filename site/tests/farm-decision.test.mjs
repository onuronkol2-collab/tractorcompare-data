import {test} from "node:test";import assert from "node:assert/strict";
import {ownershipCost,convertFarmUnit,implementScreen,validateMaintenanceNote,readMaintenanceHistory,appendMaintenanceRecord,maintenanceTotals} from "../src/lib/farm-decision.mjs";
import {farmDecisionText} from "../src/lib/farm-decision-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
const base={purchase:50000,deposit:10000,rate:5,months:60,resale:20000,years:10,rent:50,hours:200,operating:20};
test("fixed monthly amortization, zero interest, annual depreciation and comparable rent",()=>{
 const x=ownershipCost(base);assert.ok(Math.abs(x.payment-754.84934576)<0.01);assert.equal(x.depreciation,3000);assert.equal(x.ownership,7000);assert.equal(x.rental,10000);assert.equal(ownershipCost({...base,rate:0}).interest,0);
 for(const patch of [{deposit:50001},{resale:50001},{months:1.5},{rate:-1},{years:0},{hours:8761},{rent:Infinity}])assert.throws(()=>ownershipCost({...base,...patch}),RangeError);
});
test("mechanical HP is not PS and area conversion is reversible",()=>{
 assert.ok(Math.abs(convertFarmUnit(100,"HP").kW-74.569987)<1e-5);assert.equal(convertFarmUnit(1,"ha").decare,10);assert.ok(Math.abs(convertFarmUnit(convertFarmUnit(1,"acre").ha,"ha").acre-1)<1e-12);assert.throws(()=>convertFarmUnit(1,"constructor"));
});
test("equipment fails closed on missing and invalid values; numerical match is not certification",()=>{
 assert.equal(implementScreen([[30,25],[40,40],[1500,1000]]),"matched");assert.equal(implementScreen([[30,35],[null,40],[1500,1000]]),"insufficient");assert.equal(implementScreen([[null,25],[40,40],[1500,1000]]),"unknown");assert.equal(implementScreen([[NaN,0],[40,40],[1500,1000]]),"unknown");
});
test("local note is explicit bounded numeric data and strips extra properties",()=>{assert.deepEqual(validateMaintenanceNote({model:"  A  ",meter:10,fuel:3,cost:20,extra:"secret"}),{model:"A",meter:10,fuel:3,cost:20});assert.throws(()=>validateMaintenanceNote({model:"",meter:0,fuel:0,cost:0}));assert.throws(()=>validateMaintenanceNote({model:"A",meter:-1,fuel:0,cost:0}));});
test("complete localized copy for every supported language",()=>{for(const lang of LOCALES){const copy=farmDecisionText(lang);assert.equal(Object.keys(copy).length,70);assert.ok(Object.values(copy).every(x=>typeof x==="string"&&x.trim()));}assert.equal(new Set(LOCALES.map(l=>farmDecisionText(l).finance)).size,10);});

test("break-even is positive only when rent exceeds running cost and depreciation is positive",()=>{assert.equal(ownershipCost(base).breakEven,100);assert.equal(ownershipCost({...base,rent:20}).breakEven,null);assert.equal(ownershipCost({...base,resale:50000}).breakEven,null);});
test("maintenance history preserves legacy notes, appends, totals, rejects corrupt and oversized history",()=>{const note={model:"A",meter:10,fuel:3,cost:20};const old=readMaintenanceHistory(note);const next=appendMaintenanceRecord(old,{model:"B",meter:20,fuel:4,cost:30});assert.deepEqual(maintenanceTotals(readMaintenanceHistory(next)),{count:2,fuel:7,cost:50});assert.equal(old.length,1);assert.deepEqual(readMaintenanceHistory(null),[]);assert.throws(()=>appendMaintenanceRecord(Array(200).fill(note),note));assert.throws(()=>readMaintenanceHistory({version:2,records:[{...note,fuel:-1}]}));assert.throws(()=>readMaintenanceHistory({version:2,records:Array(201).fill(note)}));});
