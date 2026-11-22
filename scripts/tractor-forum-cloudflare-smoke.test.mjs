import {test} from "node:test";
import assert from "node:assert/strict";
import {runSyntheticOnly,validateSyntheticReceipt} from "./tractor-forum-cloudflare-smoke.mjs";
const anon="a."+Buffer.from(JSON.stringify({role:"anon"})).toString("base64url")+".c";
const receipt={
 success:true,kind:"synthetic_only",model:"@cf/meta/m2m100-1.2b",
 source_lang:"tr",target_lang:"en",request_count:1,
 translated_preview:"This tractor has 75 hp and 3000 kg lifting capacity.",
 numeric_facts_preserved:true
};
test("TEST invokes exactly one synthetic-only action, never a queue processing action",async()=>{
 let requests=0;
 const fake=async(_url,opts)=>{
  requests++;
  assert.deepEqual(JSON.parse(opts.body),{action:"test_cloudflare_synthetic"});
  assert.equal(opts.headers.Authorization,"Bearer "+anon);
  assert.equal(opts.headers["x-queue-secret"],"private-secret");
  return new Response(JSON.stringify(receipt),{status:200});
 };
 const result=await runSyntheticOnly({jwt:anon,secret:"private-secret",fetchFn:fake});
 assert.equal(requests,1);
 assert.equal(result.requestCount,1);
 assert.equal(result.numericFactsPreserved,true);
});
test("TEST refuses unauthorized tokens and missing private queue secret without any request",async()=>{
 let requests=0;
 const fake=async()=>{requests++;throw Error("unexpected")};
 await assert.rejects(runSyntheticOnly({jwt:"",secret:"private",fetchFn:fake}),/Missing/);
 await assert.rejects(runSyntheticOnly({jwt:anon,secret:"",fetchFn:fake}),/Missing/);
 const service="a."+Buffer.from(JSON.stringify({role:"service_role"})).toString("base64url")+".c";
 await assert.rejects(runSyntheticOnly({jwt:service,secret:"private",fetchFn:fake}),/role=anon/);
 assert.equal(requests,0);
});
test("TEST rejects malformed synthetic receipts and model responses",()=>{
 for(const bad of [
  {...receipt,request_count:2},
  {...receipt,model:"gemini"},
  {...receipt,kind:"process_topic"},
  {...receipt,translated_preview:""},
  {...receipt,numeric_facts_preserved:"true"},
  {...receipt,translated_preview:"bad\nlog"}
 ])assert.throws(()=>validateSyntheticReceipt(bad),/invalid/);
});
test("TEST safely reports disabled gates (HTTP 412) without retrying or fallback",async()=>{
 let requests=0;
 const fake=async()=>{requests++;return new Response('{"success":false}',{status:412})};
 await assert.rejects(runSyntheticOnly({jwt:anon,secret:"private",fetchFn:fake}),/HTTP 412/);
 assert.equal(requests,1);
});
