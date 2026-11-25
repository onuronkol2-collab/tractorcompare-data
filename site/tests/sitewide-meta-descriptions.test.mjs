import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectMetaDescription,auditBuiltMetaDescriptions,descriptionReuseGroups}
  from "../scripts/verify-sitewide-meta-descriptions.mjs";

const page=(description,robots="index,follow")=>
  '<!doctype html><html lang="en"><head><link rel="canonical" href="https://tractorvs.com/tractors/example/">'+
  '<meta name="robots" content="'+robots+'">'+
  description+'</head><body><main><h1>Verified model</h1></main></body></html>';

test("valid localized, canonical model description is present and measurable",()=>{
  const item=inspectMetaDescription(page('<meta name="description" content="Massey &amp; Ferguson checked technical specifications.">'),
    "tr/tractors/example/index.html");
  assert.deepEqual(item.errors,[]);
  assert.equal(item.description,"Massey & Ferguson checked technical specifications.");
  assert.equal(item.length,item.description.length);
  assert.equal(item.locale,"tr");
});

test("missing, duplicate and empty indexable descriptions fail closed",()=>{
  const cases=[
    [page(""),"missing-or-duplicate-description"],
    [page('<meta name="description" content="First"><meta name="description" content="Second">'),
     "missing-or-duplicate-description"],
    [page('<meta name="description" content="  ">'),"empty-description"],
    [page('<meta name="description">'),"empty-description"],
  ];
  for(const [html,expected] of cases){
    assert.ok(inspectMetaDescription(html).errors.includes(expected),expected);
  }
});

test("noindex, noncanonical verification and embedded template strings are not false page evidence",()=>{
  assert.equal(inspectMetaDescription(page("", "noindex,nofollow")),null);
  assert.equal(inspectMetaDescription('<html><head><title>Verification</title></head></html>',
    "yandex_1234.html"),null);
  const fake='<html><head><script>const x = \'<link rel="canonical" href="https://tractorvs.com/">\';</script>'+
    '<meta name="description" content="fake"></head></html>';
  assert.equal(inspectMetaDescription(fake),null);
  const embedded=page('<script>const snippet = \'<meta name="description" content="fake">\';</script>'+
    "<meta name='description' content='True &amp; checked evidence'>");
  assert.equal(inspectMetaDescription(embedded).description,"True & checked evidence");
});

test("long manufacturer identifiers are reported, never truncated or padded",()=>{
  const content="Exact documented equipment and regional variant — ".repeat(5);
  const item=inspectMetaDescription(page('<meta name="description" content="'+content+'">'));
  assert.equal(item.errors.length,0);
  assert.ok(item.length>160);
  assert.equal(item.description,content.trim());
});

