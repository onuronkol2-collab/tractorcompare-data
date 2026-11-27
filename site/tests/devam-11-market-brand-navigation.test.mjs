import test from "node:test";
import assert from "node:assert/strict";
import {marketDisplayName,brandCountryName} from "../src/lib/market-display.ts";
import {LOCALES} from "../src/lib/locales.ts";
import {listedBrandCollections,verifiedModelSources} from "../src/lib/brand-discovery-pilot.mjs";
import {nextComboboxOption} from "../src/lib/combobox-navigation.mjs";

test("exact regional labels localize in all ten languages; descriptive evidence is unchanged",()=>{
 for(const locale of LOCALES){
  assert.ok(marketDisplayName("Romania",locale));
  assert.equal(marketDisplayName("Europe / UK 2025 manufacturer brochure",locale),"Europe / UK 2025 manufacturer brochure");
  assert.equal(marketDisplayName("North America",locale),"North America");
 }
 assert.equal(marketDisplayName("Romania","tr"),"Romanya");
 assert.equal(marketDisplayName("France","de"),"Frankreich");
 assert.equal(brandCountryName("France","tr"),"Fransa");
 assert.equal(marketDisplayName(null,"tr"),null);
});
test("brand sources reject credential-bearing URLs and invalid protocols",()=>{
 const model={specifications:["https://user:pass@example.com/a","javascript:alert(1)","https://example.com/a","https://example.com/a"].map(source_url=>({source_url,verified_at:"2026-11-27",source_publisher:123}))};
 assert.deepEqual(verifiedModelSources(model),[{url:"https://example.com/a",publisher:null}]);
 assert.deepEqual(verifiedModelSources({specifications:{}}),[]);
});
test("brand collection excludes invalid link identities and drafts",()=>{
 const models=Array.from({length:10},(_,i)=>({brand_name:"Valtra",tractor_id:String(i),slug:"valtra-model-"+i,model_name:"Model "+i,specifications:[]}));
 const bad=[{...models[0],tractor_id:"bad-1",slug:"../other"},{...models[0],tractor_id:"bad-2",slug:"valtra-bad",model_name:null},{...models[0],tractor_id:"bad-3",slug:"valtra-draft",status:"draft"}];
 assert.equal(listedBrandCollections([...models,...bad])[0].models.length,10);
});
test("combobox wraps correctly without propagating invalid index state",()=>{
 assert.equal(nextComboboxOption(0,3,-1),2);
 assert.equal(nextComboboxOption(2,3,1),0);
 assert.equal(nextComboboxOption(NaN,3,1),0);
 assert.equal(nextComboboxOption(-1,3,-1),2);
 assert.equal(nextComboboxOption(1,0,1),-1);
 assert.equal(nextComboboxOption(1,3,0),-1);
 assert.equal(nextComboboxOption(1,Infinity,1),-1);
});
