import test from "node:test";
import assert from "node:assert/strict";
import {compareLiveDates,inspectLiveDates,proveDeployedDates,readRevisionDateMap} from "../scripts/live-lastmod-proof.mjs";
const origin="https://tractorvs.com",sha="a".repeat(40),date="2026-11-25T12:00:00.000Z";
const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const paths=locales.flatMap(l=>{const p=l==="en"?"":"/"+l;return [p+"/tractors/",p+"/tractors/test-abcd1234/"];});
const files=["sitemap-0.xml","forum-sitemap.xml","image-sitemap.xml"].map(p=>origin+"/"+p);
const indexXml="<sitemapindex>"+files.map(x=>"<sitemap><loc>"+x+"</loc></sitemap>").join("")+"</sitemapindex>";
const dateMap={version:1,dates:{"/tractors/":date}};
const makeChildren=()=>new Map([[files[0],"<urlset>"+paths.map(p=>"<url><loc>"+origin+p+"</loc>"+(p==="/tractors/"?"<lastmod>"+date+"</lastmod>":"")+"</url>").join("")+"</urlset>"],[files[1],"<urlset></urlset>"],[files[2],"<urlset></urlset>"]]);
test("live XML date proof verifies every HTML route but never forum or image dates",()=>{
 const children=makeChildren(),proof=compareLiveDates({indexXml,children,dateMap});
 assert.equal(proof.verifiedPages,20);assert.equal(proof.datedPages,1);assert.deepEqual(proof.mismatches,[]);
 children.set(files[0],children.get(files[0]).replace(date,"2026-11-24T12:00:00.000Z"));
 assert.deepEqual(compareLiveDates({indexXml,children,dateMap}).mismatches,["/tractors/"]);
});
test("read-only release proof does not grade stale or changing deployment",async()=>{
 const children=makeChildren();
 let homes=0;const mock=({stale=false,changing=false}={})=>async(url,opts)=>{
  assert.equal(opts.redirect,"error");
  const p=new URL(url).pathname;
  if(p==="/"){homes++;const observed=stale||changing&&homes===2?"b".repeat(40):sha;return new Response('<meta name="tractorvs-release-sha" content="'+observed+'">',{headers:{"Content-Type":"text/html"}});}
  return new Response(p==="/sitemap-index.xml"?indexXml:children.get(url),{headers:{"Content-Type":"application/xml"}});
 };
 const good=await inspectLiveDates({target:sha,dateMap,fetchFn:mock()});assert.equal(good.status,"verified");assert.equal(good.verifiedPages,20);
 homes=0;const stale=await inspectLiveDates({target:sha,dateMap,fetchFn:mock({stale:true})});assert.equal(stale.status,"deployment_pending");assert.equal(stale.verifiedPages,0);assert.equal(homes,1);
 homes=0;const change=await inspectLiveDates({target:sha,dateMap,fetchFn:mock({changing:true})});assert.equal(change.status,"deployment_changed");assert.equal(change.verifiedPages,0);
});

test("production proof waits for deployment; compares verified descendant with its own ledger",async()=>{
 const next="b".repeat(40),children=makeChildren();
 let homeCalls=0,readCalls=0;
 const mock=async(url)=>{
  if(new URL(url).pathname==="/"){homeCalls++;return new Response('<meta name="tractorvs-release-sha" content="'+(homeCalls===1?"c".repeat(40):next)+'">',{headers:{"Content-Type":"text/html"}});}
  return new Response(url.endsWith("sitemap-index.xml")?indexXml:children.get(url),{headers:{"Content-Type":"application/xml"}});
 };
 const proof=await proveDeployedDates({target:sha,dateMap:{version:1,dates:{}},fetchFn:mock,acceptDescendant:async(a,b)=>a===sha&&b===next,readMap:async(s)=>{readCalls++;assert.equal(s,next);return dateMap;},attempts:2,pause:async()=>{}});
 assert.equal(proof.status,"verified");assert.equal(proof.requestedTarget,sha);assert.equal(proof.observed,next);assert.equal(readCalls,1);
});
test("unverified descendant cannot trigger ledger or sitemap reads",async()=>{
 let calls=0;
 const proof=await proveDeployedDates({target:sha,dateMap,attempts:2,pause:async()=>{},fetchFn:async(url)=>{calls++;assert.equal(url,origin+"/");return new Response('<meta name="tractorvs-release-sha" content="'+"b".repeat(40)+'">',{headers:{"Content-Type":"text/html"}});},readMap:async()=>{throw Error("unexpected ledger read");}});
 assert.equal(proof.status,"deployment_pending");assert.equal(proof.verifiedPages,0);assert.equal(calls,2);
});
test("exact ledger reads are limited to the immutable reviewed repository path",async()=>{
 const result=await readRevisionDateMap(sha,{token:"test",fetchFn:async(url,opts)=>{
  assert.equal(url,"https://api.github.com/repos/onuronkol2-collab/tractorcompare-data/contents/site/src/data/sitemap-lastmod.json?ref="+sha);
  assert.equal(opts.redirect,"error");return Response.json(dateMap);
 }});assert.deepEqual(result,dateMap);
 await assert.rejects(readRevisionDateMap("main"),/Invalid ledger revision/);
});
