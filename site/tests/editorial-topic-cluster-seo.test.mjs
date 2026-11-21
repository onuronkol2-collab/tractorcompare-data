import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {localizedPath,LOCALES} from "../src/lib/locales.ts";
import {editorialHubTranslation} from "../src/lib/editorial-hub-i18n.ts";

const file=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("each real article links back to an existing, locale-specific editorial hub",()=>{
 const pages=[
  ["components/TractorSelectionGuide.astro",10],
  ["components/Basak2075Review.astro",10],
  ["components/TractorGlossary.astro",2],
  ["components/TractorTechnicalDeepDive.astro",2]
 ];
 for(const [path,count] of pages){
  const s=file(path);
  assert.match(s,/const editorialPath=localizedPath\(lang,"\/articles\/"\)/,path);
  assert.match(s,/href=\{editorialPath\}/,path);
  assert.match(s,/BreadcrumbList/,path);
  assert.match(s,/new URL\(editorialPath,/,path);
  assert.ok(count===10? !s.includes('availableLocales={["en","tr"]}') : s.includes('availableLocales={["en","tr"]}'),
    "Only actually translated full articles should have ten-language hreflang: "+path);
 }
 for(const lang of LOCALES){
  const page=localizedPath(lang,"/articles/");
  assert.equal(page,lang==="en"?"/articles/":"/"+lang+"/articles/");
  const label=editorialHubTranslation(lang)?.hub ?? (lang==="tr"?"Makaleler":"Articles");
  assert.ok(label.trim().length>=2,lang+" hub label");
 }
});

test("article breadcrumbs represent the real Home > Articles > Guide/Review hierarchy",()=>{
 const guide=file("components/TractorSelectionGuide.astro");
 const review=file("components/Basak2075Review.astro");
 const glossary=file("components/TractorGlossary.astro");
 const dive=file("components/TractorTechnicalDeepDive.astro");
 assert.match(guide,/position:2,name:editorialName/);
 assert.match(guide,/position:3,name:copy\.h1/);
 assert.match(review,/position:2,name:editorialName/);
 assert.match(review,/position:3,name:title/);
 assert.match(glossary,/"position":2,"name":tr\?"Makaleler":"Articles"/);
 assert.match(glossary,/"position":3,"name":tr\?"Traktör teknik terimleri":"Tractor technical terms"/);
 assert.match(dive,/position:2,name:tr\?"Makaleler":"Articles"/);
 assert.match(dive,/position:3,name:tr\?"Traktör teknik terimleri":"Tractor technical terms"/);
 assert.match(dive,/position:4,name:headline/);
});

test("GEO citation schema repeats exactly the real source links already visible to readers",()=>{
 const dive=file("components/TractorTechnicalDeepDive.astro");
 const expected=[
  "https://tractortestlab.unl.edu/",
  "https://www.oecd.org/en/topics/tractors.html",
  "https://eur-lex.europa.eu/eli/reg/2019/405/oj/eng",
  "https://www.dlg.org/en/magazin/survey-tests/tractor-model-descriptions-no-standardised-information"
 ];
 for(const url of expected){
  const count=dive.split(url).length-1;
  assert.equal(count,2,"citation and human-visible link must both exist: "+url);
 }
 assert.match(dive,/citation:citedDocuments/);
 assert.match(dive,/hasPowerStandards\?\[/);
 assert.doesNotMatch(dive,/FAQPage|AggregateRating|fabricatedReviews/);
 assert.match(dive,/dateModified:editedOn/);
});
