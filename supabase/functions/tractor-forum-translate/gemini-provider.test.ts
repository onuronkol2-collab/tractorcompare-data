import {assert,assertEquals,assertRejects} from "jsr:@std/assert@1.0.14";
import {generateGeminiJson,requestBody} from "./gemini-provider.ts";

const schema={type:"object",properties:{title:{type:"string"},body:{type:"string"}},required:["title","body"]};
const ok={candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify({title:"A",body:"Verified text"})}]}}]};
const result=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{
 status,headers:{"content-type":"application/json"}
});
const anonMock=(handler:(url:string,init:RequestInit,count:number)=>Response|Promise<Response>)=>{
 const calls:Array<{url:string;init:RequestInit}>=[];
 const fn=async(input:RequestInfo|URL,init:RequestInit={}):Promise<Response>=>{
  const url=String(input);calls.push({url,init});return handler(url,init,calls.length);
 };
 return {calls,fn:fn as typeof fetch};
};
const props={apiKey:"inert-test-key",prompt:"Translate one TractorVS section",schema,deadline:Date.now()+100000};

Deno.test("generateContent request uses minimal thinking and bounded JSON output",()=>{
 const body=requestBody("Türkçe metin",schema);
 assertEquals(body.generationConfig.responseMimeType,"application/json");
 assertEquals(body.generationConfig.thinkingConfig.thinkingLevel,"MINIMAL");
 assertEquals(body.generationConfig.maxOutputTokens,4608);
 assertEquals(requestBody("Quality audit",schema,true).generationConfig.maxOutputTokens,1024);
 assertRejects(async()=>requestBody("x".repeat(14001),schema),Error,"Invalid bounded");
});

Deno.test("success uses one synchronous generateContent call without polling",async()=>{
 const m=anonMock(()=>result(ok));
 const out=await generateGeminiJson({...props,fetchFn:m.fn});
 assertEquals(out.model,"gemini-3.8-flash");
 assertEquals(out.value.title,"A");
 assertEquals(m.calls.length,1);
 assert(m.calls[0].url.endsWith("/models/gemini-3.8-flash:generateContent"));
 assertEquals(m.calls[0].init.method,"POST");
 const sent=JSON.parse(String(m.calls[0].init.body));
 assertEquals(sent.generationConfig.responseMimeType,"application/json");
 assertEquals(sent.generationConfig.thinkingConfig.thinkingLevel,"MINIMAL");
 assertEquals(sent.contents[0].parts[0].text,props.prompt);
 assertEquals((m.calls[0].init.headers as Record<string,string>)["x-goog-api-key"],props.apiKey);
});

Deno.test("temporary Gemini capacity failure falls back at most once",async()=>{
 const m=anonMock((_url,_init,count)=>count===1?result({error:"busy"},503):result(ok));
 const out=await generateGeminiJson({...props,fetchFn:m.fn});
 assertEquals(out.model,"gemini-3.6-flash");
 assertEquals(m.calls.length,2);
 assert(m.calls[1].url.includes("gemini-3.6-flash:generateContent"));
});

Deno.test("MAX_TOKENS output is never accepted or published",async()=>{
 const bad={candidates:[{finishReason:"MAX_TOKENS",content:{parts:[{text:'{"title":"x"'}]}}]};
 const m=anonMock((_url,_init,count)=>count===1?result(bad):result(ok));
 const out=await generateGeminiJson({...props,fetchFn:m.fn});
 assertEquals(out.model,"gemini-3.6-flash");
 assertEquals(m.calls.length,2);
});

Deno.test("malformed candidate falls back but refuses both failures",async()=>{
 const malformed={candidates:[{finishReason:"STOP",content:{parts:[{text:"{broken"}]}}]};
 const m=anonMock(()=>result(malformed));
 await assertRejects(()=>generateGeminiJson({...props,fetchFn:m.fn}),Error,"structured output malformed");
 assertEquals(m.calls.length,2);
});

Deno.test("invalid authorization and policy failures never cause paid retries",async()=>{
 for (const response of [result({error:"invalid key"},401),
  result({error:"bad schema"},400),result({candidates:[{finishReason:"SAFETY"}]})]){
  const m=anonMock(()=>response.clone());
  await assertRejects(()=>generateGeminiJson({...props,fetchFn:m.fn}));
  assertEquals(m.calls.length,1);
 }
});

Deno.test("existing request budget blocks provider calls before they begin",async()=>{
 const m=anonMock(()=>result(ok));
 await assertRejects(()=>generateGeminiJson({...props,deadline:Date.now()-1,fetchFn:m.fn}),
  Error,"budget exhausted");
 assertEquals(m.calls.length,0);
});

Deno.test("network failure can use only one authorized fallback",async()=>{
 const m=anonMock((_url,_init,n)=>{
  if(n===1)throw new Error("connection timed out");
  return result(ok);
 });
 const out=await generateGeminiJson({...props,fetchFn:m.fn});
 assertEquals(out.model,"gemini-3.6-flash");
 assertEquals(m.calls.length,2);
});
