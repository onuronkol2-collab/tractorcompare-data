import assert from "node:assert/strict";
import {
 CLOUDFLARE_MODEL,previewCloudflareTranslation,assertCloudflareFreePilotAllowed,
 translateCloudflareArticle
} from "./cloudflare-m2m100.ts";

// Every test is an in-memory mock. No network, model inference or billing.
const accountId="0123456789abcdef0123456789abcdef";
const apiToken="local-test-token-not-a-real-secret";
const sample={
 title:"2026 Traktör teknik karşılaştırması",
 body:["## Motor gücü","John Deere 5075E motor gücü 75 hp.",
  "| Ölçüm | Değer |","|:---|---:|",
  "| Hidrolik kapasite | 3.000 kg |",
  "- **Kaynak:** [Belge](https://example.org/source?model=5075E)",
  "PTO tipi değişmez.",""].join("\n")
};
const authorized={...sample,target:"en",accountId,apiToken,
 enabled:true,freePlanVerified:true};
function fakeApi(override?:(text:string)=>string){
 const calls:Array<{url:string;options:RequestInit;request:{text:string;source_lang:string;target_lang:string}}>=[];
 const fetchFn=async(input:RequestInfo|URL,options:RequestInit={}):Promise<Response>=>{
  const request=JSON.parse(String(options.body));
  calls.push({url:String(input),options,request});
  const transformed=(override||((text:string)=>text
   .replaceAll("Traktör","Tractor").replaceAll("teknik","technical")
   .replaceAll("Motor","Engine").replaceAll("motor","engine")
   .replaceAll("gücü","power").replaceAll("Hidrolik","Hydraulic")
   .replaceAll("Ölçüm","Measurement").replaceAll("Değer","Value")
   .replaceAll("kapasite","capacity").replaceAll("Kaynak","Source")
   .replaceAll("Belge","Document").replaceAll("tipi","type")))
   (request.text);
  return new Response(JSON.stringify({success:true,result:{translated_text:transformed}}),
   {status:200});
 };
 return {calls,fetchFn:fetchFn as typeof fetch};
}
Deno.test("zero-cost guards prohibit every network call even if credentials already exist",async()=>{
 let calls=0;
 const noNetwork=async()=>{calls++;throw Error("must not call");};
 for(const opts of [
  {...authorized,enabled:false},
  {...authorized,freePlanVerified:false},
  {...authorized,enabled:false,freePlanVerified:false},
  {...authorized,accountId:"bad"},
  {...authorized,apiToken:""}
 ]){
  await assert.rejects(translateCloudflareArticle({
   ...opts,fetchFn:noNetwork as typeof fetch
  }),/disabled|credentials/);
 }
 assert.equal(calls,0);
});
Deno.test("Markdown preview verifies bounded request count without network",()=>{
 const p=previewCloudflareTranslation(sample.title,sample.body);
 assert.equal(p.model,CLOUDFLARE_MODEL);
 assert.ok(p.requests>=2&&p.requests<=24);
 assert.ok(p.inputCharacters<2600);
 assert.ok(p.spans.includes("https://example.org/source?model=5075E"));
 assert.ok(p.spans.includes("|:---|---:|"));
 assert.equal(p.spans,sample.title+sample.body);
});
Deno.test("Cloudflare REST request and response preserve technical Markdown anchors",async()=>{
 const fake=fakeApi();
 const translated=await translateCloudflareArticle({...authorized,fetchFn:fake.fetchFn});
 assert.equal(translated.model,"@cf/meta/m2m100-1.2b");
 assert.match(translated.value.title,/Tractor/);
 assert.match(translated.value.body,/Engine power/);
 assert.match(translated.value.body,/John Deere 5075E/);
 assert.match(translated.value.body,/75 hp/);
 assert.match(translated.value.body,/3.000 kg/);
 assert.match(translated.value.body,/^\|:---\|---:\|$/m);
 assert.match(translated.value.body,/\]\(https:\/\/example.org\/source\?model=5075E\)/);
 assert.equal(translated.value.body.split("\n").length,sample.body.split("\n").length);
 assert.equal(fake.calls.length,previewCloudflareTranslation(sample.title,sample.body).requests);
 for(const call of fake.calls){
  assert.equal(call.options.method,"POST");
  assert.ok(call.url.endsWith("/ai/run/@cf/meta/m2m100-1.2b"));
  assert.equal(call.request.source_lang,"tr");
  assert.equal(call.request.target_lang,"en");
  assert.equal((call.options.headers as Record<string,string>).Authorization,"Bearer "+apiToken);
  assert.ok(!call.url.includes(apiToken),"token must never enter URL");
  assert.ok(!JSON.stringify(call.request).includes(apiToken),"token must never enter article request");
  assert.doesNotMatch(call.request.text,/https?:\/\/\S+/u,
    "no external URL must be included in translatable prose spans");
 }
});
Deno.test("nine forum target locales and non-Turkish sources map to documented ISO codes",async()=>{
 const targets:{[key:string]:string}={en:"en",zh:"zh",hi:"hi","pt-br":"pt",
  fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"};
 for(const [target,expected] of Object.entries(targets)){
  const fake=fakeApi();
  await translateCloudflareArticle({
   title:"Traktör",body:"Motor gücü 75 hp",
   target,sourceLocale:"tr",accountId,apiToken,
   enabled:true,freePlanVerified:true,fetchFn:fake.fetchFn
  });
  assert.ok(fake.calls.length>=1);
  for(const call of fake.calls)assert.equal(call.request.target_lang,expected);
 }
 const french=fakeApi();
 await translateCloudflareArticle({
  title:"Puissance",body:"Moteur 75 hp",target:"en",sourceLocale:"fr",
  accountId,apiToken,enabled:true,freePlanVerified:true,fetchFn:french.fetchFn
 });
 assert.equal(french.calls[0].request.source_lang,"fr");
});
Deno.test("reject identical, unknown source and destination languages before network",async()=>{
 let requests=0;
 const noNetwork=async()=>{requests++;throw Error("unexpected");};
 for(const opts of [{target:"tr",sourceLocale:"tr"},
  {target:"xx",sourceLocale:"tr"},{target:"en",sourceLocale:"xx"},
  {target:"en",sourceLocale:"en"}]){
  await assert.rejects(translateCloudflareArticle({
   ...authorized,...opts,fetchFn:noNetwork as typeof fetch
  }),/Unsupported M2M100 language pair/);
 }
 assert.equal(requests,0);
});
Deno.test("hard cost ceiling prevents an excessive number of requests",async()=>{
 const many=Array.from({length:80},(_,i)=>"## Traktör "+i).join("\n");
 assert.throws(()=>previewCloudflareTranslation("Başlık",many),/request budget exceeded/);
 let requests=0;
 const fake=async()=>{requests++;throw Error("unexpected request")};
 await assert.rejects(translateCloudflareArticle({
  ...authorized,title:"Başlık",body:many,fetchFn:fake as typeof fetch
 }),/request budget exceeded/);
 assert.equal(requests,0);
});
Deno.test("API 403/429 and quota errors never fall back to a paid AI",async()=>{
 for(const status of [403,429,503]){
  let requests=0;
  const fake=async()=>{
   requests++;
   return new Response(JSON.stringify({success:false}),{status});
  };
  await assert.rejects(translateCloudflareArticle({
   ...authorized,fetchFn:fake as typeof fetch
  }),new RegExp("HTTP "+status));
  assert.equal(requests,1,"one failed request only, no alternate provider");
 }
});
Deno.test("malformed and untrusted responses cannot become published translations",async()=>{
 const bad=[
  new Response("not json",{status:200}),
  new Response(JSON.stringify({success:false,result:{translated_text:"hello"}}),{status:200}),
  new Response(JSON.stringify({success:true,result:{translated_text:""}}),{status:200}),
  new Response(JSON.stringify({success:true,result:{translated_text:42}}),{status:200})
 ];
 for(const row of bad){
  const fake=async()=>row.clone();
  await assert.rejects(translateCloudflareArticle({
   ...authorized,fetchFn:fake as typeof fetch
  }),/invalid|empty/);
 }
});
Deno.test("provider execution disabled by default even for a fully configured test call",async()=>{
 const fake=fakeApi();
 await assert.rejects(translateCloudflareArticle({
  ...sample,target:"en",accountId,apiToken,
  fetchFn:fake.fetchFn
 }),/disabled/);
 assert.equal(fake.calls.length,0);
 assert.throws(()=>assertCloudflareFreePilotAllowed({
  accountId,apiToken,enabled:true,freePlanVerified:false
 }),/disabled/);
});
