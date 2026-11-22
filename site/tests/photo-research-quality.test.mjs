import test from "node:test";
import assert from "node:assert/strict";
import {validatePhotoResearchReports} from "../scripts/photo-research-quality-gate.mjs";
const archive=()=>({modelCount:1,models:[{brand:"Kubota",model:"M5"}],errors:[],errorCount:0});
const live=()=>({publicModelPages:1,modelSearches:1,runStatus:"complete",models:[
  {brand:"Kubota",model:"M5",status:"published",publicPages:["https://tractorvs.com/tractors/kubota-m5/"]}]});
test("a complete read-only research report passes",()=>{
  assert.equal(validatePhotoResearchReports(archive(),live()).ok,true);
});
test("archive source errors always fail the gate",()=>{
  const a=archive();a.errors=[{brand:"Kubota",error:"HTTP 503"}];a.errorCount=1;
  assert.equal(validatePhotoResearchReports(a,live()).ok,false);
});
test("failed published model API search is never a successful full run",()=>{
  const l=live();l.models[0].error="HTTP 429";
  assert.equal(validatePhotoResearchReports(archive(),l).ok,false);
});
test("missing inventory, missing records, or private/draft model fail closed",()=>{
  const l=live();l.modelSearches=2;
  assert.equal(validatePhotoResearchReports(archive(),l).ok,false);
  l.modelSearches=1;l.models[0].status="draft";
  assert.equal(validatePhotoResearchReports(archive(),l).ok,false);
  assert.equal(validatePhotoResearchReports(archive(),null).ok,false);
  assert.equal(validatePhotoResearchReports(null,live()).ok,false);
});
