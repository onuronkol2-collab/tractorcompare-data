import assert from "node:assert/strict";
import {BATCH_TARGETS,runCloudflareSyntheticBatch} from "./cloudflare-batch.ts";
import {SMOKE_SOURCE} from "./cloudflare-smoke.ts";
import {samePhysicalUnitFacts,syntheticTractorTerminologyPresent} from "./translation-quality.ts";
const config={
 accountId:"0123456789abcdef0123456789abcdef",
 apiToken:"synthetic-not-real",enabled:true,freePlanVerified:true
};
const previews:Record<string,string>={
 en:"This tractor has 75 hp engine power and 3000 kg hydraulic lifting capacity.",
 zh:"拖拉机功率为75 hp，液压起重能力为3000 kg。",
 hi:"इस ट्रैक्टर की शक्ति 75 hp और हाइड्रोलिक उठाने की क्षमता 3000 kg है।",
 pt:"Este trator possui 75 hp e capacidade de elevação hidráulica de 3000 kg.",
 fr:"Ce tracteur a une puissance de 75 hp et une capacité hydraulique de 3000 kg.",
 de:"Dieser Traktor hat 75 hp und eine hydraulische Hubkraft von 3000 kg.",
 ru:"Мощность трактора 75 hp, гидравлическая грузоподъемность 3000 kg.",
 ja:"このトラクターは75 hpの出力と3000 kgの油圧揚力を備えています。",
 es:"Este tractor tiene 75 hp y capacidad de elevación hidráulica de 3000 kg."
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
  const url=new URL(String(uri));
  assert.equal(url.origin,"https://api.cloudflare.com");
  assert.equal(url.username,"");assert.equal(url.password,"");
  assert.equal(url.search,"");assert.equal(url.hash,"");
  assert.equal(url.pathname,"/client/v4/accounts/"+config.accountId+"/ai/run/@cf/meta/m2m100-1.2b");
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
 assert.equal(result.results.every(x=>x.physical_units_preserved===true),true);
 assert.equal(result.results.every(x=>x.technical_terms_present===true),true);
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

Deno.test("Actual TOPLU_TEST #73 outputs are screened: 3 provisional passes, 6 flagged",()=>{
 // Verbatim fixed synthetic results from the 2026-11-22 failed job logs.
 // Provisional pass is NOT approval to publish or full semantic certification.
 const historical:Record<string,string>={
  en:"The engine power of this tractor is 75 hp and the hydraulic lifting capacity is 3000 kg.",
  zh:"该拖拉机的发动机功率为75马力,氢升降能力为3000公斤。",
  hi:"इस ट्रैक्टर की इंजन शक्ति 75 एचपी है और हाइड्रोलिक लिफ्ट क्षमता 3000 किलोग्राम है।",
  "pt-br":"A potência do motor deste tractor é de 75 cv e a capacidade de elevação hidráulica é de 3000 kg.",
  fr:"La puissance moteur de ce tracteur est de 75 ch et la capacité de levage hydraulique est de 3000 kg.",
  de:"Die Motorleistung dieses Traktors beträgt 75 PS und die hydraulische Hebekapazität beträgt 3000 kg.",
  ru:"Если вы хотите, чтобы ваши дети были счастливы, вы должны знать, что вы хотите быть счастливыми, чтобы быть счастливыми.",
  ja:"このトラクターのエンジンパワーは75HPで、水力持ち上げ能力は3000kgです。",
  es:"La potencia del motor de este tractor es de 75 hp y la capacidad de elevación hidráulica es de 3000 kg."
 };
 const accepted=["en","hi","es"],blocked=["zh","pt-br","fr","de","ru","ja"];
 for(const locale of accepted){
  assert.equal(samePhysicalUnitFacts(SMOKE_SOURCE,historical[locale]),true,locale+" units");
  assert.equal(syntheticTractorTerminologyPresent(locale,historical[locale]),true,locale+" terms");
 }
 for(const locale of blocked){
  assert.equal(
   samePhysicalUnitFacts(SMOKE_SOURCE,historical[locale])&&
   syntheticTractorTerminologyPresent(locale,historical[locale]),
   false,locale+" must be flagged"
  );
 }
 assert.equal(samePhysicalUnitFacts(SMOKE_SOURCE,historical["pt-br"]),false,"cv is not hp");
 assert.equal(samePhysicalUnitFacts(SMOKE_SOURCE,historical.fr),false,"ch is not hp");
 assert.equal(samePhysicalUnitFacts(SMOKE_SOURCE,historical.de),false,"PS is not hp");
 assert.equal(syntheticTractorTerminologyPresent("zh",historical.zh),false,"hydrogen is not hydraulics");
 assert.equal(syntheticTractorTerminologyPresent("ja",historical.ja),false,"water lifting is not hydraulic lift");
 assert.equal(syntheticTractorTerminologyPresent("pt-br",historical["pt-br"]),false,"tractor is not standard Brazilian trator");
 assert.equal(syntheticTractorTerminologyPresent("ru",historical.ru),false,"unrelated output must fail");
});
