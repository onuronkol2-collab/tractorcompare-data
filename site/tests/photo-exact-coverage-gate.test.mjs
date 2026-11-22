import test from "node:test";
import assert from "node:assert/strict";
import {verifyExactPublishedPhotoCoverage} from "../scripts/photo-exact-coverage-gate.mjs";
const record=(id,brand,model,page)=>({tractor_id:id,brand,model,
  pageUrl:"https://tractorvs.com/tractors/"+page+"/",status:"published"});
const inv=()=>[
  record("id-1","Zetor","MAJOR","major"),
  record("id-1","Zetor","MAJOR","major"),
  record("id-2","Zetor","PROXIMA","proxima"),
  record("id-3","Kubota","M5","kubota")
];
const pub=()=>({modelCount:3,errorCount:0,errors:[],models:[
  {brand:"Zetor",model:"MAJOR",photos:[]},
  {brand:"Zetor",model:"PROXIMA",photos:[]},
  {brand:"Kubota",model:"M5",photos:[]}
]});
const live=()=>({publicModelPages:4,modelSearches:3,models:[
  {tractor_id:"id-1",brand:"Zetor",model:"MAJOR",status:"published",
   publicPages:["https://tractorvs.com/tractors/major/","https://tractorvs.com/tractors/major/"],candidates:[]},
  {tractor_id:"id-2",brand:"Zetor",model:"PROXIMA",status:"published",
   publicPages:["https://tractorvs.com/tractors/proxima/"],candidates:[]},
  {tractor_id:"id-3",brand:"Kubota",model:"M5",status:"published",
   publicPages:["https://tractorvs.com/tractors/kubota/"],candidates:[]}
]});
test("every public identity, brand and sitemap page preserved including duplicate locale URLs",()=>{
 const r=verifyExactPublishedPhotoCoverage(inv(),pub(),live());
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.publicPageRows,4);
 assert.equal(r.modelIds,3);
 assert.equal(r.brandModelPairs,3);
});
test("silently omitted model fails despite still meeting minimum count",()=>{
 const l=live();l.models.splice(1,1);l.modelSearches=2;
 const r=verifyExactPublishedPhotoCoverage(inv(),pub(),l);
 assert.equal(r.ok,false);
 assert.ok(r.errors.some(s=>s.includes("silently missing")));
});
test("dropped, duplicate or mismatched URL cannot be hidden by the count",()=>{
 const l=live();l.models[0].publicPages.pop();
 assert.equal(verifyExactPublishedPhotoCoverage(inv(),pub(),l).ok,false);
 l.models[0].publicPages=["https://tractorvs.com/tractors/major/","https://tractorvs.com/tractors/other/"];
 assert.equal(verifyExactPublishedPhotoCoverage(inv(),pub(),l).ok,false);
});
test("private, changed or extra public model cannot be promoted",()=>{
 const l=live();l.models[2].tractor_id="secret-id";
 assert.equal(verifyExactPublishedPhotoCoverage(inv(),pub(),l).ok,false);
 l.models=live().models;l.models[1].status="draft";
 assert.equal(verifyExactPublishedPhotoCoverage(inv(),pub(),l).ok,false);
});
test("missing candidate brand, source error and duplicate evidence fail closed",()=>{
 const p=pub();p.models.pop();p.modelCount=2;
 assert.equal(verifyExactPublishedPhotoCoverage(inv(),p,live()).ok,false);
 p.models=pub().models;p.modelCount=3;p.errorCount=1;p.errors=[{error:"429"}];
 assert.equal(verifyExactPublishedPhotoCoverage(inv(),p,live()).ok,false);
 p.errorCount=0;p.errors=[];p.models[1]={...p.models[0]};
 assert.equal(verifyExactPublishedPhotoCoverage(inv(),p,live()).ok,false);
});
