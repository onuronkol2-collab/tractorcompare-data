import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {createHash} from "node:crypto";
import {significantContentDigest,deriveHistory,auditBuiltSitemap,extractPublishedUrls,migrateDigestCheckpoint,DIGEST_ALGORITHM,historicalModelSlugs,prepareHistoricalCatalogSource,verifyRebuiltCheckpoint,ORIGIN} from "./tractor-sitemap-history.mjs";

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

test("exact PR497 review allows only one tracked mass model-copy reconciliation",()=>{
  const previous={version:1,pages:{}},pages=[];
  for(let n=0;n<3100;n++){
    const url=ORIGIN+"/tr/tractors/reviewed-model-"+n+"/";
    previous.pages[url]={digest:hash("prior model "+n),modified:null};
    pages.push([url,hash("source copy update "+n)]);
  }
  previous.pages[a]={digest:hash("stable homepage"),modified:null};
  pages.push([a,hash("stable homepage")]);
  const newPage=ORIGIN+"/tr/articles/new-approved-guide/";
  pages.push([newPage,hash("real new article")]);
  assert.throws(()=>deriveHistory({pages,previous,now:date2,minPages:100}),
    /manual SEO review/,"No automatic approval despite matching page set");
  const approved=deriveHistory({pages,previous,now:date2,minPages:100,reviewedPr497Copy:true});
  assert.equal(approved.summary.significant_changes,3101);
  assert.equal(approved.summary.new_pages,1);
  assert.equal(approved.summary.reviewed_bulk_copy_pr497,true);
  assert.equal(approved.history.reviewedBulkCopyPr497,true);
  assert.equal(approved.lastmod.dates["/tr/tractors/reviewed-model-1/"],date2.toISOString());
  assert.equal(approved.lastmod.dates["/"],undefined);
  const nextPages=pages.map(([url,digest])=>[url,hash("later visible change "+digest)]);
  assert.throws(()=>deriveHistory({pages:nextPages,previous:approved.history,
    now:new Date("2026-11-24T09:00:00Z"),minPages:100,reviewedPr497Copy:true}),
  /manual SEO review/,"Approval can never be reused to ignore a future mass edit");
});

