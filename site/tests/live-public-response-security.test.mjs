import test from "node:test";
import assert from "node:assert/strict";
import worker,{finalizeEdgeResponse} from "../worker/index.js";
import {inspectPublicPage,inspectCatalogParity,modelSlugs,CATALOG_PATHS} from "../scripts/live-public-response.mjs";
const origin="https://tractorvs.com", env={ASSETS:{fetch:async()=>new Response("asset",{headers:{"Content-Type":"text/html","Cache-Control":"public, max-age=120"}})}};
const check=(response)=>{assert.equal(response.headers.get("x-content-type-options"),"nosniff");assert.equal(response.headers.get("referrer-policy"),"strict-origin-when-cross-origin");};
test("Worker responses have same baseline as assets without changing redirects, cookies or cache",async()=>{
 for(const path of ["/language/tr/","/sitemap.xml","/api/visitor-country","/images/tractors/not-allowed.jpg","/language/unknown/"]){
  const res=await worker.fetch(new Request(origin+path),env);check(res);
  if(res.status>=400)assert.equal(res.headers.get("cache-control"),"no-store");
  if(path==="/language/tr/"){assert.equal(res.status,302);assert.match(res.headers.get("set-cookie"),/HttpOnly/);assert.equal(res.headers.get("location"),"/tr/");}
  if(path==="/sitemap.xml"){assert.equal(res.status,308);assert.equal(res.headers.get("location"),origin+"/sitemap-index.xml");}
 }
});
test("HEAD errors have no body, rejected methods advertise allowed methods and never cache",async()=>{
 for(const path of ["/language/tr/","/sitemap.xml","/api/visitor-country","/images/tractors/not-allowed.jpg"]){
  const head=await worker.fetch(new Request(origin+path,{method:"HEAD"}),env);check(head);assert.equal(await head.text(),"");
  const bad=await worker.fetch(new Request(origin+path,{method:"POST"}),env);check(bad);assert.equal(bad.status,405);assert.equal(bad.headers.get("allow"),"GET, HEAD");assert.equal(bad.headers.get("cache-control"),"no-store");
 }
});
test("existing stronger policy, MIME, stream, cache and 304 are preserved",async()=>{
 const req=new Request(origin+"/file");
 const response=finalizeEdgeResponse(req,new Response("bytes",{headers:{"Referrer-Policy":"no-referrer","Content-Type":"image/jpeg","Cache-Control":"public, max-age=600","X-TractorVS-Image-Source":"local"}}));
 assert.equal(response.headers.get("referrer-policy"),"no-referrer");assert.equal(response.headers.get("content-type"),"image/jpeg");assert.equal(response.headers.get("cache-control"),"public, max-age=600");assert.equal(response.headers.get("x-tractorvs-image-source"),"local");assert.equal(await response.text(),"bytes");
 assert.equal(finalizeEdgeResponse(req,new Response(null,{status:304})).status,304);
});
const html=path=>'<html><head><link href="'+origin+path+'" rel="canonical"></head><body><main><h1>Catalog</h1></main></body></html>';
const input={path:"/tr/",status:200,finalPath:"/tr/",contentType:"text/html; charset=UTF-8",body:html("/tr/"),production:true};
test("live canonical response rejects redirects, soft failures, noindex, incorrect MIME and canonical",()=>{
 assert.deepEqual(inspectPublicPage(input),[]);
 for(const [patch,reason] of [[{status:404},"http-status:404"],[{finalPath:"/"},"unexpected-final-path"],[{contentType:"text/plain"},"html-mime"],[{body:html("/")},"canonical-mismatch"],[{headerRobots:"noindex"},"noindex"],[{body:input.body.replace("<head>","<head><meta content='noindex' name='robots'>")},"noindex"],[{body:input.body.replace("<main>","<div>")},"missing-main"]])assert.ok(inspectPublicPage({...input,...patch}).includes(reason));
});
test("public catalog parity checks all ten locales without truncating beyond 500 KB",()=>{
 const slug="verified-model-abcd1234/";
 const paths=new Map(CATALOG_PATHS.map(path=>[path,modelSlugs(" ".repeat(600000)+'<a href="'+path+slug+'">Model</a><a href="'+path+'">Catalog</a>',path)]));
 assert.deepEqual(inspectCatalogParity(paths),[]);
 paths.set("/ja/tractors/",[]);assert.equal(inspectCatalogParity(paths)[0].path,"/ja/tractors/");
});
