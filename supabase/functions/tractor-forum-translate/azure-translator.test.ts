import assert from "node:assert/strict";
import {markdownSpans,translateAzureArticle} from "./azure-translator.ts";
const secret="synthetic-not-a-real-key";
const article=[
 "## Motor gücü ve PTO",
 "John Deere 5075E modeli 75 hp gücündedir.",
 "| Ölçüm | Değer |",
 "|:---|---:|",
 "| Motor gücü | 75 hp |",
 "- **Bağımsız kaynak:** [Üretici belgesi](https://example.org/source?id=75)",
 "> Test 2026 yılında yapıldı.",
 String.fromCharCode(96,96,96)+"js",
 "const hp=75;",
 String.fromCharCode(96,96,96),
 "Kaynak: https://example.org/manual/tractor-75.pdf"
].join("\n");
const sample={title:"2026 Traktör motor gücü",body:article};
function translateMock(){
 const calls:Array<{url:string;request:RequestInit}>=[];
 const fetchFn=async(input:RequestInfo|URL,request:RequestInit):Promise<Response>=>{
  calls.push({url:String(input),request});
  const batch=JSON.parse(String(request.body)) as Array<{text:string}>;
  return new Response(JSON.stringify(batch.map(item=>({
   translations:[{to:"en",text:item.text
    .replaceAll("motor gücü","engine power")
    .replaceAll("Motor gücü","Engine power")
    .replaceAll("Traktör","Tractor")
    .replaceAll("Ölçüm","Measurement")
    .replaceAll("Değer","Value")
    .replaceAll("modeli","model")
    .replaceAll("gücündedir","has a power rating")
    .replaceAll("Kaynak","Source")
    .replaceAll("Üretici belgesi","Manufacturer document")
    .replaceAll("Bağımsız kaynak","Independent source")}]}
  ))),{status:200});
 };
 return {calls,fetchFn:fetchFn as typeof fetch};
}
Deno.test("markdown tokenizer reconstructs source bytes exactly",()=>{
 const sampleSpans=markdownSpans(article);
 assert.equal(sampleSpans.map(x=>x.text).join(""),article);
 assert.ok(sampleSpans.some(x=>x.text==="https://example.org/manual/tractor-75.pdf"&&!x.translate));
 assert.ok(sampleSpans.some(x=>x.text.includes("const hp=75;")&&!x.translate));
 assert.ok(sampleSpans.some(x=>x.text.includes("|")&&!x.translate));
 assert.ok(sampleSpans.some(x=>x.text.includes("John Deere")&&!x.translate));
});
Deno.test("Azure adapter translates content without damaging Markdown tables and links",async()=>{
 const mock=translateMock();
 const answer=await translateAzureArticle({...sample,target:"en",apiKey:secret,region:"westeurope",fetchFn:mock.fetchFn});
 assert.equal(answer.model,"Azure Translator v3");
 assert.match(answer.value.title,/Tractor/);
 assert.match(answer.value.body,/engine power/i);
 assert.match(answer.value.body,/75 hp/);
 assert.match(answer.value.body,/\|\s*Measurement\s*\|\s*Value\s*\|/);
 assert.match(answer.value.body,/^\|:---\|---:\|$/m);
 assert.match(answer.value.body,/\]\(https:\/\/example.org\/source\?id=75\)/);
 assert.match(answer.value.body,/https:\/\/example.org\/manual\/tractor-75.pdf/);
 assert.match(answer.value.body,/const hp=75;/);
 assert.equal(answer.value.body.split("\n").length,sample.body.split("\n").length);
 assert.equal(mock.calls.length,1);
 assert.ok(mock.calls[0].url.includes("api-version=3.0&from=tr&to=en"));
 assert.ok(mock.calls[0].url.includes("textType=plain"));
 assert.equal((mock.calls[0].request.headers as Record<string,string>)["Ocp-Apim-Subscription-Key"],secret);
 assert.ok(!JSON.stringify(mock.calls[0].request.body).includes(secret),"key never sent as body text");
 assert.ok(!mock.calls[0].url.includes(secret),"key never sent in URL");
});
Deno.test("all nine target locales map to official Azure Translator codes",async()=>{
 const codes:Record<string,string>={en:"en",zh:"zh-Hans",hi:"hi","pt-br":"pt",fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"};
 for(const [target,to] of Object.entries(codes)){
  let calls=0;
  const fetchFn=async(input:RequestInfo|URL,request:RequestInit)=>{
   calls++;
   const uri=new URL(String(input));
   assert.equal(uri.searchParams.get("to"),to);
   const entries=JSON.parse(String(request.body)) as Array<{text:string}>;
   return new Response(JSON.stringify(entries.map(item=>({
    translations:[{to,text:item.text+" translated"}]
   }))),{status:200});
  };
  const out=await translateAzureArticle({title:"Title",body:"Text",target,
   apiKey:secret,region:"westeurope",fetchFn:fetchFn as typeof fetch});
  assert.match(out.value.body,/translated/);
  assert.equal(calls,1);
 }
});
Deno.test("missing credentials or unsupported target NEVER send any content to a provider",async()=>{
 let calls=0;
 const noNetwork=async()=>{calls++;throw Error("should never call network")};
 for(const x of [
  {apiKey:"",region:"westeurope",target:"en"},
  {apiKey:secret,region:"",target:"en"},
  {apiKey:secret,region:"westeurope",target:"tr"},
 ]){
  await assert.rejects(translateAzureArticle({...sample,...x,fetchFn:noNetwork as typeof fetch}));
 }
 assert.equal(calls,0);
});
Deno.test("failed provider, mismatched array and empty translated text fail closed",async()=>{
 const original=JSON.stringify(sample);
 const errors:Array<(req:RequestInit)=>Response>=[];
 errors.push(()=>new Response(JSON.stringify({error:"busy"}),{status:503}));
 errors.push(()=>new Response(JSON.stringify([{translations:[{to:"fr",text:"wrong locale"}]}]),{status:200}));
 errors.push(()=>new Response(JSON.stringify([]),{status:200}));
 for(const produce of errors){
  const fetchFn=async(_url:RequestInfo|URL,req:RequestInit)=>produce(req);
  await assert.rejects(translateAzureArticle({
   ...sample,target:"en",apiKey:secret,region:"westeurope",fetchFn:fetchFn as typeof fetch
  }),/Azure/);
 }
 assert.equal(JSON.stringify(sample),original,"input must remain unchanged");
});
Deno.test("plain Markdown cannot exceed preapproved request size",async()=>{
 await assert.rejects(translateAzureArticle({
  title:"Valid title",body:"a".repeat(5001),target:"en",apiKey:secret,region:"westeurope"
 }),/safe limits/);
});


Deno.test("a French forum source must never be mislabeled Turkish in Azure requests",async()=>{
 let requests=0;
 const fetchFn=async(input:RequestInfo|URL,options:RequestInit)=>{
  requests++;
  const url=new URL(String(input));
  assert.equal(url.searchParams.get("from"),"fr");
  assert.equal(url.searchParams.get("to"),"en");
  const sent=JSON.parse(String(options.body)) as Array<{text:string}>;
  return new Response(JSON.stringify(sent.map(x=>({
   translations:[{to:"en",text:x.text+" translated"}]
  }))),{status:200});
 };
 await translateAzureArticle({title:"Titre du tracteur",body:"Vitesse du tracteur",
  target:"en",sourceLocale:"fr",apiKey:secret,region:"westeurope",fetchFn:fetchFn as typeof fetch});
 assert.equal(requests,1);
 await assert.rejects(translateAzureArticle({title:"Titre du tracteur",body:"Vitesse du tracteur",
  target:"fr",sourceLocale:"fr",apiKey:secret,region:"westeurope",
  fetchFn:fetchFn as typeof fetch}),/Unsupported Azure language pair/);
 assert.equal(requests,1,"identical source-target pair makes no external call");
});
