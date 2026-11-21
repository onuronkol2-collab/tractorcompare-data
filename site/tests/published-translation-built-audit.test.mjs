import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const script=fileURLToPath(new URL("../scripts/published-translation-audit.mjs",import.meta.url));
const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
function fixture(){
  const tmp=mkdtempSync(join(tmpdir(),"tractorvs-locale-html-"));
  const dist=join(tmp,"dist");
  const urlBase="https://tractorvs.com";
  const urls=locales.map(locale=>urlBase+"/"+(locale==="en"?"":locale+"/")+"tractors/quality-sample/");
  const index='<sitemapindex><sitemap><loc>'+urlBase+'/sitemap-0.xml</loc></sitemap></sitemapindex>';
  const xml='<urlset>'+urls.map(u=>'<url><loc>'+u+'</loc></url>').join("")+'</urlset>';
  for(const [relative,html] of [["sitemap-index.xml",index],["sitemap-0.xml",xml]]){
    const path=join(dist,relative);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,html);
  }
  for(const [idx,url] of urls.entries()){
    const rel=new URL(url).pathname.slice(1)+"index.html";
    const path=join(dist,rel);mkdirSync(dirname(path),{recursive:true});
    writeFileSync(path,'<html><body><main><h4>'+(locales[idx]==="tr"?"Üreticinin bildirdiği güç":"Manufacturer Stated Power")+'</h4></main></body></html>');
  }
  return {tmp,dist,urls};
}
function audit(f,extra={}){
  const report=join(f.tmp,"report.json");
  const result=spawnSync(process.execPath,[script],{
    encoding:"utf8",timeout:15000,
    env:{...process.env,TRANSLATION_DIST_ROOT:f.dist,TRANSLATION_REPORT_PATH:report,TRANSLATION_MIN_MODELS:"1",TRANSLATION_MAX_TR_OCCURRENCES:"0",TRANSLATION_STRICT:"false",...extra}
  });
  return {result,report};
}
test("read-only built HTML audit verifies language parity and exports truthful residual report",()=>{
  const f=fixture();
  try{
    const {result,report}=audit(f);
    assert.equal(result.status,0,result.stderr);
    const data=JSON.parse(readFileSync(report,"utf8"));
    assert.equal(data.summary.mode,"built_preview");
    assert.equal(data.summary.modelCounts.tr,1);
    assert.equal(data.summary.modelCounts.en,1);
    assert.equal(data.summary.occurrenceCounts.tr,0);
    assert.equal(data.summary.publishedURLs,10);
    assert.ok(data.summary.occurrenceCounts.es>0,"other locale still has measured fallback");
  }finally{rmSync(f.tmp,{recursive:true,force:true});}
});
test("pre-deployment audit blocks a Turkish heading regression and still exports evidence",()=>{
  const f=fixture();
  try{
    const path=join(f.dist,"tr/tractors/quality-sample/index.html");
    writeFileSync(path,'<html><body><main><h4>Manufacturer Stated Power</h4></main></body></html>');
    const {result,report}=audit(f);
    assert.equal(result.status,1,result.stdout+" "+result.stderr);
    const data=JSON.parse(readFileSync(report,"utf8"));
    assert.equal(data.summary.occurrenceCounts.tr,1);
    assert.match(result.stderr,/TRANSLATION_AUDIT_FAIL_TURKISH/);
  }finally{rmSync(f.tmp,{recursive:true,force:true});}
});
test("pre-deployment audit blocks missing localized model pages",()=>{
  const f=fixture();
  try{
    rmSync(join(f.dist,"ja/tractors/quality-sample/index.html"));
    const {result}=audit(f);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Built page\/sitemap missing/);
  }finally{rmSync(f.tmp,{recursive:true,force:true});}
});

test("complete-locale QA gate catches Chinese regressions even if Turkish is clean",()=>{
  const f=fixture();
  try{
    const {result}=audit(f,{TRANSLATION_ZERO_LOCALES:"tr,zh"});
    assert.equal(result.status,1,result.stdout+" "+result.stderr);
    assert.match(result.stderr,/TRANSLATION_AUDIT_ZERO_LOCALE_REGRESSION/);
    assert.match(result.stderr,/"locale":"zh"/);
  }finally{rmSync(f.tmp,{recursive:true,force:true});}
});

