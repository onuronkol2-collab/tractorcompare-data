import test from "node:test";
import assert from "node:assert/strict";
import {disambiguateMarketLabels} from "../src/lib/market-choice-labels.mjs";
test("different recorded market keys remain distinguishable without inferring aliases",()=>{
 const choices=[{value:"Europe",label:"Avrupa"},{value:"EU",label:"Avrupa"},{value:"Avrupa",label:"Avrupa"},{value:"India",label:"Hindistan"}];
 const result=disambiguateMarketLabels(choices);
 assert.deepEqual(result.map(x=>x.value),choices.map(x=>x.value));
 assert.deepEqual(result.map(x=>x.label),["Avrupa (Europe)","Avrupa (EU)","Avrupa","Hindistan"]);
 assert.equal(choices[0].label,"Avrupa");
 assert.deepEqual(disambiguateMarketLabels([]),[]);
});
