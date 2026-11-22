import test from "node:test";
import assert from "node:assert/strict";
import {CHECKS,evaluateBoundaryResponse,runAnonymousBoundaryAudit} from "../scripts/forum-anon-boundary-audit.mjs";
test("private tables reject anonymous requests, including empty successful responses",()=>{
 for(const code of [401,403])assert.equal(evaluateBoundaryResponse({kind:"private"},code,null,null).passed,true);
 for(const code of [200,204,404,500])assert.equal(evaluateBoundaryResponse({kind:"private"},code,[],0).passed,false);
});
test("anonymous forum only exposes published records and demands complete count",()=>{
 const c={kind:"public"};
 assert.equal(evaluateBoundaryResponse(c,200,[{status:"published"}],1).passed,true);
 for(const status of ["pending","hidden","draft"])
  assert.equal(evaluateBoundaryResponse(c,200,[{status}],1).passed,false);
 assert.equal(evaluateBoundaryResponse(c,200,[],null).passed,false);
 assert.equal(evaluateBoundaryResponse(c,200,[],1001).passed,false);
});
test("audit carries only anonymous apikey and never sends Authorization or user tokens",async()=>{
 let calls=0;
 const result=await runAnonymousBoundaryAudit({anonKey:"public-test",fetchFn:async(url,opts)=>{
  calls++;
  assert.equal(opts.headers.apikey,"public-test");
  assert.equal(Object.hasOwn(opts.headers,"Authorization"),false);
  assert.equal(opts.redirect,"error");
  const name=new URL(url).pathname.split("/").at(-1);
  if(name.startsWith("tc_forum_"))
   return new Response(JSON.stringify([{status:"published"}]),{status:200,headers:{"content-range":"0-0/1"}});
  return new Response("unauthorized",{status:403});
 }});
 assert.equal(result.passed,true);
 assert.equal(calls,CHECKS.length);
});
test("refuses missing credential and insecure origins",async()=>{
 await assert.rejects(runAnonymousBoundaryAudit({anonKey:""}),/public key unavailable/);
 await assert.rejects(runAnonymousBoundaryAudit({anonKey:"fake",origin:"http://example.com"}),/Invalid audited endpoint/);
});
