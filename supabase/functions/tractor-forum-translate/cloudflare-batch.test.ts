import assert from "node:assert/strict";
import {BATCH_TARGETS,runCloudflareSyntheticBatch} from "./cloudflare-batch.ts";
import {SMOKE_SOURCE} from "./cloudflare-smoke.ts";
const config={
 accountId:"0123456789abcdef0123456789abcdef",
 apiToken:"synthetic-not-real",enabled:true,freePlanVerified:true
};
const previews:Record<string,string>={
 en:"This tractor has 75 hp engine power and 3000 kg hydraulic lifting capacity.",
 zh:"拖拉机功率为75 hp，液压起重能力为3000 kg。",
 hi:"इस ट्रैक्टर की शक्ति 75 hp और उठाने की क्षमता 3000 kg है।",
 pt:"Este trator possui 75 hp e capacidade de elevação de 3000 kg.",
 fr:"Ce tracteur a une puissance de 75 hp et une capacité de 3000 kg.",
 de:"Dieser Traktor hat 75 hp und eine Hubkraft von 3000 kg.",
 ru:"Мощность трактора 75 hp, грузоподъемность 3000 kg.",
 ja:"このトラクターは75 hpの出力と3000 kgの揚力を備えています。",
 es:"Este tractor tiene 75 hp y capacidad de elevación de 3000 kg."
};
Deno.test("Nine-language trial rejects disabled gates and missing credentials without any calls",async()=>{
 let calls=0;const fetchFn=async()=>{calls++;throw Error("unexpected");};
 for(const overrides of [{enabled:false},{freePlanVerified:false},{apiToken:""},{accountId:"bad"}]){
  await assert.rejects(runCloudflareSyntheticBatch({
   ...config,...overrides,fetchFn:fetchFn as typeof fetch
  }),/disabled|credentials/);
 }
 assert.equal(calls,0);
});
Deno.test("One bounded synthetic batch checks all nine locales and never accesses a forum or database",async()=>{
 const codes:string[]=[];
 const fetchFn=async(uri:RequestInfo|URL,options:RequestInit)=>{
  assert.match(String(uri),/api.cloudflare.com\/client\/v4\/accounts\/[a-f0-9]{32}\/ai\/run\/@cf\/meta\/m2m100-1.2b$/);
  assert.equal(options.method,"POST");
  const body=JSON.parse(String(options.body));
  assert.equal(body.text,SMOKE_SOURCE);
  assert.equal(body.source_lang,"tr");
  assert.equal((options.headers as Record<string,string>).Authorization,"Bearer "+config.apiToken);
  codes.push(body.target_lang);
  return new Response(JSON.stringify({success:true,result:{translated_text:previews[body.target_lang]}}),{status:200});
 };
 const result=await runCloudflareSyntheticBatch({...config,fetchFn:fetchFn as typeof fetch});
 assert.deepEqual(codes,BATCH_TARGETS.map(t=>t.code));
 assert.equal(result.request_count,9);
 assert.equal(result.max_request_count,9);
 assert.equal(result.completed,true);
 assert.deepEqual(result.results.map(x=>x.locale),BATCH_TARGETS.map(x=>x.locale));
 assert.equal(result.results.every(x=>x.numeric_facts_preserved===true),true);
 assert.equal(result.results.every(x=>x.target_script_detected!==false),true);
 assert.equal(JSON.stringify(result).includes("seo_approved"),false);
});
Deno.test("Rate limit stops immediately; no retry, no Gemini/Azure fallback",async()=>{
 let calls=0;
 const fetchFn=async()=>{
  calls++;
  if(calls===2)return new Response("{}",{status:429});
  return new Response(JSON.stringify({success:true,result:{translated_text:previews.en}}),{status:200});
 };
 const r=await runCloudflareSyntheticBatch({...config,fetchFn:fetchFn as typeof fetch});
 assert.equal(calls,2);
 assert.equal(r.request_count,2);
 assert.equal(r.completed,false);
 assert.equal(r.results[1].error,"HTTP_429");
 assert.equal(r.results.length,2);
});
Deno.test("Corrupt numbers are reported, never silently called a translation approval",async()=>{
 const fetchFn=async(_uri:RequestInfo|URL,options:RequestInit)=>{
  const lang=JSON.parse(String(options.body)).target_lang as string;
  return new Response(JSON.stringify({success:true,result:{
   translated_text:lang==="en"?"This tractor has 100 hp and 2000 kg.":previews[lang]
  }}),{status:200});
 };
 const r=await runCloudflareSyntheticBatch({...config,fetchFn:fetchFn as typeof fetch});
 assert.equal(r.request_count,9);
 assert.equal(r.results[0].numeric_facts_preserved,false);
 assert.equal(r.results[1].numeric_facts_preserved,true);
});
