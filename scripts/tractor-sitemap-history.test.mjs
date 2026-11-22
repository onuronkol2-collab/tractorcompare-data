import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {createHash} from "node:crypto";
import {significantContentDigest,deriveHistory,auditBuiltSitemap,extractPublishedUrls,ORIGIN} from "./tractor-sitemap-history.mjs";

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
 const childUrls=["sitemap-0.xml","forum-sitemap.xml","image-sitemap.xml"];
 writeFileSync(join(dist,"sitemap-index.xml"),'<sitemapindex>'+childUrls.map(x=>'<sitemap><loc>'+ORIGIN+'/'+x+'</loc></sitemap>').join("")+'</sitemapindex>');
 writeFileSync(join(dist,"sitemap-0.xml"),'<urlset><url><loc>'+a+'</loc></url><url><loc>'+b+'</loc></url></urlset>');
 writeFileSync(join(dist,"forum-sitemap.xml"),'<urlset><url><loc>'+ORIGIN+'/tr/forum/</loc></url></urlset>');
 writeFileSync(join(dist,"image-sitemap.xml"),'<urlset><url><loc>'+b+'</loc></url></urlset>');
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

test("unified index includes forum/image without polluting HTML content change ledger",()=>{
 const ctx=setup();
 try{
  assert.deepEqual(extractPublishedUrls(ctx.dist),[a,b].sort());
  const first=auditBuiltSitemap({...ctx,now:date1,minPages:2});
  assert.equal(first.pages,2,"Images/forum must never count as HTML lastmod records");
  const firstHistory=readFileSync(ctx.historyPath,"utf8");
  writeFileSync(join(ctx.dist,"image-sitemap.xml"),'<urlset><url><loc>'+a+'</loc></url></urlset>');
  writeFileSync(join(ctx.dist,"forum-sitemap.xml"),'<urlset><url><loc>'+ORIGIN+'/tr/forum/approved-topic/</loc></url></urlset>');
  const second=auditBuiltSitemap({...ctx,now:date2,minPages:2});
  assert.equal(second.significant_changes,0,"Sitemap changes are not rendered HTML changes");
  assert.equal(readFileSync(ctx.historyPath,"utf8"),firstHistory);
 }finally{rmSync(ctx.root,{recursive:true,force:true});}
});

test("missing one child, duplicate child, unexpected child or malformed XML fails closed",()=>{
 const ctx=setup();
 try{
  const base=readFileSync(join(ctx.dist,"sitemap-index.xml"),"utf8");
  writeFileSync(join(ctx.dist,"sitemap-index.xml"),base.replace("<sitemap><loc>"+ORIGIN+"/forum-sitemap.xml</loc></sitemap>",""));
  assert.throws(()=>extractPublishedUrls(ctx.dist),/Unexpected number of sitemaps|Root sitemap must contain/);
  writeFileSync(join(ctx.dist,"sitemap-index.xml"),base.replace("</sitemapindex>","<sitemap><loc>"+ORIGIN+"/sitemap-0.xml</loc></sitemap></sitemapindex>"));
  assert.throws(()=>extractPublishedUrls(ctx.dist),/Duplicate sitemap child/);
  writeFileSync(join(ctx.dist,"sitemap-index.xml"),base.replace("forum-sitemap.xml","private-sitemap.xml"));
  assert.throws(()=>extractPublishedUrls(ctx.dist),/Unexpected sitemap child URL/);
  writeFileSync(join(ctx.dist,"sitemap-index.xml"),base);
  writeFileSync(join(ctx.dist,"forum-sitemap.xml"),"not xml");
  assert.throws(()=>extractPublishedUrls(ctx.dist),/Missing generated urlset/);
 }finally{rmSync(ctx.root,{recursive:true,force:true});}
});


