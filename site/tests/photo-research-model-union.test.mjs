import test from "node:test";
import assert from "node:assert/strict";
import {mergePhotoResearchModels,photoResearchKey}
  from "../scripts/photo-research-model-union.mjs";
const pub=(brand,model)=>({brand,model,status:"published",
  pageUrl:"https://tractorvs.com/tractors/test/",tractor_id:"public-verified-id"});
test("newly published models absent in historical archive still get brand search",()=>{
 const historical=[{brand:"Zetor",model:"MAJOR"},{brand:"Kubota",model:"M5"}];
 const published=[pub("Zetor","MAJOR"),pub("Zetor","PROXIMA"),pub("Steyr","4085")];
 const merged=mergePhotoResearchModels(historical,published);
 assert.equal(merged.historical.size,2);
 assert.equal(merged.publicModels.size,3);
 assert.equal(merged.unique.size,4);
 assert.equal(merged.unique.has(photoResearchKey({brand:"Steyr",model:"4085"})),true);
});
test("variant and duplicate names are deduped only for brand search, not published page identity",()=>{
 const merged=mergePhotoResearchModels([{brand:"Zetor",model:"PROXIMA"}],
  [pub("Zetor","PROXIMA"),pub("Zetor","PROXIMA"),pub("Zetor","Major")]);
 assert.equal(merged.historical.size,1);
 assert.equal(merged.publicModels.size,2);
 assert.equal(merged.unique.size,2);
});
test("private or incomplete public row must not be promoted into source research",()=>{
 for(const row of [pub("X",""),{...pub("X","M"),status:"draft"},
   {...pub("X","M"),pageUrl:null},{...pub("X","M"),tractor_id:null},
   {...pub("X","M"),error:"HTTP 429"}])
   assert.throws(()=>mergePhotoResearchModels([{brand:"Zetor",model:"MAJOR"}],[row]),/Published model identity/);
});