test("reviewed PR497 still rejects partly changed model pages and unrelated mass changes",()=>{
  const previous={version:1,pages:{}},pages=[];
  for(let n=0;n<3100;n++){
    const url=ORIGIN+"/tr/tractors/model-"+n+"/";
    previous.pages[url]={digest:hash("old "+n),modified:null};
    pages.push([url,hash(n===0?"old "+n:"changed "+n)]);
  }
  assert.throws(()=>deriveHistory({pages,previous,now:date2,minPages:100,reviewedPr497Copy:true}),
    /manual SEO review/,"A partial model update is not the approved exact worldwide copy change");
  pages[0]=[pages[0][0],hash("changed 0")];
  for(let n=0;n<101;n++){
    const url=ORIGIN+"/tr/guides/changed-"+n+"/";
    previous.pages[url]={digest:hash("older "+n),modified:null};
    pages.push([url,hash("newer "+n)]);
  }
  assert.throws(()=>deriveHistory({pages,previous,now:date2,minPages:100,reviewedPr497Copy:true}),
    /manual SEO review/,"Unreviewed non-model changes remain blocked");
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
  assert.notEqual(significantContentDigest(withQaId.replace('data-spec-id="'+id+'"',
    'data-spec-id="'+id+'" data-spec-id="'+id+'"'),b),baseline,
    "duplicate source identity markers must remain visible to the content integrity hash");
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

test("exact one-time PR467 multilingual source correction gets truthful lastmod without weakening guard",()=>{
  const langs=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  const previous={version:1,pages:{},reviewedBulkCopyPr497:true},pages=[];
  for(const lang of langs)for(let n=0;n<390;n++){
    const prefix=lang==="en"?"/":"/"+lang+"/";
    const url=ORIGIN+prefix+"tractors/reviewed-model-"+n+"/";
    previous.pages[url]={digest:hash("original verified model "+lang+n),modified:date1.toISOString()};
    pages.push([url,hash("corrected independently reviewed source explanation "+lang+n)]);
  }
  for(let n=0;n<20;n++){
    const url=ORIGIN+"/tr/guides/real-guide-"+n+"/";
    previous.pages[url]={digest:hash("old guide "+n),modified:date1.toISOString()};
    pages.push([url,hash("updated actual guide "+n)]);
  }
  assert.throws(()=>deriveHistory({pages,previous,now:date2,reviewedPr467Copy:false}),/manual SEO review/);
  const approved=deriveHistory({pages,previous,now:date2,reviewedPr467Copy:true});
  assert.equal(approved.summary.significant_changes,3920);
  assert.equal(approved.summary.reviewed_bulk_copy_pr467,true);
  assert.equal(approved.summary.reviewed_bulk_copy_pr497,true);
  assert.equal(approved.lastmod.dates["/tr/tractors/reviewed-model-0/"],date2.toISOString());
  const changedAgain=pages.map(([url,digest])=>[url,hash("new unreviewed content "+digest)]);
  assert.throws(()=>deriveHistory({pages:changedAgain,previous:approved.history,
    now:new Date("2026-11-24T09:00:00Z"),reviewedPr467Copy:true}),/manual SEO review/,
    "Review authorization is consumed and can never authorize another broad modification");
  const missingLocale=pages.filter(([url])=>url!==ORIGIN+"/ja/tractors/reviewed-model-0/");
  assert.throws(()=>deriveHistory({pages:missingLocale,previous,now:date2,reviewedPr467Copy:true}),
    /manual SEO review/,"Every one of the ten exactly matched language cohorts is required");
  assert.throws(()=>deriveHistory({pages,previous:{...previous,reviewedBulkCopyPr497:false},
    now:date2,reviewedPr467Copy:true}),/manual SEO review/,"Previous reviewed source checkpoint is required");
});


test("sitemap provenance runs before shared HTML inputs merge, not just component edits",()=>{
  const workflow=readFileSync(new URL("../.github/workflows/tractorvs-sitemap-history.yml",import.meta.url),"utf8");
  const patterns=section=>[...section.matchAll(/^      - "([^"]+)"$/gm)].map(m=>m[1]);
  const push=workflow.split("  push:\n")[1].split("  pull_request:")[0];
  const pr=workflow.split("  pull_request:")[1].split("\nconcurrency:")[0];
  const expected=["site/src/**","!site/src/data/sitemap-lastmod.json","site/public/**",
    "site/astro.config.mjs","site/package.json","site/package-lock.json",
    "site/scripts/production-release-gate.mjs","site/scripts/verify-*.mjs",
    "scripts/tractor-sitemap-history.mjs","scripts/tractor-sitemap-history.test.mjs",
    ".github/workflows/tractorvs-sitemap-history.yml"];
  assert.deepEqual(patterns(push),expected);
  assert.deepEqual(patterns(pr),expected,"All significant source inputs must receive the same premerge guard");
  assert.ok(expected.indexOf("!site/src/data/sitemap-lastmod.json")>expected.indexOf("site/src/**"),"Ledger-only generated updates must remain excluded");
  assert.match(workflow,/if ! changed_paths="\$\(git diff --name-only "\$AUDITED_BASE" origin\/main\)"; then/);
  assert.ok(workflow.includes("seo/sitemap-content-history\\.json$"),"A concurrent history checkpoint invalidates the audited baseline");
  assert.ok(workflow.includes("package(-lock)?\\.json$"),"Dependency changes invalidate the audited build");
});


test("only the exact generated market-price module cache hash is ignored",()=>{
 const module=hash=>'<script type="module" src="/_astro/TractorMarketPrice.astro_astro_type_script_index_0_lang.'+hash+'.js"></script>';
 const old=sample(b,'<p>95 HP</p>'+module("Db5Sr4d7")+'<script type="application/json">{"value":95}</script>');
 const updated=old.replace("Db5Sr4d7","B7Ok9FpF");
 assert.equal(significantContentDigest(old,b),significantContentDigest(updated,b));
 assert.notEqual(significantContentDigest(old,b,{legacy:true}),significantContentDigest(updated,b,{legacy:true}));
 for(const change of [
  updated.replace("95 HP","105 HP"),
  updated.replace('{"value":95}','{"value":105}'),
  updated.replace('type="module"','type="text/javascript"'),
  updated.replace('type="module"','type="module" integrity="sha256-example"'),
  updated.replace("TractorMarketPrice","OtherComponent"),
  updated.replace(module("B7Ok9FpF"),""),
 ]) assert.notEqual(significantContentDigest(old,b),significantContentDigest(change,b));
 const external=sample(b,'<script type="module" src="https://example.org/TractorMarketPrice.astro_astro_type_script_index_0_lang.Db5Sr4d7.js"></script>');
 assert.notEqual(significantContentDigest(external,b),significantContentDigest(external.replace("Db5Sr4d7","B7Ok9FpF"),b));
});

test("legacy migration verifies every old hash and preserves all dates, updates only actual differences",()=>{
 const legacy=setup(),current=setup();
 try{
  const component=hash=>'<script type="module" src="/_astro/TractorMarketPrice.astro_astro_type_script_index_0_lang.'+hash+'.js"></script>';
  legacy.write(b,"Real tractor page"+component("Db5Sr4d7"));
  current.write(b,"Real tractor page"+component("B7Ok9FpF"));
  const read=(ctx,url)=>readFileSync(join(ctx.dist,new URL(url).pathname.slice(1),"index.html"),"utf8");
  const previous={version:1,pages:{
   [a]:{digest:significantContentDigest(read(legacy,a),a,{legacy:true}),modified:null},
   [b]:{digest:significantContentDigest(read(legacy,b),b,{legacy:true}),modified:date1.toISOString()}
  },reviewedBulkCopyPr497:true};
  writeFileSync(current.historyPath,JSON.stringify(previous));
  writeFileSync(current.lastmodPath,JSON.stringify({version:1,dates:{"/tr/tractors/safe-model/":date1.toISOString()}}));
  assert.throws(()=>auditBuiltSitemap({...current,now:date2,minPages:2,legacyDist:null}),/requires the verified historical build/);
  const oldHistory=readFileSync(current.historyPath,"utf8"),oldDates=readFileSync(current.lastmodPath,"utf8");
  legacy.write(a,"Unexpected baseline corruption");
  assert.throws(()=>auditBuiltSitemap({...current,now:date2,minPages:2,legacyDist:legacy.dist}),/cannot reproduce checkpoint/);
  assert.equal(readFileSync(current.historyPath,"utf8"),oldHistory);
  assert.equal(readFileSync(current.lastmodPath,"utf8"),oldDates);
  legacy.write(a,"Real homepage");
  const migrated=migrateDigestCheckpoint(previous,legacy.dist);
  assert.equal(migrated.pages[b].modified,date1.toISOString());
  assert.equal(migrated.pages[a].modified,null);
  const result=auditBuiltSitemap({...current,now:date2,minPages:2,legacyDist:legacy.dist});
  assert.equal(result.significant_changes,0);
  assert.equal(JSON.parse(readFileSync(current.historyPath)).digestAlgorithm,DIGEST_ALGORITHM);
  assert.equal(JSON.parse(readFileSync(current.historyPath)).reviewedBulkCopyPr497,true);
  assert.equal(JSON.parse(readFileSync(current.lastmodPath)).dates["/tr/tractors/safe-model/"],date1.toISOString());
  current.write(b,"Corrected real engine specification"+component("B7Ok9FpF"));
  const next=auditBuiltSitemap({...current,now:date2,minPages:2,legacyDist:null});
  assert.equal(next.significant_changes,1);
  assert.equal(JSON.parse(readFileSync(current.lastmodPath)).dates["/tr/tractors/safe-model/"],date2.toISOString());
 }finally{rmSync(legacy.root,{recursive:true,force:true});rmSync(current.root,{recursive:true,force:true});}
});


test("historical build scopes to exact prior published model slugs, never current inventory",()=>{
 const slug="known-tractor-abcd1234";
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 const pages=Object.fromEntries(locales.map(lang=>[ORIGIN+(lang==="en"?"":"/"+lang)+"/tractors/"+slug+"/",{digest:hash(lang),modified:null}]));
 const previous={version:1,pages:{...pages,[ORIGIN+"/"]:{digest:hash("home"),modified:null}}};
 assert.deepEqual(historicalModelSlugs(previous),[slug]);
 const source="before\n  const tractors = [...groups.values()].map((tractor) => {\nafter";
 const patched=prepareHistoricalCatalogSource(source,previous);
 assert.match(patched,/historicalSlugs = new Set\(\["known-tractor-abcd1234"\]\)/);
 assert.match(patched,/filter\(tractor => historicalSlugs\.has\(tractor\.slug\)\)/);
 assert.match(patched,/Historical public catalogue identity mismatch/);
 assert.throws(()=>prepareHistoricalCatalogSource("unexpected",previous),/Unexpected historical catalogue source/);
 const incomplete={version:1,pages:{...pages}};
 delete incomplete.pages[ORIGIN+"/ja/tractors/"+slug+"/"];
 assert.throws(()=>historicalModelSlugs(incomplete),/identity inventory incomplete/);
});


test("final rebuilt HTML and XML must match candidate ledger despite concurrent database updates",()=>{
 const ctx=setup();
 try{
  auditBuiltSitemap({...ctx,now:date1,minPages:2});
  assert.deepEqual(verifyRebuiltCheckpoint(ctx),{verifiedPages:2,verifiedDates:0});
  ctx.write(b,"Concurrent verified technical change");
  assert.throws(()=>verifyRebuiltCheckpoint(ctx),/Rebuilt catalogue drift/);
  auditBuiltSitemap({...ctx,now:date2,minPages:2});
  assert.throws(()=>verifyRebuiltCheckpoint(ctx),/XML lastmod mismatch/);
  const sitemap=join(ctx.dist,"sitemap-0.xml");
  const xml=readFileSync(sitemap,"utf8").replace("<loc>"+b+"</loc>","<loc>"+b+"</loc><lastmod>"+date2.toISOString()+"</lastmod>");
  writeFileSync(sitemap,xml);
  assert.deepEqual(verifyRebuiltCheckpoint(ctx),{verifiedPages:2,verifiedDates:1});
  writeFileSync(sitemap,xml.replace(date2.toISOString(),date1.toISOString()));
  assert.throws(()=>verifyRebuiltCheckpoint(ctx),/XML lastmod mismatch/);
  writeFileSync(sitemap,xml);
  writeFileSync(ctx.lastmodPath,JSON.stringify({version:1,dates:{}}));
  assert.throws(()=>verifyRebuiltCheckpoint(ctx),/date map differs/);
 }finally{rmSync(ctx.root,{recursive:true,force:true});}
});


test("digest-only script normalization covers browser-tolerated closing tags without deleting markup",()=>{
 const module=(hash,ending,body="")=>'<script type="module" src="/_astro/TractorMarketPrice.astro_astro_type_script_index_0_lang.'+hash+'.js">'+body+ending;
 for(const ending of ["</script>","</script >","</script\t>","</SCRIPT>","</script data-extra=\"kept\">","</script/>"]){
  const html=sample(b,module("Db5Sr4d7",ending));
  const updated=sample(b,module("B7Ok9FpF",ending));
  assert.equal(significantContentDigest(html,b),significantContentDigest(updated,b),ending);
  assert.notEqual(significantContentDigest(html,b,{legacy:true}),significantContentDigest(updated,b,{legacy:true}),ending);
 }
 // Nonempty scripts and lookalike tag names must not be normalized.
 for(const [ending,body] of [["</script>","importantPayload()"],["</script-other>",""]]){
  assert.notEqual(significantContentDigest(sample(b,module("Db5Sr4d7",ending,body)),b),
   significantContentDigest(sample(b,module("B7Ok9FpF",ending,body)),b));
 }
 assert.notEqual(significantContentDigest(sample(b,module("Db5Sr4d7","</script>")),b),
  significantContentDigest(sample(b,module("Db5Sr4d7","</script data-extra=\"kept\">")),b));
});

test("visitor-state crawl hints preserve historical lastmod but not changed destinations or content",()=>{
 const id="609cbd59-a8f5-4859-8147-70097ec38946";
 for(const locale of ["","/tr","/zh","/hi","/pt-br","/fr","/de","/ru","/ja","/es"]){
  for(const path of ["/compare/?left="+id,"/forum/?tractor="+id,"/tractors/?q=John%20Deere"]){
   const href=locale+path;
   const link='<a class="example" href="'+href+'" data-astro-cid-scope>Real label</a>';
   const original=sample(b,link);
   const changed=original.replace('href="'+href+'"','href="'+href+'" rel="nofollow"');
   const before=significantContentDigest(original,b);
   assert.equal(significantContentDigest(changed,b),before);
   assert.notEqual(significantContentDigest(changed,b,{legacy:true}),before);
   assert.notEqual(significantContentDigest(changed.replace("Real label","Updated label"),b),before);
   assert.notEqual(significantContentDigest(changed.replace(href,href+"x"),b),before);
   assert.notEqual(significantContentDigest(changed.replace('rel="nofollow"','rel="nofollow sponsored"'),b),before);
   assert.notEqual(significantContentDigest(changed.replace('rel="nofollow"','rel="nofollow" rel="nofollow"'),b),before);
   assert.notEqual(significantContentDigest(changed.replace("data-astro-cid-scope","data-astro-cid-changed"),b),before);
  }
 }
 for(const href of ["/tractors/","/tractors/example/","https://example.com/tractors/?q=John","/forum/?tractor=invalid","/compare/?left="+id+"&right="+id]){
  const original=sample(b,'<a href="'+href+'">Meaningful link</a>');
  assert.notEqual(significantContentDigest(original,b),significantContentDigest(original.replace('">Meaningful','" rel="nofollow">Meaningful'),b));
 }
});
test("mass visitor-state-only release retains dates and keeps the real content guard",()=>{
 const id="609cbd59-a8f5-4859-8147-70097ec38946";
 const previous={version:1,digestAlgorithm:DIGEST_ALGORITHM,pages:{}},pages=[];
 for(let n=0;n<120;n++){
  const url=ORIGIN+"/tractors/audited-model-"+n+"/";
  const original=sample(url,'<a href="/compare/?left='+id+'">Compare</a> <p>95 HP</p>');
  const changed=original.replace('">Compare','" rel="nofollow">Compare');
  previous.pages[url]={digest:significantContentDigest(original,url),modified:date1.toISOString()};
  pages.push([url,significantContentDigest(changed,url)]);
 }
 const result=deriveHistory({pages,previous,now:date2});
 assert.equal(result.summary.significant_changes,0);
 assert.deepEqual(result.history,previous);
 assert.ok(Object.values(result.lastmod.dates).every(x=>x===date1.toISOString()));
 const genuinelyChanged=pages.map(([url,digest])=>[url,hash(digest+"actual content change")]);
 assert.throws(()=>deriveHistory({pages:genuinelyChanged,previous,now:date2}),/manual SEO review/);
});
