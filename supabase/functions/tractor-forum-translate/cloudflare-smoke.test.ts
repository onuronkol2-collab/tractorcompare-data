import assert from "node:assert/strict";
import {runCloudflareSyntheticSmoke,SMOKE_SOURCE} from "./cloudflare-smoke.ts";
const config={
 accountId:"0123456789abcdef0123456789abcdef",
 apiToken:"synthetic-not-a-real-key",enabled:true,freePlanVerified:true
};
Deno.test("synthetic check is blocked without independent free-tier and explicit-enable gates",async()=>{
 let network=0;
 const fetchFn=async()=>{network++;throw Error("unexpected");};
 for(const overrides of [{enabled:false},{freePlanVerified:false},{apiToken:""},{accountId:"not-hex"}]){
  await assert.rejects(runCloudflareSyntheticSmoke({
   ...config,...overrides,fetchFn:fetchFn as typeof fetch
  }),/disabled|credentials/);
 }
 assert.equal(network,0);
});
Deno.test("synthetic test makes exactly one fixed-source request, with no queue or user content",async()=>{
 let calls=0;
 const fetchFn=async(uri:RequestInfo|URL,options:RequestInit)=>{
  calls++;
  assert.match(String(uri),/\/ai\/run\/@cf\/meta\/m2m100-1\.2b$/);
  assert.equal(options.method,"POST");
  assert.equal((options.headers as Record<string,string>).Authorization,
   "Bearer "+config.apiToken);
  const body=JSON.parse(String(options.body));
  assert.deepEqual(body,{
   text:SMOKE_SOURCE,source_lang:"tr",target_lang:"en"
  });
  return new Response(JSON.stringify({
   success:true,
   result:{translated_text:"This tractor has 75 hp engine power and 3000 kg hydraulic lift capacity."}
  }),{status:200});
 };
 const r=await runCloudflareSyntheticSmoke({...config,fetchFn:fetchFn as typeof fetch});
 assert.equal(calls,1);
 assert.equal(r.request_count,1);
 assert.equal(r.model,"@cf/meta/m2m100-1.2b");
 assert.equal(r.numeric_facts_preserved,true);
 assert.match(r.translated_preview,/tractor/);
 assert.equal(SMOKE_SOURCE.includes(config.apiToken),false);
});
Deno.test("429, 403, malformed responses and API timeouts fail with no paid fallback",async()=>{
 for(const httpCode of [403,429,503]){
  let count=0;
  const fetchFn=async()=>{count++;return new Response("{}",{status:httpCode});};
  await assert.rejects(runCloudflareSyntheticSmoke({
   ...config,fetchFn:fetchFn as typeof fetch
  }),new RegExp("HTTP "+httpCode));
  assert.equal(count,1);
 }
 const invalid=async()=>new Response(JSON.stringify({
  success:true,result:{translated_text:""}
 }),{status:200});
 await assert.rejects(runCloudflareSyntheticSmoke({
  ...config,fetchFn:invalid as typeof fetch
 }),/unexpected output/);
 let count=0;
 const timeout=async()=>{count++;throw Error("timeout")};
 await assert.rejects(runCloudflareSyntheticSmoke({
  ...config,fetchFn:timeout as typeof fetch
 }),/network failure/);
 assert.equal(count,1);
});
Deno.test("translation number preservation is reported, never treated as publication approval",async()=>{
 const altered=async()=>new Response(JSON.stringify({
  success:true,result:{translated_text:"This tractor offers 100 hp and 2000 kg."}
 }),{status:200});
 const result=await runCloudflareSyntheticSmoke({
  ...config,fetchFn:altered as typeof fetch
 });
 assert.equal(result.numeric_facts_preserved,false);
 assert.equal(Object.keys(result).includes("seo_approved"),false);
});