test("translation QA spec identity attributes never change significant content hashes",()=>{
  const original=sample(b,'<article class="model-spec-card"><h4>Engine rated power</h4><p>95 HP · ECE R120</p></article>');
  const id="a02c4df2-c719-5a26-abb2-6195cb8e23e5";
  const annotated=original.replace('class="model-spec-card"','class="model-spec-card" data-spec-id="'+id+'"');
  const initial=significantContentDigest(original,b);
  assert.equal(significantContentDigest(annotated,b),initial,
    "A nonvisible and valid QA spec identity cannot manufacture a new sitemap lastmod");
  assert.notEqual(significantContentDigest(annotated.replace("95 HP","105 HP"),b),initial,
    "Changing a real manufacturer value MUST change the content digest");
  assert.notEqual(significantContentDigest(annotated.replace("Engine rated power","Engine maximum power"),b),initial,
    "Changing a meaningful technical heading MUST change the content digest");
  assert.notEqual(significantContentDigest(annotated.replace("ECE R120","ISO 14396"),b),initial,
    "Changing technical measurement evidence MUST change the content digest");
  assert.notEqual(significantContentDigest(annotated.replace(id,"not-a-real-spec-id"),b),initial,
    "Unverified source identifiers cannot be silently ignored");
  assert.notEqual(significantContentDigest(annotated.replace('class="model-spec-card"','class="unrelated-card"'),b),initial,
    "Identity normalization is limited to the real spec-card class");
  assert.notEqual(significantContentDigest(annotated.replace(
    'data-spec-id="'+id+'"','data-spec-id="'+id+'" data-source="changed"'
  ),b),initial,"Other attributes are not exempt");
});

test("mass visible technical content changes still stop sitemap lastmod reconciliation",()=>{
  const previous={version:1,pages:{}},pages=[];
  for(let n=0;n<120;n++){
    const url=ORIGIN+"/tr/tractors/audited-model-"+n+"/";
    previous.pages[url]={digest:hash("original "+n),modified:null};
    pages.push([url,hash("different visible technical content "+n)]);
  }
  assert.throws(()=>deriveHistory({pages,previous,now:date2,minPages:100}),/Unusually broad rendered content changes/);
});

test("Astro CSS attribute after source ID cannot create fictitious sitemap changes",()=>{
  // Actual Astro component has scoped styles, which can inject a trailing
  // data-astro-cid-* attribute after author-supplied data-spec-id.
  const id="a02c4df2-c719-5a26-abb2-6195cb8e23e5";
  const card='<article class="model-spec-card" data-astro-cid-abc123=""><h4>Rated engine power</h4><p>95 HP · ECE R120</p></article>';
  const oldHtml=sample(b,card);
  const withQaId=sample(b,card.replace('class="model-spec-card"',
    'class="model-spec-card" data-spec-id="'+id+'"'));
  const baseline=significantContentDigest(oldHtml,b);
  assert.equal(significantContentDigest(withQaId,b),baseline,
    "QA marker before scoped Astro CSS attribute must be ignored");
  assert.notEqual(significantContentDigest(withQaId.replace("95 HP","105 HP"),b),baseline);
  assert.notEqual(significantContentDigest(withQaId.replace("ECE R120","ISO 14396"),b),baseline);
  assert.notEqual(significantContentDigest(withQaId.replace(id,"untrusted-id"),b),baseline,
    "malformed source identity cannot be silently removed");
  assert.notEqual(significantContentDigest(withQaId.replace("data-astro-cid-abc123","data-astro-cid-changed"),b),baseline,
    "all other attributes remain part of the provenance digest");

  // The marker may also appear after a scoped CSS attribute: order is not a
  // measure of editorial significance. A non-spec article is NOT exempt.
  const ordered=sample(b,'<article data-astro-cid-abc123="" class="model-spec-card"><h4>Power</h4></article>');
  assert.equal(significantContentDigest(ordered,b),
    significantContentDigest(ordered.replace('class="model-spec-card"',
      'class="model-spec-card" data-spec-id="'+id+'"'),b));
  const unrelated=sample(b,'<article class="other-card" data-astro-cid-abc123=""><h4>Power</h4></article>');
  assert.notEqual(significantContentDigest(unrelated,b),
    significantContentDigest(unrelated.replace('class="other-card"',
      'class="other-card" data-spec-id="'+id+'"'),b));
});
