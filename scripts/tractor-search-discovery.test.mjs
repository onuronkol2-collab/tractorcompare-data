import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {parseIndex,parsePageSitemap,changedUrls,validatePage,submitIndexNow,run,ORIGIN,KEY,KEY_URL,INDEXNOW_URL,INDEXNOW_FALLBACK_URLS,MAX_CHANGED_PER_RUN} from "./tractor-search-discovery.mjs";

const home=ORIGIN+"/";
const model=ORIGIN+"/tractors/sample-test/";
const added=ORIGIN+"/tr/tractors/new-model/";
const body=(url)=>'<html><head><link rel="canonical" href="'+url+'"></head><body><main>Real readable page</main></body></html>';
const children=()=>[
'<sitemapindex>'+[ORIGIN+'/sitemap-0.xml',ORIGIN+'/forum-sitemap.xml',ORIGIN+'/image-sitemap.xml'].map(u=>'<sitemap><loc>'+u+'</loc></sitemap>').join('')+'</sitemapindex>',
'<urlset><url><loc>'+home+'</loc></url><url><loc>'+model+'</loc></url></urlset>'
];
function mock({pages=[home,model],status=200,badPage=null}={}){
 const requests=[];
 const fetchFn=async(url,options={})=>{
   requests.push({url,options});
   if(url===INDEXNOW_URL)return new Response("",{status});
   if(url===KEY_URL)return new Response(KEY);
   if(url===ORIGIN+"/robots.txt")return new Response("User-agent: *\nAllow: /\nSitemap: "+ORIGIN+"/sitemap-index.xml");
   if(url===ORIGIN+"/sitemap-index.xml")return new Response(children()[0]);
   if(url===ORIGIN+"/sitemap-0.xml")
     return new Response('<urlset>'+pages.map(u=>'<url><loc>'+u+'</loc></url>').join("")+'</urlset>');
   if(url===ORIGIN+"/forum-sitemap.xml"||url===ORIGIN+"/image-sitemap.xml")
     return new Response('<urlset></urlset>',{status:200});
   if(pages.includes(url))return new Response(body(url===badPage?home:url),{status:200});
   return new Response("missing",{status:404});
 };
 return {fetchFn,requests};
}
test("parsers accept canonical sitemap and reject other hosts or duplicate URLs",()=>{
 assert.deepEqual(parseIndex(children()[0]),[ORIGIN+"/sitemap-0.xml",ORIGIN+"/forum-sitemap.xml",ORIGIN+"/image-sitemap.xml"]);
 assert.equal(parsePageSitemap(children()[1]).size,2);
 assert.throws(()=>parsePageSitemap('<urlset><url><loc>https://evil.example/</loc></url></urlset>'));
 assert.throws(()=>parsePageSitemap('<urlset><url><loc>'+home+'</loc></url><url><loc>'+home+'</loc></url></urlset>'));
});
test("only newly published URLs or trustworthy changed lastmod are queued",()=>{
 const prev={[home]:null,[model]:"2026-11-18"};
 const current=new Map([[home,null],[model,"2026-11-19"],[added,null]]);
 assert.deepEqual(changedUrls(prev,current),[model,added]);
});
test("same-day trustworthy lastmod timestamps trigger a new notification",()=>{
 const today="2026-11-21T13:00:00.000Z",later="2026-11-21T17:00:00.000Z";
 const xml='<urlset><url><loc>'+home+'</loc><lastmod>'+later+'</lastmod></url></urlset>';
 const entries=parsePageSitemap(xml);
 assert.equal(entries.get(home),later);
 assert.deepEqual(changedUrls({[home]:today},entries),[home]);
 assert.deepEqual(changedUrls({[home]:later},entries),[]);
});

