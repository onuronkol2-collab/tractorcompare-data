import test from "node:test";
import assert from "node:assert/strict";
import {indexArchivePhotoCandidates,archiveCandidatesForModel}
  from "../scripts/photo-archive-candidate-index.mjs";
const evidence=()=>({modelCount:2,errorCount:0,errors:[],models:[
 {brand:"Zetor",model:"MAJOR",photos:[{
   fileTitle:"File:Zetor Major tractor.jpg",photo:"https://upload.wikimedia.org/example.jpg",
   page:"https://commons.wikimedia.org/wiki/File:Zetor_Major_tractor.jpg",
   thumbnail:"https://upload.wikimedia.org/thumb.jpg",
   photographer:"Example attribution",license:"CC BY-SA 4.0",
   licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",width:1600,height:900
 }]},
 {brand:"Kubota",model:"M5-112",photos:[]}
]});
test("published exact model sees reusable licensed candidate without further network calls",()=>{
 const idx=indexArchivePhotoCandidates(evidence());
 const result=archiveCandidatesForModel(idx,{brand:"Zetor",model:"MAJOR"});
 assert.equal(result.matches,1);
 assert.equal(result.candidates[0].reviewStatus,"human_review_required");
 assert.equal(result.candidates[0].photographer,"Example attribution");
 assert.equal(archiveCandidatesForModel(idx,{brand:"Kubota",model:"M5-112"}).matches,0);
});
test("different brand or different model never receives misleading photo",()=>{
 const idx=indexArchivePhotoCandidates(evidence());
 assert.equal(archiveCandidatesForModel(idx,{brand:"Zetor",model:"PROXIMA"}).matches,0);
 assert.equal(archiveCandidatesForModel(idx,{brand:"SAME",model:"MAJOR"}).matches,0);
});
test("missing or errored archive evidence fails closed",()=>{
 for(const bad of [null,{modelCount:0,errorCount:0,errors:[],models:[]},
  {...evidence(),errorCount:1,errors:[{stage:"search",error:"429"}]},
  {...evidence(),modelCount:3},
  {...evidence(),models:[{brand:"Zetor",model:"Major"}]}]){
  assert.throws(()=>indexArchivePhotoCandidates(bad),/missing or incomplete|Malformed/);
 }
});
test("unlicensed and duplicate titles never bypass conservative photo evidence",()=>{
 const a=evidence();
 a.models[1].brand="Zetor";a.models[1].photos=[{...a.models[0].photos[0]}];
 let idx=indexArchivePhotoCandidates(a);
 assert.equal(archiveCandidatesForModel(idx,{brand:"Zetor",model:"MAJOR"}).matches,1);
 a.models[1].photos[0].license="CC BY-NC 4.0";
 idx=indexArchivePhotoCandidates(a);
 assert.equal(archiveCandidatesForModel(idx,{brand:"Zetor",model:"MAJOR"}).matches,1);
 a.models[0].photos[0].license="CC BY-NC 4.0";
 idx=indexArchivePhotoCandidates(a);
 assert.equal(archiveCandidatesForModel(idx,{brand:"Zetor",model:"MAJOR"}).matches,0);
});
