import test from "node:test";
import assert from "node:assert/strict";
import {auditMobilePhoto720} from "../scripts/photo-mobile-720-source-proof.mjs";
const goodJpeg=()=>{
  const b=new Uint8Array(15000);
  b[0]=0xff;b[1]=0xd8;b[b.length-2]=0xff;b[b.length-1]=0xd9;
  return new Response(b,{status:200,headers:{"content-type":"image/jpeg"}});
};
test("proof checks exactly three allowlisted URLs with single bounded GET per file",async()=>{
  const requests=[];
  const result=await auditMobilePhoto720({fetchFn:async(url,opts)=>{
    requests.push([url,opts]);
    return goodJpeg();
  }});
  assert.equal(result.length,3);
  assert.equal(requests.length,3);
  for(const [url,opts] of requests){
    assert.match(url,/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//);
    assert.match(url,/\/720px-/);
    assert.equal(opts.redirect,"follow");
    assert.equal(opts.signal.aborted,false);
  }
  assert.ok(result.every(x=>x.bytes===15000&&x.validJpeg));
});
test("429, HTML, empty and truncated JPEG responses fail closed",async()=>{
  for(const response of [
    new Response("limit",{status:429}),
    new Response("<html>upstream error</html>",{status:200,headers:{"content-type":"text/html"}}),
    new Response(new Uint8Array([255,216,255,217]),{status:200,headers:{"content-type":"image/jpeg"}}),
    new Response(new Uint8Array(12000),{status:200,headers:{"content-type":"image/jpeg"}})
  ]){
    await assert.rejects(auditMobilePhoto720({fetchFn:async()=>response.clone()}));
  }
});
test("unreachable Commons source is not silently recorded as verified",async()=>{
  await assert.rejects(auditMobilePhoto720({fetchFn:async()=>{throw Error("timeout");}}),/unavailable/);
});
