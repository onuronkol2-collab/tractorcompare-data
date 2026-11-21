import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {parseIndex,parsePageSitemap,changedUrls,validatePage,submitIndexNow,run,ORIGIN,KEY,KEY_URL,INDEXNOW_URL} from "./tractor-search-discovery.mjs";

const home=ORIGIN+"/";
const model=ORIGIN+"/tractors/sample-test/";
const added=ORIGIN+"/tr/tractors/new-model/";
const body=(url)=>'<html><head><link rel="canonical" href="'+url+'"></head><body><main>Real readable page</main></body></html>';
const children=()=>[
'<sitemapindex><sitemap><loc>'+ORIGIN+'/sitemap-0.xml</loc></sitemap></sitemapindex>',
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
   if(pages.includes(url))return new Response(body(url===badPage?home:url),{status:200});
   return new Response("missing",{status:404});
 };
 return {fetchFn,requests};
}
test("parsers accept canonical sitemap and reject other hosts or duplicate URLs",()=>{
 assert.deepEqual(parseIndex(children()[0]),[ORIGIN+"/sitemap-0.xml"]);
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
