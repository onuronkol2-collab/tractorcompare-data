import {test} from "node:test";
import assert from "node:assert/strict";
import {runTranslationQueue,validateReceipt} from "./tractor-forum-translate-dispatch.mjs";
const anon="a."+Buffer.from(JSON.stringify({role:"anon"})).toString("base64url")+".c";
test("only a role=anon access token with private queue secret may invoke the worker",async()=>{
 await assert.rejects(runTranslationQueue({jwt:"",secret:"secret",fetchFn:()=>{throw Error("not called")}}),/Missing/);
 const service="a."+Buffer.from(JSON.stringify({role:"service_role"})).toString("base64url")+".c";
 await assert.rejects(runTranslationQueue({jwt:service,secret:"secret",fetchFn:()=>{throw Error("not called")}}),/role=anon/);
});
test("exact request is queue-action only; no article, private key or account data leaks",async()=>{
 const calls=[];
 const fetchFn=async(url,req)=>{
  calls.push({url,req});
  return new Response(JSON.stringify({success:true,processed:1,status:"ready",locale:"en"}),{status:200});
 };
 const result=await runTranslationQueue({jwt:anon,secret:"queue-secret",max:1,fetchFn});
 assert.deepEqual(result,[{processed:1,status:"ready",locale:"en"}]);
 assert.equal(calls.length,1);
 assert.deepEqual(JSON.parse(calls[0].req.body),{action:"process_topic"});
 assert.equal(calls[0].req.headers.Authorization,"Bearer "+anon);
 assert.equal(calls[0].req.headers["x-queue-secret"],"queue-secret");
 assert.ok(!calls[0].req.body.includes("service_role"));
});
test("queue empty, retry and failed states stop repeated provider requests",async()=>{
 for(const status of ["queue_empty","retry","failed"]){
  let count=0;
  const fetchFn=async()=>{count++;return new Response(JSON.stringify({success:true,processed:0,status}))};
  await runTranslationQueue({jwt:anon,secret:"x",max:3,fetchFn});
  assert.equal(count,1);
 }
});
test("rejects malformed receipts and unexpected target languages",()=>{
 assert.throws(()=>validateReceipt({success:true,processed:1,status:"ready",locale:"tr"}),/Unexpected/);
 assert.throws(()=>validateReceipt({success:true,processed:5,status:"ready",locale:"en"}),/invalid/);
 assert.throws(()=>validateReceipt({success:true,processed:1,status:"queue_empty"}),/Unexpected/);
});
test("partial private checkpoint is accepted but never reported as a published translation",async()=>{
 const receipts=[];
 let n=0;
 const fetchFn=async()=>{
  n++;
  return new Response(JSON.stringify({success:true,processed:1,status:"partial",locale:"ja"}),{status:200});
 };
 receipts.push(...await runTranslationQueue({jwt:anon,secret:"secret",max:3,fetchFn}));
 assert.equal(n,3);
 assert.deepEqual(receipts.map(r=>r.status),["partial","partial","partial"]);
 assert.throws(()=>validateReceipt({success:true,processed:1,status:"partial",locale:"tr"}),/Unexpected/);
});
test("never attempts more than three translations per scheduled run",async()=>{
 let n=0;const fn=async()=>{n++;return new Response(JSON.stringify({success:true,processed:1,status:"ready",locale:"fr"}))};
 await runTranslationQueue({jwt:anon,secret:"x",max:3,fetchFn:fn});
 assert.equal(n,3);
 await assert.rejects(runTranslationQueue({jwt:anon,secret:"x",max:4,fetchFn:fn}),/Max 3/);
});
test("HTTP failure stops safely and never reports jobs as completed",async()=>{
 const fn=async()=>new Response(JSON.stringify({error:"unavailable"}),{status:503});
 await assert.rejects(runTranslationQueue({jwt:anon,secret:"x",fetchFn:fn}),/HTTP 503/);
});