test("indexable URL must have matching canonical and main landmark",()=>{
 assert.equal(validatePage(body(home),home),true);
 assert.throws(()=>validatePage('<meta name="robots" content="noindex">'+body(home),home));
 assert.throws(()=>validatePage(body(model),home));
});
test("first live run establishes checkpoint and does not flood IndexNow",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-"));
 try{
   const statePath=join(dir,"state.json");
   const mocker=mock();
   const result=await run({fetchFn:mocker.fetchFn,statePath});
   assert.equal(result.mode,"baseline_only");
   assert.equal(result.historical_urls_baselined,2);
   assert.equal(result.new_or_modified,0);
   assert.equal(result.remaining,0);
   assert.equal(result.indexnow,"not_sent");
   assert.equal(JSON.parse(readFileSync(statePath,"utf8")).urls[home],null);
   assert.equal(mocker.requests.some(r=>r.url===INDEXNOW_URL),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("new live page after baseline is checked, sent exactly once, and checkpointed",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-"));
 try{
   const statePath=join(dir,"state.json");
   await run({fetchFn:mock().fetchFn,statePath});
   const m=mock({pages:[home,model,added]});
   const r=await run({fetchFn:m.fetchFn,statePath});
   assert.equal(r.new_or_modified,1);
   assert.equal(r.indexnow,"accepted");
   const post=m.requests.find(x=>x.url===INDEXNOW_URL);
   assert.deepEqual(JSON.parse(post.options.body).urlList,[added]);
   assert.equal(JSON.parse(readFileSync(statePath,"utf8")).urls[added],null);
   const second=await run({fetchFn:mock({pages:[home,model,added]}).fetchFn,statePath});
   assert.equal(second.new_or_modified,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("a failed API or canonical verification keeps changed URL pending",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-"));
 try{
   const statePath=join(dir,"state.json");
   await run({fetchFn:mock().fetchFn,statePath});
   await assert.rejects(()=>run({fetchFn:mock({pages:[home,model,added],status:429}).fetchFn,statePath}),/429/);
   assert.ok(!Object.hasOwn(JSON.parse(readFileSync(statePath,"utf8")).urls,added));
   await assert.rejects(()=>run({fetchFn:mock({pages:[home,model,added],badPage:added}).fetchFn,statePath}),/canonical/);
   assert.ok(!Object.hasOwn(JSON.parse(readFileSync(statePath,"utf8")).urls,added));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("dry run never submits notifications or writes state",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-"));
 try{
   const statePath=join(dir,"state.json");
   const m=mock();
   const r=await run({fetchFn:m.fetchFn,statePath,dryRun:true});
   assert.equal(r.mode,"baseline_only");
   assert.equal(m.requests.some(x=>x.url===INDEXNOW_URL),false);
   assert.throws(()=>readFileSync(statePath));
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test("a master sitemap missing independent forum or image XML cannot advance IndexNow checkpoint",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-root-"));
 try{
  const good=mock();
  const checkpoint=join(dir,"state.json");
  const broken=async(url,options)=>{
   if(url===ORIGIN+"/sitemap-index.xml")return new Response('<sitemapindex><sitemap><loc>'+ORIGIN+'/sitemap-0.xml</loc></sitemap></sitemapindex>');
   return good.fetchFn(url,options);
  };
  await assert.rejects(()=>run({fetchFn:broken,statePath:checkpoint}),/must contain HTML, forum and image/);
  assert.throws(()=>readFileSync(checkpoint),"Do not move watermark on incomplete sitemap");
  assert.equal(good.requests.some(x=>x.url===INDEXNOW_URL),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("image sitemap duplicates do not add to public notifications",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-dupe-"));
 const checkpoint=join(dir,"state.json");
 try{
  const base=mock();
  const withImage=async(url,opts)=>{
   if(url===ORIGIN+"/image-sitemap.xml")
     return new Response('<urlset><url><loc>'+home+'</loc></url></urlset>');
   return base.fetchFn(url,opts);
  };
  const result=await run({fetchFn:withImage,statePath:checkpoint});
  assert.equal(result.historical_urls_baselined,2,"Image duplicates must not inflate page coverage");
  assert.equal(result.indexnow,"not_sent");
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test("transient shared IndexNow outage fails over once and preserves identical validated payload",async()=>{
 const requests=[];
 const fetchFn=async(url,options)=>{
  requests.push({url,options});
  return new Response("",{status:url===INDEXNOW_URL?503:200});
 };
 const result=await submitIndexNow([added],{fetchFn});
 assert.equal(result.status,"accepted");
 assert.equal(result.endpoint,INDEXNOW_FALLBACK_URLS[0]);
 assert.deepEqual(requests.map(x=>x.url),[INDEXNOW_URL,INDEXNOW_FALLBACK_URLS[0]]);
 assert.equal(requests[0].options.body,requests[1].options.body);
 assert.deepEqual(JSON.parse(requests[0].options.body).urlList,[added]);
});
test("a shared IndexNow HTTP 202 is acknowledged provisionally without duplicate sends",async()=>{
 const attempts=[];
 const result=await submitIndexNow([added],{fetchFn:async(url)=>{
  attempts.push(url);return new Response("",{status:202});
 }});
 assert.equal(result.status,"received_pending_key_validation");
 assert.equal(result.endpoint,INDEXNOW_URL);
 assert.deepEqual(attempts,[INDEXNOW_URL]);
});
test("HTTP 429, ownership and invalid-payload 4xx must not fail over to another engine",async()=>{
 for(const status of [400,403,422,429]){
  const attempts=[];
  await assert.rejects(()=>submitIndexNow([added],{fetchFn:async(url)=>{
   attempts.push(url);return new Response("",{status});
  }}),new RegExp(String(status)));
  assert.deepEqual(attempts,[INDEXNOW_URL]);
 }
});
test("all transient IndexNow endpoints failing preserves pending notification checkpoint",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-failover-"));
 try{
  const statePath=join(dir,"state.json");
  await run({fetchFn:mock().fetchFn,statePath});
  const network=mock({pages:[home,model,added]});
  const apiCalls=[];
  const failover=async(url,options)=>{
   if([INDEXNOW_URL,...INDEXNOW_FALLBACK_URLS].includes(url)){
    apiCalls.push(url);return new Response("",{status:503});
   }
   return network.fetchFn(url,options);
  };
  await assert.rejects(()=>run({fetchFn:failover,statePath}),/All IndexNow endpoints unavailable/);
  assert.equal(apiCalls.length,4);
  assert.equal(Object.hasOwn(JSON.parse(readFileSync(statePath,"utf8")).urls,added),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});


test("bounded 120-per-hour batch drains a large genuine change queue without duplicates",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-backlog-"));
 const statePath=join(dir,"state.json");
 try{
  assert.equal(MAX_CHANGED_PER_RUN,120);
  await run({fetchFn:mock().fetchFn,statePath});
  const newUrls=Array.from({length:127},(_,i)=>ORIGIN+"/tr/tractors/new-"+i+"/");
  const livePages=[home,model,...newUrls];
  const first=mock({pages:livePages});
  const a=await run({fetchFn:first.fetchFn,statePath});
  assert.equal(a.indexnow,"accepted");
  assert.equal(a.max_urls_per_run,120);
  assert.equal(a.checked,120);
  assert.equal(a.remaining,7);
  assert.equal(a.indexnow_sent,120);
  assert.equal(a.indexnow_http,200);
  const firstRequests=first.requests.filter(x=>x.url===INDEXNOW_URL);
  assert.equal(firstRequests.length,1);
  const sentA=JSON.parse(firstRequests[0].options.body).urlList;
  assert.equal(sentA.length,120);
  assert.equal(new Set(sentA).size,120);
  const second=mock({pages:livePages});
  const b=await run({fetchFn:second.fetchFn,statePath});
  assert.equal(b.checked,7);
  assert.equal(b.remaining,0);
  assert.equal(b.indexnow_sent,7);
  const sentB=JSON.parse(second.requests.find(x=>x.url===INDEXNOW_URL).options.body).urlList;
  assert.equal(sentB.length,7);
  assert.equal(new Set([...sentA,...sentB]).size,127);
  const complete=mock({pages:livePages});
  const done=await run({fetchFn:complete.fetchFn,statePath});
  assert.equal(done.new_or_modified,0);
  assert.equal(done.checked,0);
  assert.equal(done.indexnow_sent,0);
  assert.equal(complete.requests.some(x=>x.url===INDEXNOW_URL),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test("failed rate-limited large-batch IndexNow request cannot advance 120 verified URLs",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-seo-rate-"));
 const statePath=join(dir,"state.json");
 try{
  await run({fetchFn:mock().fetchFn,statePath});
  const pages=[home,model,...Array.from({length:125},(_,i)=>ORIGIN+"/tr/tractors/pending-"+i+"/")];
  const m=mock({pages,status:429});
  await assert.rejects(()=>run({fetchFn:m.fetchFn,statePath}),/429/);
  const saved=JSON.parse(readFileSync(statePath,"utf8")).urls;
  assert.equal(Object.keys(saved).length,2);
  assert.equal(m.requests.filter(x=>x.url===INDEXNOW_URL).length,1);
  assert.equal(m.requests.filter(x=>INDEXNOW_FALLBACK_URLS.includes(x.url)).length,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
