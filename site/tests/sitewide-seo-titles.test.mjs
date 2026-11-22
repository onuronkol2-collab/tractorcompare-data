import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {inspectSeoTitle,auditBuiltSeoTitles} from "../scripts/verify-sitewide-seo-titles.mjs";

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