test("preview audit checks exact model-slug parity, not just equal locale counts",()=>{
  const f=fixture();
  try{
    const path=join(f.dist,"sitemap-0.xml");
    const xml=readFileSync(path,"utf8").replace("/zh/tractors/quality-sample/","/zh/tractors/ghost-model/");
    writeFileSync(path,xml);
    const {result,report}=audit(f);
    assert.notEqual(result.status,0);
    const summary=JSON.parse(readFileSync(report,"utf8")).summary;
    assert.ok(summary.fetchErrors.some(x=>x.includes("Missing localized model zh quality-sample")));
    assert.ok(summary.fetchErrors.some(x=>x.includes("Orphan localized model zh ghost-model")));
  }finally{rmSync(f.tmp,{recursive:true,force:true});}
});

test("deep language SEO audit refuses missing canonical, html lang, H1, or hreflang",()=>{
  const f=fixture();
  try{
    const {result,report}=audit(f,{TRANSLATION_VALIDATE_SEO:"true"});
    assert.notEqual(result.status,0);
    const data=JSON.parse(readFileSync(report,"utf8"));
    assert.equal(data.summary.seoMetadataChecked,true);
    assert.ok(data.summary.fetchErrors.some(x=>x.includes("Incorrect HTML language")));
    assert.ok(data.summary.fetchErrors.some(x=>x.includes("Wrong self-canonical")));
    assert.ok(data.summary.fetchErrors.some(x=>x.includes("Missing or duplicated model hreflang")));
    assert.ok(data.summary.fetchErrors.some(x=>x.includes("Missing/duplicate model H1")));
  }finally{rmSync(f.tmp,{recursive:true,force:true});}
});

test("deep language SEO audit accepts fully reciprocal self-canonical ten-language model fixture",()=>{
  const f=fixture();
  try{
    const langs={en:"en",tr:"tr",zh:"zh-Hans",hi:"hi","pt-br":"pt-BR",fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"};
    const alternatives=Object.entries(langs).map(([lang,code])=>{
      const u="https://tractorvs.com/"+(lang==="en"?"":lang+"/")+"tractors/quality-sample/";
      return '<link rel="alternate" hreflang="'+code+'" href="'+u+'">';
    }).join("")+'<link rel="alternate" hreflang="x-default" href="https://tractorvs.com/tractors/quality-sample/">';
    for(const [lang,code] of Object.entries(langs)){
      const url="https://tractorvs.com/"+(lang==="en"?"":lang+"/")+"tractors/quality-sample/";
      const filename=join(f.dist,new URL(url).pathname.slice(1)+"index.html");
      const label=lang==="tr"?"Üreticinin bildirdiği güç":"Manufacturer Stated Power";
      writeFileSync(filename,'<html lang="'+code+'"><head><link rel="canonical" href="'+url+'">'+alternatives+
        '</head><body><main><h1>Model details</h1><h4>'+label+'</h4></main></body></html>');
    }
    const {result,report}=audit(f,{TRANSLATION_VALIDATE_SEO:"true"});
    assert.equal(result.status,0,result.stdout+" "+result.stderr);
    assert.deepEqual(JSON.parse(readFileSync(report,"utf8")).summary.fetchErrors,[]);
  }finally{rmSync(f.tmp,{recursive:true,force:true});}
});

test("English source language leakage is reported separately from cross-language fallback",()=>{
 const f=fixture();
 try{
  const path=join(f.dist,"tractors/quality-sample/index.html");
  writeFileSync(path,'<html><main><h4>ŞAnzıMan Tipi</h4></main></html>');
  const {result,report}=audit(f,{TRANSLATION_MAX_EN_SOURCE_OCCURRENCES:"0"});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/TRANSLATION_AUDIT_ENGLISH_SOURCE_LEAKAGE/);
  const content=JSON.parse(readFileSync(report,"utf8"));
  assert.equal(content.summary.englishSourceOccurrences,1);
  assert.equal(content.summary.englishSourceHeadings,1);
  assert.equal(content.englishSourceLanguageLeakage[0].englishSourceLabel,"ŞAnzıMan Tipi");
 }finally{rmSync(f.tmp,{recursive:true,force:true});}
});
