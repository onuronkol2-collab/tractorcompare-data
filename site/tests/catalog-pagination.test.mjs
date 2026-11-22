import assert from "node:assert/strict";
import test from "node:test";
import { fetchPublicRows, fetchPublicRowsWithCountDriftRetry } from "../src/lib/catalog.ts";

const endpoint = new URL("https://db.example.supabase.co/rest/v1/tractorvs_public_specs?select=tractor_id&order=tractor_id.asc");

function mockPostgrest(total, { failOffset = null, shortPage = null, wrongRange = false } = {}) {
  const priorFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, options) => {
    const url = new URL(input);
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    requests.push({ offset, limit, headers:options.headers, select:url.searchParams.get("select") });
    if (failOffset === offset) {
      return new Response(JSON.stringify({code:"PGRST103", message:"Requested range not satisfiable"}), {
        status:416, headers:{"content-type":"application/json"}
      });
    }
    const length = Math.max(0, Math.min(shortPage ?? limit, total - offset));
    const rows = Array.from({length}, (_,n)=>({row:offset+n}));
    const start = wrongRange ? offset + 1 : offset;
    const range = length ? start + "-" + (start+length-1) : "*";
    const reportedTotal = options.headers.Prefer === "count=exact" ? total : "*";
    return new Response(JSON.stringify(rows), {status:200, headers:{
      "content-type":"application/json",
      "content-range":range + "/" + reportedTotal
    }});
  };
  return { requests, restore:()=>{globalThis.fetch=priorFetch;} };
}

async function run(total, opts) {
  const stub=mockPostgrest(total,opts);
  try {
    const rows=await fetchPublicRows(endpoint,"sb_publishable_test",false);
    return {rows,requests:stub.requests};
  } finally { stub.restore(); }
}

test("the empty catalogue is valid and requires only one request", async()=>{
  const {rows,requests}=await run(0);
  assert.equal(rows.length,0);
  assert.deepEqual(requests.map(r=>r.offset),[0]);
});

test("500 and 1000 exact multiples never request an out-of-range page", async()=>{
  for (const count of [500,1000]) {
    const {rows,requests}=await run(count);
    assert.equal(rows.length,count);
    assert.deepEqual(requests.map(r=>r.offset),count===500?[0]:[0,500]);
    assert.equal(requests[0].headers.Prefer,"count=exact");
    assert.equal(requests[0].select,"tractor_id");
    assert.ok(requests.every(r=>r.headers.Range===undefined && r.headers["Range-Unit"]===undefined));
  }
});

test("a non-multiple count reads the last short page", async()=>{
  const {rows,requests}=await run(1030);
  assert.equal(rows.length,1030);
  assert.deepEqual(requests.map(r=>r.offset),[0,500,1000]);
  assert.equal(rows.at(-1).row,1029);
});

test("an API-limited short page advances by rows actually received", async()=>{
  const {rows,requests}=await run(260,{shortPage:120});
  assert.equal(rows.length,260);
  assert.deepEqual(requests.map(r=>r.offset),[0,120,240]);
});

test("HTTP 416 remains a hard error (no partial published pages)",async()=>{
  const stub=mockPostgrest(1020,{failOffset:500});
  try {
    await assert.rejects(fetchPublicRows(endpoint,"sb_publishable_test",false),/HTTP 416 at offset 500/);
  } finally {stub.restore();}
});

test("mismatched Content-Range fails closed",async()=>{
  const stub=mockPostgrest(600,{wrongRange:true});
  try {
    await assert.rejects(fetchPublicRows(endpoint,"sb_publishable_test",false),/inconsistent row range/);
  } finally {stub.restore();}
});

test("public catalogue count drift restarts the COMPLETE read once; old rows cannot leak",async()=>{
 const original=globalThis.fetch;
 const requests=[];
 let firstVersion=true;
 globalThis.fetch=async input=>{
  const u=new URL(input),offset=Number(u.searchParams.get("offset"));
  requests.push(offset);
  if(firstVersion&&offset===500){
   firstVersion=false;
   return new Response("[]",{status:200,headers:{"content-range":"*/620","content-type":"application/json"}});
  }
  const total=firstVersion?620:590;
  const size=Math.max(0,Math.min(500,total-offset));
  const rows=Array.from({length:size},(_,i)=>({row:offset+i,version:firstVersion?"old":"new"}));
  const range=size?`${offset}-${offset+size-1}/${offset===0?total:"*"}`:`*/${total}`;
  return new Response(JSON.stringify(rows),{status:200,headers:{"content-range":range,"content-type":"application/json"}});
 };
 try {
  const rows=await fetchPublicRowsWithCountDriftRetry(endpoint,"sb_publishable_test",false);
  assert.equal(rows.length,590);
  assert.ok(rows.every(x=>x.version==="new"),"partial rows from the failed first pagination must be discarded");
  assert.deepEqual(requests,[0,500,0,500]);
 } finally{globalThis.fetch=original;}
});

test("count drift repeated on the second complete read remains a HARD failure",async()=>{
 const original=globalThis.fetch;
 const requests=[];
 globalThis.fetch=async input=>{
  const offset=Number(new URL(input).searchParams.get("offset"));
  requests.push(offset);
  const rows=offset===0?Array.from({length:500},(_,n)=>({row:n})):[];
  return new Response(JSON.stringify(rows),{status:200,headers:{
   "content-range":offset===0?"0-499/620":"*/620","content-type":"application/json"
  }});
 };
 try {
  await assert.rejects(
   fetchPublicRowsWithCountDriftRetry(endpoint,"sb_publishable_test",false),
   /catalogue count changed during the build/
  );
  assert.deepEqual(requests,[0,500,0,500],"only ONE restart allowed, never an infinite retry loop");
 } finally{globalThis.fetch=original;}
});

test("HTTP 416 and malformed row range are not retried or normalized away",async()=>{
 const original=globalThis.fetch;
 let calls=0;
 try {
  globalThis.fetch=async()=>{calls++;return new Response("[]",{status:416});};
  await assert.rejects(fetchPublicRowsWithCountDriftRetry(endpoint,"sb_publishable_test",false),/HTTP 416/);
  assert.equal(calls,1);
  calls=0;
  globalThis.fetch=async()=>{calls++;return new Response('[{"row":0}]',{status:200,headers:{
   "content-range":"3-3/1","content-type":"application/json"
  }});};
  await assert.rejects(fetchPublicRowsWithCountDriftRetry(endpoint,"sb_publishable_test",false),/inconsistent row range/);
  assert.equal(calls,1);
 } finally{globalThis.fetch=original;}
});
