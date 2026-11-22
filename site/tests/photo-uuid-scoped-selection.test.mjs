import test from "node:test";
import assert from "node:assert/strict";
import {photoMatchesTractor,tractorPhotos} from "../src/lib/tractor-photos.ts";

const TARGET="458be7b8-f6b8-4319-b264-dc6c7cc36ae7";
const F50="e5dd1074-88ae-4293-8748-19c57de60088";
const F50CN="5d1360a7-1494-44b9-9728-93de291ab082";
const foto={brand:"TYM",model:"T3048",tractorId:TARGET};

test("licensed variant photograph matches only exact published tractor UUID",()=>{
  assert.equal(photoMatchesTractor(foto,{brand_name:"TYM",model_name:"T3048",tractor_id:TARGET}),true);
  for(const id of [F50,F50CN,undefined]){
    assert.equal(photoMatchesTractor(foto,{brand_name:"TYM",model_name:"T3048",tractor_id:id}),false);
  }
  assert.equal(photoMatchesTractor(foto,{brand_name:"TYM",model_name:"T4048",tractor_id:TARGET}),false);
  assert.equal(photoMatchesTractor(foto,{brand_name:"Other Brand",model_name:"T3048",tractor_id:TARGET}),false);
});

test("legacy model-level photos remain available across published variants",()=>{
  const photo={brand:"Zetor",model:"PROXIMA"};
  assert.equal(photoMatchesTractor(photo,{brand_name:"Zetor",model_name:"PROXIMA",tractor_id:"a"}),true);
  assert.equal(photoMatchesTractor(photo,{brand_name:"Zetor",model_name:"PROXIMA"}),true);
  assert.equal(photoMatchesTractor(photo,{brand_name:"Zetor",model_name:"PROXIMA",tractor_id:"b"}),true);
  assert.equal(photoMatchesTractor(photo,{brand_name:"Zetor",model_name:"PROXIMA POWER 120"}),false);
});

test("released F50CHN photos show only for exact UUID and never sibling T3048 variants",()=>{
  assert.equal(tractorPhotos({brand_name:"TYM",model_name:"T3048",tractor_id:TARGET}).length,3);
  for(const id of [F50,F50CN,undefined])
    assert.equal(tractorPhotos({brand_name:"TYM",model_name:"T3048",tractor_id:id}).length,0);
  assert.equal(tractorPhotos({brand_name:"TYM",model_name:"T3048",tractor_id:"12d51778-7e30-46ac-9428-ce672a4bf4a0"}).length,0);
});
