import test from "node:test";
import assert from "node:assert/strict";
import {classifyHandshake,checkTlsVersionFloor,HOSTS,VERSIONS}
  from "../scripts/tls-edge-version-proof.mjs";

test("legacy TLS accepted by server is critical failure",()=>{
  assert.equal(classifyHandshake("TLSv1",{connected:true,protocol:"TLSv1"}).status,"FAIL");
  assert.equal(classifyHandshake("TLSv1.1",{connected:true,protocol:"TLSv1.1"}).status,"FAIL");
});
test("an explicit remote protocol version alert proves legacy TLS rejection",()=>{
  for(const version of ["TLSv1","TLSv1.1"])
    assert.deepEqual(classifyHandshake(version,{error:{
      code:"ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION",
      message:"SSL routines:ssl3_read_bytes:tlsv1 alert protocol version"
    }}),{status:"PASS",reason:"remote-protocol-version-alert",protocol:null});
});
test("a local TLS client error or timeout is inconclusive, not false proof",()=>{
  for(const message of ["no protocols available","unsupported protocol","network timeout"]){
    assert.equal(classifyHandshake("TLSv1",{error:new Error(message)}).status,"INCONCLUSIVE");
  }
});
test("modern TLS must negotiate exact version with valid certificate",()=>{
  assert.equal(classifyHandshake("TLSv1.2",{
    connected:true,protocol:"TLSv1.2",authorized:true
  }).status,"PASS");
  assert.equal(classifyHandshake("TLSv1.3",{
    connected:true,protocol:"TLSv1.3",authorized:false
  }).status,"FAIL");
  assert.equal(classifyHandshake("TLSv1.3",{
    connected:true,protocol:"TLSv1.2",authorized:true
  }).status,"FAIL");
});
test("aggregate must pass all 8 independent host/protocol combinations",async()=>{
  const report=await checkTlsVersionFloor(async(host,version)=>({
    host,version,status:"PASS",reason:"mock"
  }));
  assert.equal(report.passed,true);
  assert.equal(report.results.length,HOSTS.length*VERSIONS.length);
  const bad=await checkTlsVersionFloor(async(host,version)=>({
    host,version,status:host==="www.tractorvs.com"&&version==="TLSv1.1"?
      "INCONCLUSIVE":"PASS",reason:"mock"
  }));
  assert.equal(bad.passed,false);
  assert.equal(bad.inconclusive,1);
});
