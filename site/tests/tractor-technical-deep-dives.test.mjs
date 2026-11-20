import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {TECHNICAL_DEEP_DIVES,getTechnicalDeepDive} from "../src/lib/tractor-technical-deep-dives.ts";

const component=readFileSync(new URL("../src/components/TractorTechnicalDeepDive.astro",import.meta.url),"utf8");
const glossary=readFileSync(new URL("../src/components/TractorGlossary.astro",import.meta.url),"utf8");
const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
const glossaryModel=readFileSync(new URL("../src/lib/tractor-glossary.ts",import.meta.url),"utf8");

test("three original deep-dive chapters include substantive bilingual educational content",()=>{
 assert.equal(TECHNICAL_DEEP_DIVES.length,3);
 const slugs=new Set();
 for(const article of TECHNICAL_DEEP_DIVES){
  assert.match(article.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(!slugs.has(article.slug));slugs.add(article.slug);
  assert.equal(getTechnicalDeepDive(article.slug),article);
  assert.equal(article.sections.length,5);
  assert.equal(article.glossary.length,5);
  const ids=new Set();
  for(const section of article.sections){
   assert.ok(!ids.has(section.anchor),section.anchor);ids.add(section.anchor);
   for(const locale of ["en","tr"]){
    assert.ok(section.title[locale].length>12);
    assert.equal(section.paragraphs[locale].length,2);
    for(const paragraph of section.paragraphs[locale])assert.ok(paragraph.length>85,
     article.slug+" "+locale+" needs substantive paragraphs");
   }
  }
  for(const locale of ["en","tr"]){
    assert.ok(article.lead[locale].length>200);
    assert.ok(article.description[locale].length>=80);
    assert.ok(article.title[locale].length>30);
  }
  for(const id of article.glossary)assert.ok(glossaryModel.includes('\"'+id+'\"'),"Missing main glossary anchor: "+id);
  for(const locale of ["en","tr"]){
    const filename="../src/pages/"+(locale==="tr"?"tr/":"")+"guides/"+article.slug+"/index.astro";
    const page=readFileSync(new URL(filename,import.meta.url),"utf8");
    assert.match(page,new RegExp('lang=\"'+locale+'\"'));
    assert.ok(page.includes('slug=\"'+article.slug+'\"'));
    assert.ok(glossary.includes(article.slug),"Guide not linked from glossary: "+article.slug);
  }
 }
 assert.equal(getTechnicalDeepDive("missing"),null);
});

test("deep-dive articles use existing approved licensed images and honest SEO schema",()=>{
 assert.match(component,/APPROVED_TRACTOR_PHOTOS/);
 assert.match(component,/photo\.licenseUrl|hero\.licenseUrl/);
 assert.match(component,/data-tractor-photo/);
 assert.match(component,/availableLocales=\{\["en","tr"\]\}/);
 assert.match(component,/\"@type\":\"TechArticle\"/);
 assert.match(component,/\"@type\":\"BreadcrumbList\"/);
 assert.match(component,/\"@type\":\"WebPage\"/);
 assert.doesNotMatch(component,/\"@type\":\"FAQPage\"/);
 assert.match(component,/localizedPath\(lang,"\/guides\/tractor-technical-terms\/"\)/);
 assert.match(layout,/Traktör parçaları ve teknik terimler/);
 assert.doesNotMatch(component,/fake review|AggregateRating|Offers|Product/i);
});
