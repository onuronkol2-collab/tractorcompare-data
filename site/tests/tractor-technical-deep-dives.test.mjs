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
  assert.equal(article.sections.length,article.slug==="tractor-engine-power-and-torque"?6:5);
  assert.equal(article.glossary.length,5);
  const ids=new Set();
  for(const section of article.sections){
   assert.ok(!ids.has(section.anchor),section.anchor);ids.add(section.anchor);
   for(const locale of ["en","tr"]){
    assert.ok(section.title[locale].length>12);
    assert.equal(section.paragraphs[locale].length,["olcum-standartlari","hp-ps-kw"].includes(section.anchor)?3:2);
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
 assert.match(component,/editorial-photos\.ts/);
 assert.match(component,/photo\.licenseUrl|hero\.licenseUrl/);
 assert.match(component,/data-tractor-photo/);
 assert.match(component,/availableLocales=\{\["en","tr"\]\}/);
 assert.match(component,/\"@type\":\"TechArticle\"/);
 assert.match(component,/\"@type\":\"BreadcrumbList\"/);
 assert.match(component,/\"@type\":\"WebPage\"/);
 assert.doesNotMatch(component,/\"@type\":\"FAQPage\"/);
 assert.match(component,/localizedPath\(lang,"\/guides\/tractor-technical-terms\/"\)/);
 assert.match(layout,/href=\{glossaryPath\}/);
 assert.match(readFileSync(new URL("../src/lib/ui.ts",import.meta.url),"utf8"),/Traktör parçaları ve teknik terimler/);
 assert.doesNotMatch(component,/fake review|AggregateRating|Offers|Product/i);
});

test("PTO and hydraulic articles preserve safety meaning in both languages with visible official citations",()=>{
 const pto=TECHNICAL_DEEP_DIVES.find(x=>x.slug==="pto-and-power-take-off");
 const hydraulic=TECHNICAL_DEEP_DIVES.find(x=>x.slug==="tractor-hydraulic-lift-explained");
 assert.ok(pto&&hydraulic);
 const ptoTurkish=pto.sections.flatMap(x=>x.paragraphs.tr).join(" ");
 const ptoEnglish=pto.sections.flatMap(x=>x.paragraphs.en).join(" ");
 assert.match(ptoTurkish,/motor kapalıyken ve tüm hareket durduğunda/);
 assert.match(ptoEnglish,/parking brake, disengage power, stop the engine, remove the key/);
 const hydTurkish=hydraulic.sections.flatMap(x=>x.paragraphs.tr).join(" ");
 const hydEnglish=hydraulic.sections.flatMap(x=>x.paragraphs.en).join(" ");
 assert.match(hydTurkish,/kaçakları elle aramayın/);
 assert.match(hydEnglish,/release stored pressure safely/);
 assert.match(hydEnglish,/Never feel for a pressurized hydraulic leak with bare hands/);
 for(const url of [
  "https://www.hse.gov.uk/agriculture/topics/machinery/fluid.htm",
  "https://www.hse.gov.uk/agriculture/topics/machinery/safe-use-1.htm"
 ]){
  assert.equal(component.split(url).length-1,2,"HSE source must be in exact visible/citation parity: "+url);
 }
 assert.match(component,/hasHydraulicSafety = slug === "tractor-hydraulic-lift-explained"/);
 assert.match(component,/hasPtoSafety = slug === "pto-and-power-take-off"/);
 assert.match(component,/const hasEditorialUpdate = hasPowerStandards \|\| hasHydraulicSafety \|\| hasPtoSafety/);
 assert.match(component,/dateModified:editedOn/);
});
