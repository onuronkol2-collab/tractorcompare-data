import {test} from "node:test";
import assert from "node:assert/strict";
import {fingerprintPublicForum,runForumSync,validateAnon,validateScope} from "./tractor-forum-publication-autosync.mjs";
const repo="onuronkol2-collab/tractorcompare-data";
const anon="a."+Buffer.from(JSON.stringify({role:"anon"})).toString("base64url")+".c";
const service="a."+Buffer.from(JSON.stringify({role:"service_role"})).toString("base64url")+".c";
function response(rows,offset){
 if(rows.length===0)return new Response("[]",{status:200,headers:{"content-range":"*/0"}});
 const part=rows.slice(offset,offset+250);
 const code=rows.length>250?206:200;
 return new Response(JSON.stringify(part),{status:code,
  headers:{"content-range":String(offset)+"-"+String(offset+part.length-1)+"/"+rows.length}});
}
function mock({topics=[],replies=[],old=null,fail=false}={}){
 const calls=[];
 const fetchFn=async (address,opts={})=>{
  const url=new URL(address);
  calls.push({url:url.toString(),method:opts.method||"GET",body:opts.body});
  if(url.hostname.endsWith(".supabase.co")){
   if(fail)return new Response(JSON.stringify({error:"DB unavailable"}),{status:500});
   const rows=url.pathname.endsWith("tc_forum_localized_topics")?topics:replies;
   return response(rows,Number(url.searchParams.get("offset")||0));
  }
  if(url.hostname==="api.github.com"){
   if(opts.method==="PUT")return new Response(JSON.stringify({commit:{sha:"a".repeat(40)}}),{status:201});
   if(old===null)return new Response(JSON.stringify({message:"Not found"}),{status:404});
   return new Response(JSON.stringify({sha:"blob-sha",encoding:"base64",
    content:Buffer.from(JSON.stringify(old)).toString("base64")}),{status:200});
  }
  throw Error("Unexpected outbound endpoint");
 };
 return {fetchFn,calls};
}
const base={repo,ref:"refs/heads/main",jwt:anon,token:"fake-token"};
const topic={id:"6d6719e8-8c9b-4c9f-b1c8-1d9799a542ac",topic_id:"6d6719e8-8c9b-4c9f-b1c8-1d9799a542ac",
 locale:"tr",status:"published",body:"This is published and moderated.",seo_ready:false,slug:"tractor-question-6d6719e88c9b4c9fb1c81d9799a542ac"};
test("anon-only scope rejects service-role and wrong branch",()=>{
 assert.doesNotThrow(()=>validateAnon(anon));
 assert.throws(()=>validateAnon(service),/Non-anonymous/);
 assert.throws(()=>validateScope(repo,"refs/heads/feature"),/only/);
});
test("empty, moderated forum state is a valid read without exposing hidden records",async()=>{
 const m=mock();
 const result=await fingerprintPublicForum({jwt:anon,fetchFn:m.fetchFn});
 assert.equal(result.public_topics,0);
 assert.equal(result.public_replies,0);
 assert.match(result.fingerprint,/^[a-f0-9]{64}$/);
 assert.equal(m.calls.filter(c=>c.url.includes("supabase.co")).length,2);
});
test("initial empty state requests one revision only, never writes Supabase",async()=>{
 const a=mock(),res=await runForumSync({...base,fetchFn:a.fetchFn});
 assert.equal(res.changed,true);assert.equal(res.committed,true);
 assert.equal(a.calls.filter(c=>c.method==="PUT").length,1);
 assert.ok(a.calls.every(c=>c.method!=="POST"));
 assert.ok(a.calls.filter(c=>c.url.includes("supabase.co")).every(c=>c.method==="GET"));
 const snap=await fingerprintPublicForum({jwt:anon,fetchFn:mock().fetchFn});
 const b=mock({old:snap});
 const unchanged=await runForumSync({...base,fetchFn:b.fetchFn});
 assert.equal(unchanged.committed,false);
 assert.equal(b.calls.filter(c=>c.method==="PUT").length,0);
});
test("newly approved topic and removed harmful topic both trigger new static builds",async()=>{
 const newest=await fingerprintPublicForum({jwt:anon,fetchFn:mock({topics:[topic]}).fetchFn});
 const empty=await fingerprintPublicForum({jwt:anon,fetchFn:mock().fetchFn});
 assert.notEqual(newest.fingerprint,empty.fingerprint);
 const created=await runForumSync({...base,fetchFn:mock({topics:[topic],old:empty}).fetchFn,dryRun:true});
 assert.equal(created.changed,true);assert.equal(created.committed,false);
 const hidden=await runForumSync({...base,fetchFn:mock({old:newest}).fetchFn});
 assert.equal(hidden.changed,true);assert.equal(hidden.public_topics,0);
 assert.equal(hidden.committed,true);
});
test("unsafe read rejects incomplete refresh and never sends a commit",async()=>{
 const m=mock({fail:true});
 await assert.rejects(runForumSync({...base,fetchFn:m.fetchFn}),/HTTP 500/);
 assert.equal(m.calls.filter(c=>c.method==="PUT").length,0);
});

test("all 1001 localized records are read in five requests",async()=>{
 const topics=Array.from({length:1001},(_,i)=>({...topic,id:String(i)}));
 const m=mock({topics});
 const result=await fingerprintPublicForum({jwt:anon,fetchFn:m.fetchFn});
 assert.equal(result.public_topics,1001);
 assert.deepEqual(m.calls.filter(c=>c.url.includes("localized_topics")).map(c=>new URL(c.url).searchParams.get("offset")),["0","250","500","750","1000"]);
 topics[1000]=topics[0];
 await assert.rejects(fingerprintPublicForum({jwt:anon,fetchFn:mock({topics}).fetchFn}),/Duplicate/);
});
