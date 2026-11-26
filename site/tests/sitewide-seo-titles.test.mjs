import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectSeoTitle,auditBuiltSeoTitles,hasBibliographicTitleLeak,crossLocaleModelTitleGroups} from "../scripts/verify-sitewide-seo-titles.mjs";

const doc=(title,main)=>'<!doctype html><html lang="en"><head><title>'
  +title+'</title></head><body>'+main+'</body></html>';

test("title QA skips ownership verification files and honors valid indexable titles",()=>{
 assert.equal(inspectSeoTitle("google-site-verification: token","naver.html"),null);
 const item=inspectSeoTitle(doc("TYM T3035 Specs — F36 / Series 3",
  "<main><h1>TYM T3035</h1></main>"),"tractors/tym-t3035/index.html");
 assert.equal(item.errors.length,0);
 assert.equal(item.isModel,true);
 assert.equal(item.locale,"en");
});

test("missing, duplicated, and wrong-model titles are errors (not silent warnings)",()=>{
 const empty="<html><head></head><body><h1>TYM T3035</h1></body></html>";
 assert.deepEqual(inspectSeoTitle(empty,"tr/tractors/tym-t3035/index.html").errors,
   ["missing-or-duplicate-title","model-identity-absent-from-title"]);
 const duplicate="<html><head><title>TYM T3035</title><title>TYM T3035</title></head><body><h1>TYM T3035</h1></body></html>";
 assert.ok(inspectSeoTitle(duplicate,"tractors/tym-t3035/index.html")
   .errors.includes("missing-or-duplicate-title"));
 const misleading=doc("Other tractor 111","<h1>TYM T3035</h1>");
 assert.ok(inspectSeoTitle(misleading,"pt-br/tractors/tym-t3035/index.html")
   .errors.includes("model-identity-absent-from-title"));
});

test("60-character auditor limit is advisory, never erases real identity",()=>{
 const name="Lamborghini Trattori Spire F 80 Target";
 const title=name+" — Stage V / F 80 · Europa · 2025 | TractorVS";
 const item=inspectSeoTitle(doc(title,"<h1>"+name+"</h1>"),
  "pt-br/tractors/long-model/index.html");
 assert.equal(item.errors.length,0);
 assert.ok(item.length>60);
 assert.ok(item.title.includes("Stage V"));
});

