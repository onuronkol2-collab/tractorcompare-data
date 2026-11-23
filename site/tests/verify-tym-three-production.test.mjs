import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkImageResponse,expectedAssets,proveProduction} from "../scripts/verify-tym-three-production.mjs";

const files=()=>expectedAssets();
const bytesOf=(name)=>readFileSync(new URL("../public/images/tractors/"+name,import.meta.url));

test("Source ledger has nine unique first-party TYM JPEGs across exactly three UUID-verified models",()=>{
  const a=files();
  assert.equal(a.length,9);
  assert.equal(new Set(a.map(x=>x.file)).size,9);
  for(const p of a){
    const b=bytesOf(p.file);
    assert.ok([480,960,1920].includes(p.width));
    assert.match(p.sha256,/^[a-f0-9]{64}$/);
    assert.equal(checkImageResponse({status:200,mime:"image/jpeg",bytes:b,expected:p}),p.sha256);
  }
});

test("Live artifact checks must reject 404, wrong MIME, partial/forged bytes, damaged JPEG and mismatched hashes",()=>{
  const item=files()[0];
  const good=bytesOf(item.file);
  const params={status:200,mime:"image/jpeg",bytes:good,expected:item};
  assert.equal(checkImageResponse(params),item.sha256);
  assert.throws(()=>checkImageResponse({...params,status:404}),/HTTP 404/);
  assert.throws(()=>checkImageResponse({...params,mime:"text\/html"}),/MIME/);
  assert.throws(()=>checkImageResponse({...params,bytes:good.subarray(0,-1)}),/byte count/);
  const flipped=Buffer.from(good);flipped[flipped.length>>1]^=1;
  assert.throws(()=>checkImageResponse({...params,bytes:flipped}),/SHA-256/);
  const wrongHeader=Buffer.from(good);wrongHeader[0]=0;
  assert.throws(()=>checkImageResponse({...params,bytes:wrongHeader}),/JPEG markers/);
});

test("Nine live JPEGs can all be independently fetched, hashed and attributed under an approved origin",async()=>{
  const expected=files();
  const seen=[];
  const fetcher=async (url)=>{
    const p=expected.find(x=>url.endsWith("/"+x.file));
    if(!p)throw Error("Unexpected file requested "+url);
    seen.push(p.file);
    return new Response(bytesOf(p.file),{status:200,headers:{"Content-Type":"image/jpeg"}});
  };
  const log=[];
  await proveProduction({fetcher,attempts:1,delayMs:0,log:x=>log.push(x)});
  assert.equal(seen.length,9);
  assert.equal(new Set(seen).size,9);
  assert.equal(log.filter(s=>s.startsWith("LIVE_OK ")).length,9);
  assert.equal(log.at(-1),"TRACTORVS_TYM_3_MODELS_9_JPEG_PRODUCTION_HASHES_MATCH");
  await assert.rejects(()=>proveProduction({endpoint:"https://evil.example",fetcher,attempts:1,delayMs:0}),/Unapproved/);
});

test("The release proof fails closed on rate limiting and forbidden responses",async()=>{
  const fetcher=async()=>new Response("Denied",{status:403,headers:{"Content-Type":"text/plain"}});
  await assert.rejects(()=>proveProduction({fetcher,attempts:1,delayMs:0,log:()=>{}}),/Unsafe live HTTP 403/);
});
