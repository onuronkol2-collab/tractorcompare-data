import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";
import {resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";

const fileId="valtra-n135-beef7a3c";
const path=(size)=>"/images/tractors/"+fileId+"-"+size+".jpg";
const upstream1920=resolveApprovedPhotoSource(path(1920));
const upstream960=resolveApprovedPhotoSource(path(960));
const jpg=()=>new Response(new Uint8Array([255,216,255,217]),{
  status:200,headers:{"content-type":"image/jpeg"}
});
const env={
  ASSETS:{fetch:async()=>new Response("not found",{status:404})}
};
async function withFetch(fake,fn){
  const old=globalThis.fetch;
  globalThis.fetch=fake;
  try{return await fn()}finally{globalThis.fetch=old;}
}

test("valid approved 1920px Wikimedia image keeps high-quality first choice and caching",async()=>{
  const calls=[];
  await withFetch(async url=>{calls.push(String(url));return jpg();},async()=>{
    const r=await worker.fetch(new Request("https://tractorvs.com"+path(1920)),env);
    assert.equal(r.status,200);
    assert.equal(r.headers.get("Content-Type"),"image/jpeg");
    assert.equal(r.headers.get("X-TractorVS-Image-Fallback"),null);
    assert.match(r.headers.get("Cache-Control"),/s-maxage=604800/);
  });
  assert.deepEqual(calls,[upstream1920]);
});

test("failed 1920px source falls back only to the same approved 960px file with short cache",async()=>{
  const calls=[];
  await withFetch(async url=>{
    calls.push(String(url));
    if(String(url)===upstream1920)return new Response("temporary upstream error",{status:502});
    if(String(url)===upstream960)return jpg();
    throw Error("Unapproved upstream URL: "+url);
  },async()=>{
    const r=await worker.fetch(new Request("https://tractorvs.com"+path(1920)),env);
    assert.equal(r.status,200);
    assert.equal(r.headers.get("Content-Type"),"image/jpeg");
    assert.equal(r.headers.get("X-TractorVS-Image-Fallback"),"960");
    assert.match(r.headers.get("Cache-Control"),/s-maxage=1800/);
    assert.equal((await r.arrayBuffer()).byteLength,4);
  });
  assert.deepEqual(calls,[upstream1920,upstream960]);
});

test("wrong 1920px content-type also uses approved 960px source, without serving HTML as JPG",async()=>{
  const calls=[];
  await withFetch(async url=>{
    calls.push(String(url));
    return String(url)===upstream1920
      ? new Response("<html>Not found</html>",{status:200,headers:{"content-type":"text/html"}})
      : jpg();
  },async()=>{
    const r=await worker.fetch(new Request("https://tractorvs.com"+path(1920)),env);
    assert.equal(r.status,200);
    assert.equal(r.headers.get("X-TractorVS-Image-Fallback"),"960");
  });
  assert.deepEqual(calls,[upstream1920,upstream960]);
});

test("both sources unavailable remains HTTP 502/no-store rather than leaking upstream errors",async()=>{
  await withFetch(async()=>new Response("unavailable",{status:502}),async()=>{
    const r=await worker.fetch(new Request("https://tractorvs.com"+path(1920)),env);
    assert.equal(r.status,502);
    assert.equal(r.headers.get("Cache-Control"),"no-store");
    assert.doesNotMatch(await r.text(),/upload\.wikimedia\.org/);
  });
});

test("a 960px request does not change resolution or try an unapproved fallback",async()=>{
  const calls=[];
  await withFetch(async url=>{calls.push(String(url));return jpg();},async()=>{
    const r=await worker.fetch(new Request("https://tractorvs.com"+path(960)),env);
    assert.equal(r.status,200);
    assert.equal(r.headers.get("X-TractorVS-Image-Fallback"),null);
  });
  assert.deepEqual(calls,[upstream960]);
});

test("unknown or modified photo paths do not trigger any external fetch",async()=>{
  const calls=[];
  await withFetch(async url=>{calls.push(String(url));throw Error("unexpected network");},async()=>{
    for(const bad of [
      "/images/tractors/unknown-1920.jpg",
      "/images/tractors/"+fileId+"-1930.jpg",
      "/images/tractors/https:evil-1920.jpg"
    ]){
      const r=await worker.fetch(new Request("https://tractorvs.com"+bad),env);
      assert.equal(r.status,404);
    }
    const badMethod=await worker.fetch(new Request("https://tractorvs.com"+path(1920),{method:"POST"}),env);
    assert.equal(badMethod.status,405);
  });
  assert.deepEqual(calls,[]);
});

test("HEAD response from fallback keeps status and diagnostic header without a body",async()=>{
  await withFetch(async url=>String(url)===upstream1920
    ? new Response("not found",{status:404}):jpg(),async()=>{
    const r=await worker.fetch(new Request("https://tractorvs.com"+path(1920),{method:"HEAD"}),env);
    assert.equal(r.status,200);
    assert.equal(r.headers.get("X-TractorVS-Image-Fallback"),"960");
    assert.equal(await r.text(),"");
  });
});