test("all published language pages are measured and duplicates exposed for review",()=>{
 const root=mkdtempSync(join(tmpdir(),"tractorvs-titles-"));
 try{
  for(const folder of ["tr/tractors/two","tr/tractors/three","pt-br/tractors/one","en-extra"]){
   mkdirSync(join(root,folder),{recursive:true});
  }
  writeFileSync(join(root,"index.html"),doc("Homepage | TractorVS","<h1>Welcome</h1>"));
  writeFileSync(join(root,"tr/tractors/two/index.html"),doc("Başak 2075","<h1>Başak 2075</h1>"));
  writeFileSync(join(root,"tr/tractors/three/index.html"),doc("Başak 2075","<h1>Başak 2075</h1>"));
  writeFileSync(join(root,"pt-br/tractors/one/index.html"),
   doc("Massey Ferguson 4708 — 2021 / Africa do Sul | TractorVS","<h1>Massey Ferguson 4708</h1>"));
  writeFileSync(join(root,"naver.html"),"site-verification");
  const r=auditBuiltSeoTitles(root);
  assert.equal(r.htmlDocuments,4);
  assert.equal(r.modelPages,3);
  assert.equal(r.errors.length,0);
  assert.equal(r.duplicates.length,1);
  assert.equal(r.byLocale.tr.pages,2);
  assert.equal(r.byLocale["pt-br"].pages,1);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test("empty build never appears as a successful title audit",()=>{
 const root=mkdtempSync(join(tmpdir(),"tractorvs-empty-titles-"));
 try{assert.throws(()=>auditBuiltSeoTitles(root),/No HTML documents/);}
 finally{rmSync(root,{recursive:true,force:true});}
});

test("Yandex ownership HTML without a title is not a real content page",()=>{
 const source='<html><head><meta charset="utf-8"></head><body>Verification: 6bf433db24ce4bb4</body></html>';
 assert.equal(inspectSeoTitle(source,"yandex_6bf433db24ce4bb4.html"),null);
 assert.ok(inspectSeoTitle(source,"published-article.html").errors.includes("missing-or-duplicate-title"));
});

test("HTML entities are measured as displayed characters, not escape sequences",()=>{
 const item=inspectSeoTitle(doc("Massey &amp; Ferguson &#39;2026&#39; Specs",
   "<h1>Massey &amp; Ferguson</h1>"),"tr/tractors/mf/index.html");
 assert.equal(item.title,"Massey & Ferguson '2026' Specs");
 assert.equal(item.length,item.title.length);
 assert.deepEqual(item.errors,[]);
});

test("source bibliographies in model titles are flagged even when <=60 characters",()=>{
 assert.equal(hasBibliographicTitleLeak("Landini 2-050 — Serie 2 / Tier 3 / 2017 brochure"),true);
 assert.equal(hasBibliographicTitleLeak("Steyr 6440 CERVUS CVT — International"),false);
 assert.equal(hasBibliographicTitleLeak("Yanmar YT347 — YT3 i-HMT · Turkey"),false);
 const root=mkdtempSync(join(tmpdir(),"tractorvs-note-title-"));
 try{
  mkdirSync(join(root,"tractors","landini"),{recursive:true});
  writeFileSync(join(root,"tractors","landini","index.html"),
   doc("Landini 2-050 — 2017 brochure","<h1>Landini 2-050</h1>"));
  const report=auditBuiltSeoTitles(root);
  assert.equal(report.errors.length,0);
  assert.equal(report.bibliographyTitles,1);
  assert.equal(report.bibliographyExamples[0].file,"tractors/landini/index.html");
 }finally{rmSync(root,{recursive:true,force:true});}
});


test("cross-locale audit reports same model titles but does not conflate other models or repeated observations",()=>{
 const records=[
  {file:"es/tractors/basak-5120/index.html",title:"Başak 5120 — Stage V"},
  {file:"fr/tractors/basak-5120/index.html",title:"Başak 5120 — Stage V"},
  {file:"ru/tractors/basak-5120/index.html",title:"Başak 5120 —  Stage V"},
  {file:"ru/tractors/basak-5120/index.html",title:"Başak 5120 —  Stage V"},
  {file:"tractors/basak-5120/index.html",title:"Başak 5120 Specs — Stage V"},
  {file:"tr/tractors/another/index.html",title:"Başak 5120 — Stage V"},
  {file:"fr/articles/index.html",title:"Başak 5120 — Stage V"},
 ];
 const groups=crossLocaleModelTitleGroups(records);
 assert.equal(groups.length,1);
 assert.deepEqual(groups[0].locales,["es","fr","ru"]);
 assert.equal(groups[0].slug,"basak-5120");
 assert.equal(crossLocaleModelTitleGroups([records[0]]).length,0);
 assert.deepEqual(crossLocaleModelTitleGroups(records.map(r=>({...r,title:r.file}))),[]);
});

test("full build surfaces cross-language candidate separately from same-language duplicates and structural errors",()=>{
 const root=mkdtempSync(join(tmpdir(),"tractorvs-locale-title-"));
 try{
  for(const locale of ["es","fr","ru"]){
   const folder=join(root,locale,"tractors","basak-5120");
   mkdirSync(folder,{recursive:true});
   writeFileSync(join(folder,"index.html"),doc("Başak 5120 — Stage V","<h1>Başak 5120</h1>"));
  }
  const report=auditBuiltSeoTitles(root);
  assert.equal(report.crossLocaleCandidates.length,1);
  assert.equal(report.duplicates.length,0);
  assert.equal(report.errors.length,0);
  assert.equal(report.crossLocaleCandidates[0].files.length,3);
 }finally{rmSync(root,{recursive:true,force:true});}
});


test("only real head title elements count, not comments, scripts, inert templates or attributes",()=>{
 const fake='<html><head><!-- <title>Fake</title> --><script>const s="<title>Fake</title>";</script>'+
  '<template><title>Fake</title><template><title>Nested</title></template></template>'+
  '<meta content="<title>Attribute</title>"><noscript><title>Inactive</title></noscript>';
 const tail='</head><body><h1>TYM T3035</h1></body></html>';
 const path="tractors/tym/index.html";
 assert.ok(inspectSeoTitle(fake+tail,path).errors.includes("missing-or-duplicate-title"));
 assert.deepEqual(inspectSeoTitle(fake+'<title>TYM T3035 &lt;technical&gt; Specs</title>'+tail,path).errors,[]);
 assert.equal(inspectSeoTitle(fake+'<title>TYM T3035 &lt;technical&gt; Specs</title>'+tail,path).title,"TYM T3035 <technical> Specs");
 assert.ok(inspectSeoTitle(fake+'<title>TYM T3035</title><title>Duplicate</title>'+tail,path).errors.includes("missing-or-duplicate-title"));
});


test("editorial metadata omits optional branding before cutting meaningful wording",async()=>{
 const {editorialSearchTitle,technicalGuideSearchTitle}=await import("../src/lib/editorial-seo-title.mjs");
 const titles=["Traktör yakıt maliyeti ve tarla süresi hesaplayıcısı","Traktor-Rechner für Dieselverbrauch und Feldarbeit","Calculateur de carburant et de temps de travail du tracteur","Calculadora de combustible y tiempo de trabajo del tractor","Calculadora de combustível e tempo de trabalho do trator","Калькулятор расхода топлива и времени работы трактора"];
 for(const title of titles){assert.equal(editorialSearchTitle(title),title);assert.ok(title.length<=60);}
 assert.equal(editorialSearchTitle("Short title"),"Short title | TractorVS");
 const long="A real long editorial title with meaningful information that must never disappear";
 assert.equal(editorialSearchTitle(long),long);
 const cases=[["pto-and-power-take-off","tr","Traktörde PTO (Kuyruk Mili) Nedir? 540, 540E ve 1000 Devir Rehberi",["PTO","Kuyruk Mili","540","540E","1000"]],["tractor-hydraulic-lift-explained","tr","Traktörde Hidrolik Kaldırma Kapasitesi Nedir? 610 mm, Debi ve Basınç",["Hidrolik","610 mm","Debi","Basınç"]],["tractor-hydraulic-lift-explained","en","Tractor Hydraulic Lift Capacity Explained: Flow, Pressure and 610 mm",["Hydraulic","Lift","Flow","Pressure","610 mm"]]];
 for(const [slug,locale,headline,words] of cases){const title=technicalGuideSearchTitle(slug,locale,headline);assert.ok(editorialSearchTitle(title).length<=60);for(const word of words)assert.ok(title.includes(word));assert.equal(technicalGuideSearchTitle(slug,locale,headline+" changed"),headline+" changed");}
});


test("reviewed guide metadata changes only matching canonical route, locale and original title",async()=>{
 const {reviewedTechnicalGuideMetadataTitle,editorialSearchTitle}=await import("../src/lib/editorial-seo-title.mjs");
 const source="Traktörde PTO (Kuyruk Mili) Nedir? 540, 540E ve 1000 Devir Rehberi";
 const title=editorialSearchTitle(source),path="/guides/pto-and-power-take-off/";
 const curated=reviewedTechnicalGuideMetadataTitle(path,"tr",title);
 assert.notEqual(curated,title);assert.ok(curated.length<=60);
 for(const token of ["PTO","Kuyruk Mili","540","540E","1000"])assert.ok(curated.includes(token));
 assert.equal(reviewedTechnicalGuideMetadataTitle(path,"en",title),title);
 assert.equal(reviewedTechnicalGuideMetadataTitle(path,"tr",title+" edited"),title+" edited");
 assert.equal(reviewedTechnicalGuideMetadataTitle("/tractors/pto-and-power-take-off/","tr",title),title);
 const en="Tractor Hydraulic Lift Capacity Explained: Flow, Pressure and 610 mm";
 const hyd=reviewedTechnicalGuideMetadataTitle("/guides/tractor-hydraulic-lift-explained/","en",editorialSearchTitle(en));
 assert.ok(hyd.length<=60 && hyd.includes("610 mm") && hyd.includes("Flow") && hyd.includes("Pressure"));
});
