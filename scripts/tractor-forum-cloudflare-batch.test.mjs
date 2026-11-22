import {test} from "node:test";
import assert from "node:assert/strict";
import {runBatchOnly,validateBatchReceipt} from "./tractor-forum-cloudflare-batch.mjs";
const jwt="a."+Buffer.from(JSON.stringify({role:"anon"})).toString("base64url")+".c";
const langs=["en","zh","hi","pt-br","fr","de","ru","ja","es"];
const receipt={
 success:true,kind:"synthetic_batch_only",model:"@cf/meta/m2m100-1.2b",
 source_lang:"tr",max_request_count:9,request_count:9,completed:true,
 results:langs.map(locale=>({
  locale,status:"ok",translated_preview:"Example has 75 hp and 3000 kg.",
  numeric_facts_preserved:true,physical_units_preserved:true,
  technical_terms_present:true,target_script_detected:null
 }))
};
test("TOPLU_TEST sends one fixed synthetic-only Edge action and verifies nine receipts",async()=>{
 let count=0;const fake=async(_url,options)=>{
  count++;assert.deepEqual(JSON.parse(options.body),{action:"test_cloudflare_batch"});
  assert.equal(options.headers.Authorization,"Bearer "+jwt);
  return new Response(JSON.stringify(receipt),{status:200});
 };
 const r=await runBatchOnly({jwt,secret:"test-queue-secret",fetchFn:fake});
 assert.equal(count,1);assert.equal(r.requestCount,9);
 assert.equal(r.completed,true);assert.equal(r.results.length,9);
 assert.equal(r.results.every(x=>x.physicalUnitsPreserved&&x.technicalTermsPresent),true);
});
test("TOPLU_TEST never calls provider without signed anon credentials",async()=>{
 let count=0;const fake=async()=>{count++;throw Error("must not call");};
 for(const vals of [{jwt:"",secret:"x"},{jwt,secret:""}]){
  await assert.rejects(runBatchOnly({...vals,fetchFn:fake}),/Missing/);
 }
 const service="a."+Buffer.from(JSON.stringify({role:"service_role"})).toString("base64url")+".c";
 await assert.rejects(runBatchOnly({jwt:service,secret:"x",fetchFn:fake}),/role=anon/);
 assert.equal(count,0);
});
test("TOPLU_TEST rejects malformed/mismatched source receipts",()=>{
 for(const bad of [
  {...receipt,request_count:10},
  {...receipt,kind:"process_topic"},
  {...receipt,model:"gemini"},
  {...receipt,results:receipt.results.slice(0,8)},
  {...receipt,results:receipt.results.map((x,i)=>i===0?{...x,locale:"ru"}:x)},
  {...receipt,results:receipt.results.map((x,i)=>i===0?{...x,translated_preview:"bad\nnewlines"}:x)},
  {...receipt,results:receipt.results.map((x,i)=>i===0?{...x,physical_units_preserved:null}:x)},
  {...receipt,results:receipt.results.map((x,i)=>i===0?{...x,technical_terms_present:"yes"}:x)}
 ])assert.throws(()=>validateBatchReceipt(bad),/invalid/);
});
test("TOPLU_TEST can safely report early 429 stop without claiming completion",()=>{
 const partial={
  ...receipt,completed:false,request_count:2,
  results:[receipt.results[0],{locale:"zh",status:"error",error:"HTTP_429"}]
 };
 const r=validateBatchReceipt(partial);
 assert.equal(r.completed,false);assert.equal(r.requestCount,2);
});

test("unit/glossary failures remain visible even for completed HTTP batches",()=>{
 const bad={...receipt,results:receipt.results.map((x,i)=>
  i===3?{...x,physical_units_preserved:false,technical_terms_present:false}:x)};
 const got=validateBatchReceipt(bad);
 assert.equal(got.completed,true,"nine requests were completed");
 assert.equal(got.results[3].physicalUnitsPreserved,false);
 assert.equal(got.results[3].technicalTermsPresent,false);
});
