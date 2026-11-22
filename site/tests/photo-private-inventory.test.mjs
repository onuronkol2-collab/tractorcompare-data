import test from "node:test";
import assert from "node:assert/strict";
import {normalizePrivatePhotoResearchRows} from "../scripts/photo-private-inventory.mjs";
test("a private row marked published is still private research only",()=>{
 const original={brand:"Kubota",model:"M5",status:"published",tractor_id:"private-id",
   pageUrl:"https://tractorvs.com/tractors/fake/",publicPages:["https://tractorvs.com/tractors/fake/"]};
 const rows=normalizePrivatePhotoResearchRows([original]);
 assert.equal(rows[0].status,"draft");
 assert.equal(rows[0].pageUrl,null);
 assert.equal(Object.hasOwn(rows[0],"publicPages"),false);
 assert.equal(original.status,"published");
});
test("bad private inventory is rejected instead of being silently public",()=>{
 assert.throws(()=>normalizePrivatePhotoResearchRows({models:[]}),/JSON array/);
 assert.equal(normalizePrivatePhotoResearchRows([{brand:"A"},null,{brand:"B",model:"M"}]).length,1);
});
