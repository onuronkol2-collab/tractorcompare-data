import test from "node:test";
import assert from "node:assert/strict";
import {fetchCommonsJson,CommonsCooldownError,parseRetryAfterMs}
  from "../scripts/photo-commons-http.mjs";
const response=(status,retryAfter,body={batchcomplete:true})=>({
  status,ok:status>=200&&status<300,headers:{get:k=>k==="retry-after"?retryAfter:null},
  json:async()=>body
});
test("Wikimedia Retry-After seconds and date parsed without ignoring longer cooldown",()=>{
 assert.equal(parseRetryAfterMs("30",0),30000);
 assert.equal(parseRetryAfterMs("Sun, 22 Nov 2026 07:00:00 GMT",Date.parse("2026-11-22T06:59:00Z")),60000);
 assert.equal(parseRetryAfterMs(null),null);
});
test("429 waits exact Retry-After then succeeds without extra requests",async()=>{
 const waited=[],statuses=[response(429,"7"),response(200,null)];
 const data=await fetchCommonsJson("https://commons.wikimedia.org/w/api.php",{
  fetchImpl:async()=>statuses.shift(),sleep:async ms=>waited.push(ms),now:()=>0
 });
 assert.equal(data.batchcomplete,true);
 assert.deepEqual(waited,[7000]);
});
test("429 cooldown too long does not retry and is explicitly not success",async()=>{
 let calls=0;
 await assert.rejects(fetchCommonsJson("https://commons.wikimedia.org/w/api.php",{
  fetchImpl:async()=>{calls++;return response(429,"600");},
  sleep:async()=>{throw Error("Must not wait or circumvent long Wikimedia cooldown");}
 }),CommonsCooldownError);
 assert.equal(calls,1);
});
test("503 without Retry-After waits at least 5s and limits retries",async()=>{
 let attempts=0;const waits=[];
 await assert.rejects(fetchCommonsJson("https://commons.wikimedia.org/w/api.php",{
  fetchImpl:async()=>{attempts++;return response(503,null);},
  sleep:async ms=>waits.push(ms)
 }),CommonsCooldownError);
 assert.equal(attempts,3);
 assert.deepEqual(waits,[5000,10000]);
});
test("HTTP-200 logical Commons API error remains a failure",async()=>{
 await assert.rejects(fetchCommonsJson("https://commons.wikimedia.org/w/api.php",{
  fetchImpl:async()=>response(200,null,{error:{code:"ratelimited"}}),
  sleep:async()=>{}
 }),/ratelimited/);
});