test("whole site counts all HTML but checks only canonical indexable pages",()=>{
  const root=mkdtempSync(join(tmpdir(),"tractorvs-meta-"));
  try{
    mkdirSync(join(root,"tr"),{recursive:true});
    writeFileSync(join(root,"index.html"),page('<meta name="description" content="Homepage evidence">'));
    writeFileSync(join(root,"tr/index.html"),page('<meta name="description" content="Türkçe teknik bilgiler">'));
    writeFileSync(join(root,"preview.html"),page("","noindex,nofollow"));
    writeFileSync(join(root,"naver.html"),'<html><head>verification</head></html>');
    const report=auditBuiltMetaDescriptions(root);
    assert.equal(report.htmlDocuments,4);
    assert.equal(report.indexablePages,2);
    assert.equal(report.errors.length,0);
    assert.equal(report.byLocale.tr.pages,1);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test("script-fragment removal must never synthesize a fake meta description",()=>{
  // The old strip regex joined <met + a into a new real-looking <meta>.
  const forged='<met<script>ignored</script>a name="description" content="Fake SEO metadata">';
  const item=inspectMetaDescription(page(forged));
  assert.deepEqual(item.errors,["missing-or-duplicate-description"]);
  const real=inspectMetaDescription(page(forged+
    '<meta name="description" content="Real manufacturer description">'));
  assert.deepEqual(real.errors,[]);
  assert.equal(real.description,"Real manufacturer description");
});

test("script-fragment removal must never synthesize a fake canonical link",()=>{
  const html='<html><head>'+
    '<lin<script>ignored</script>k rel="canonical" href="https://tractorvs.com/">' +
    '<meta name="description" content="False positive if fragments get joined">'+
    '</head><body></body></html>';
  assert.equal(inspectMetaDescription(html),null);
});

test("comments, raw text, quoted tag characters and case variations preserve exact tags",()=>{
  const html='<html><HEAD>'+
    '<!--<link rel="canonical" href="https://attacker.invalid/"><meta name="description" content="fake">-->'+
    '<STYLE>.foo:before{content:"<meta name=description content=hidden>"}</STYLE>'+
    '<SCRIPT>const x = "<meta name=description content=bogus>";</SCRIPT>'+
    '<LINK title="a > b" rel="canonical" href="https://tractorvs.com/">'+
    '<META title="a > b" name="description" content="Verified &amp; sourced">'+
    '</HEAD><body></body></html>';
  const item=inspectMetaDescription(html);
  assert.deepEqual(item?.errors,[]);
  assert.equal(item.description,"Verified & sourced");
});

test("unclosed script does not let a following fake description pass inspection",()=>{
  const html='<html><head><link rel="canonical" href="https://tractorvs.com/">'+
    '<script>const x = "not closed"; <meta name="description" content="unreachable">'+
    '</head><body></body></html>';
  assert.deepEqual(inspectMetaDescription(html).errors,["missing-or-duplicate-description"]);
});


test("quoted attributes cannot impersonate name or content attributes",()=>{
 const fake=page("<meta title=' name=\"description\" content=\"Fake evidence\"'>");
 assert.deepEqual(inspectMetaDescription(fake).errors,["missing-or-duplicate-description"]);
 const real=page("<meta title=' content=\"Fake evidence\"' name=\"description\" content=\"Actual evidence\">");
 assert.equal(inspectMetaDescription(real).description,"Actual evidence");
});

test("description reuse is scoped to distinct canonical paths and observed model translations",()=>{
 const rows=[
  {file:"tractors/a/index.html",description:"Shared  evidence"},
  {file:"tractors/a/index.html",description:"Shared evidence"},
  {file:"tractors/b/index.html",description:"Shared evidence"},
  {file:"tr/tractors/a/index.html",description:"Shared evidence"},
  {file:"de/tractors/a/index.html",description:"Shared evidence"},
  {file:"es/tractors/b/index.html",description:"Distinta descripción"},
  {file:"fr/tractors/c/index.html",description:"Shared evidence"},
  {file:"tr/articles/index.html",description:"Shared evidence"},
  {file:"tr/tractors/b/index.html",description:"   "},
 ];
 const groups=descriptionReuseGroups(rows);
 assert.deepEqual(groups.sameLocale.map(x=>[x.locale,x.files.length]),[["en",2],["tr",2]]);
 assert.equal(groups.crossLocale.length,1);
 assert.deepEqual(groups.crossLocale[0].locales,["de","en","tr"]);
 assert.equal(groups.crossLocale[0].slug,"a");
 assert.deepEqual(descriptionReuseGroups(rows.slice(0,2)),{sameLocale:[],crossLocale:[]});
});

test("whole-build reuse is advisory and excludes noindex content",()=>{
 const root=mkdtempSync(join(tmpdir(),"tractorvs-description-reuse-"));
 try{
  for(const file of ["tractors/a/index.html","tractors/b/index.html","de/tractors/a/index.html","tr/tractors/a/index.html"]){
   const dest=join(root,file);
   mkdirSync(join(dest,".."),{recursive:true});
   writeFileSync(dest,page('<meta name="description" content="Shared verified evidence">',file.startsWith("tr/")?"noindex,nofollow":"index,follow"));
  }
  const report=auditBuiltMetaDescriptions(root);
  assert.equal(report.errors.length,0);
  assert.equal(report.indexablePages,3);
  assert.equal(report.reuse.sameLocale.length,1);
  assert.deepEqual(report.reuse.crossLocale[0].locales,["de","en"]);
 }finally{rmSync(root,{recursive:true,force:true});}
});


test("inert templates, nested templates and noscript cannot supply canonical or descriptions",()=>{
 const hidden='<template><meta name="description" content="fake"><template><meta name="description" content="nested"></template></template>'+
 '<noscript><meta name="description" content="inactive"></noscript>';
 assert.deepEqual(inspectMetaDescription(page(hidden)).errors,["missing-or-duplicate-description"]);
 assert.equal(inspectMetaDescription(page(hidden+'<meta name="description" content="Real evidence">')).description,"Real evidence");
 assert.equal(inspectMetaDescription('<html><head><template><link rel="canonical" href="https://tractorvs.com/"></template><meta name="description" content="fake"></head></html>'),null);
});
