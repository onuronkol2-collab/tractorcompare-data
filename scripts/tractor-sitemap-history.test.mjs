import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {createHash} from "node:crypto";
import {significantContentDigest,deriveHistory,auditBuiltSitemap,ORIGIN} from "./tractor-sitemap-history.mjs";

const a=ORIGIN+"/", b=ORIGIN+"/tr/tractors/safe-model/";
const hash=s=>createHash("sha256").update(s).digest("hex");
const date1=new Date("2026-11-21T13:00:00Z"),date2=new Date("2026-11-22T15:30:00Z");
const sample=(url,body="Authoritative tractor information")=>
 '<!doctype html><html><head><title>Real title</title><link rel="canonical" href="'+url+'">'+
 '<meta name="description" content="Published evidence-backed page"></head><body><main><h1>Tractor</h1><p>'+body+'</p></main></body></html>';
function setup(){
 const root=mkdtempSync(join(tmpdir(),"tractorvs-sitemap-"));
 const dist=join(root,"dist");mkdirSync(dist,{recursive:true});
 const historyPath=join(root,"state.json"),lastmodPath=join(root,"lastmod.json");
 const write=(url,body)=>{
   const path=join(dist,new URL(url).pathname.slice(1),"index.html");
   mkdirSync(dirname(path),{recursive:true});writeFileSync(path,sample(url,body));
 };
 write(a,"Real homepage");write(b,"Real tractor page");
 writeFileSync(join(dist,"sitemap-index.xml"),'<sitemapindex><sitemap><loc>'+ORIGIN+'/sitemap-0.xml</loc></sitemap></sitemapindex>');
 writeFileSync(join(dist,"sitemap-0.xml"),'<urlset><url><loc>'+a+'</loc></url><url><loc>'+b+'</loc></url></urlset>');
 return {root,dist,historyPath,lastmodPath,write};
}
test("significant-content hash ignores whitespace-only changes but detects content changes",()=>{
 const html=sample(b,"Some   verified   data");
 assert.equal(significantContentDigest(html,b),significantContentDigest(html.replace("Some   verified   data","Some verified data"),b));
 assert.notEqual(significantContentDigest(html,b),significantContentDigest(sample(b,"Other supported data"),b));
 assert.throws(()=>significantContentDigest(sample(b).replace('rel="canonical" href="'+b+'"','rel="canonical" href="'+a+'"'),b));
 assert.throws(()=>significantContentDigest(sample(b).replace("<main>","<main><meta name='robots' content='noindex'>"),b),/Noindex/);
});
test("first build seeds provenance hashes without inventing old modification dates",()=>{
 const ctx=setup();
 try{
  const r=auditBuiltSitemap({...ctx,now:date1,minPages:2});
  assert.equal(r.baseline,true);assert.equal(r.dated_pages,0);
  assert.deepEqual(JSON.parse(readFileSync(ctx.lastmodPath)).dates,{});
  assert.equal(Object.keys(JSON.parse(readFileSync(ctx.historyPath)).pages).length,2);
 }finally{rmSync(ctx.root,{recursive:true,force:true});}
});
test("only genuinely changed/new rendered pages gain accurate persistent lastmod",()=>{
 const ctx=setup();
 try{
   auditBuiltSitemap({...ctx,now:date1,minPages:2});
   ctx.write(b,"Substantial corrected tractor engine specification");
   const r=auditBuiltSitemap({...ctx,now:date2,minPages:2});
   assert.equal(r.significant_changes,1);assert.equal(r.dated_pages,1);
   let map=JSON.parse(readFileSync(ctx.lastmodPath)).dates;
   assert.equal(map["/tr/tractors/safe-model/"],date2.toISOString());
   assert.equal(map["/"],undefined);
   const repeat=auditBuiltSitemap({...ctx,now:new Date("2026-11-24T10:00:00Z"),minPages:2});
   assert.equal(repeat.significant_changes,0);
   map=JSON.parse(readFileSync(ctx.lastmodPath)).dates;
   assert.equal(map["/tr/tractors/safe-model/"],date2.toISOString());
 }finally{rmSync(ctx.root,{recursive:true,force:true});}
});
test("fail closed on sudden mass unpublishing and unreadable content",()=>{
 const h={version:1,pages:{[a]:{digest:hash("a"),modified:null},[b]:{digest:hash("b"),modified:null}}};
 assert.throws(()=>deriveHistory({pages:[[a,hash("a")]],previous:h,minPages:1,now:date1}),/shrinking/);
 assert.throws(()=>deriveHistory({pages:[[a,"invalid"],[b,hash("ok")]],previous:h,minPages:1,now:date1}),/digest/);
});
