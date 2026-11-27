import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES, NEW_LOCALES, localizedPath} from "../src/lib/locales.ts";
import {guideTranslation} from "../src/lib/tractor-guide-i18n.ts";
import {t} from "../src/lib/ui.ts";

const read=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("tractor selection guide renders authentic reciprocal ten-language pages",()=>{
  const en=read("pages/guides/choosing-a-tractor/index.astro");
  const tr=read("pages/tr/guides/choosing-a-tractor/index.astro");
  const guide=read("components/TractorSelectionGuide.astro");
  assert.match(en,/<TractorSelectionGuide lang="en" \/>/);
  assert.match(tr,/<TractorSelectionGuide lang="tr" \/>/);
  assert.match(guide,/availableLocales=\{LOCALES\}/);
  assert.match(read("pages/[locale]/guides/choosing-a-tractor/index.astro"),/NEW_LOCALES\.map/);
  assert.match(guide,/Traktör seçerken nelere dikkat edilmeli/);
  assert.match(guide,/How to choose a tractor beyond horsepower/);
  assert.match(guide,/datetime=\{reviewedOn\}/);
  assert.match(guide,/const reviewedOn="2026-11-27"/);
  assert.ok((guide.match(/question:/g)||[]).length>=12,"each of six topics must have an actual check question in both languages");
  assert.match(guide,/<table>/);
  assert.match(guide,/<th scope="row">/);
});

test("each cited institution is actually linked and no fabricated tractor test or author is presented",()=>{
  const guide=read("components/TractorSelectionGuide.astro");
  const links=[
    "https://www.oecd.org/en/topics/tractors.html",
    "https://tractortestlab.unl.edu/",
    "https://tractortestlab.unl.edu/test-reports/",
    "https://extension.umn.edu/agriculture/farm-operations-and-systems/small-farms/buying-a-used-tractor"
  ];
  for(const url of links)assert.ok(guide.includes(url),"Missing source: "+url);
  assert.match(guide,/TractorVS bu traktörleri sahada test ettiğini/);
  assert.match(guide,/has not personally field-tested/);
  assert.doesNotMatch(guide,/[\'"]@type[\'"]\s*:\s*[\'"](?:AggregateRating|Offer|Person)[\'"]|fakeReview/i);
  assert.match(guide,/author:\s*\{\s*"@type":"Organization",name:"TractorVS"\}/);
  assert.match(guide,/localizedPath\(lang,"\/compare\/"\)/);
  assert.match(guide,/localizedPath\(lang,"\/tractors\/"\)/);
});

test("guide content is complete in all eight additional languages",()=>{
  const guide=read("components/TractorSelectionGuide.astro");
  for(const lang of NEW_LOCALES){
    const translation=guideTranslation(lang);
    assert.ok(translation,lang+" translation missing");
    assert.ok(translation.h1.length>=8 && translation.meta.length>=50,lang+" heading/meta");
    assert.equal(translation.sections.length,6,lang+" sections");
    assert.equal(translation.rows.length,5,lang+" comparison rows");
    assert.equal(translation.headers.length,3,lang+" comparison headers");
    assert.ok(translation.noTest.length>=(lang==="zh"||lang==="ja"?40:90) && translation.limits.length>=(lang==="zh"||lang==="ja"?25:70),lang+" honesty");
    for(const sec of translation.sections){
      assert.equal(sec.paragraphs.length,2,lang+" section paragraphs");
      assert.ok(sec.paragraphs.every(x=>x.length>=(lang==="zh"||lang==="ja"?45:130)),lang+" substantive paragraphs");
      assert.ok(sec.question.length>=(lang==="zh"||lang==="ja"?18:45),lang+" question");
      assert.ok(sec.refs.length>0 && sec.refs.every(x=>x>=0 && x<4));
    }
    assert.ok(translation.rows.every(x=>x.length===3 && x.every(s=>s.trim().length>=2)),lang+" rows");
    assert.ok(localizedPath(lang,"/guides/choosing-a-tractor/").startsWith("/"+lang+"/"));
  }
  assert.match(guide,/guideTranslation\(lang\)/);
  assert.match(guide,/const copy=localizedGuide \?\? baseCopy/);
});
test("guide is discoverable in all ten locales without fake EN fallbacks",()=>{
  const layout=read("layouts/SiteLayout.astro");
  const methodology=read("components/DataMethodology.astro");
  assert.equal(LOCALES.length,10);
  for(const lang of LOCALES){
    assert.ok(t(lang,"guideLink").trim().length>=4,lang+" guide link");
  }
  assert.match(layout,/const guidePath = localizedPath\(lang, "\/guides\/choosing-a-tractor\/"\)/);
  assert.match(layout,/href=\{guidePath\}/);
  assert.match(read("components/TractorSelectionGuide.astro"),/availableLocales=\{LOCALES\}/);
  assert.match(methodology,/href=\{tr\?"\/tr\/guides\/choosing-a-tractor\/":"\/guides\/choosing-a-tractor\/"\}/);
});


test("ten published selection guides link to actual scenario, equipment and cost sections and back",async()=>{
 const {practicalGuideLinks}=await import("../src/lib/practical-guide-links.ts");
 const guide=read("components/TractorSelectionGuide.astro");
 const cost=read("components/FarmCost.astro");
 const scenario=read("components/FarmScenarioTools.astro");
 const decision=read("components/FarmDecisionTools.astro");
 assert.match(guide,/id="guide-practical-heading"/);
 assert.match(guide,/practicalGuideLinks\(lang\)\.links\.map/);
 assert.match(cost,/href=\{practicalGuideLinks\(lang\)\.guide\.href\}/);
 assert.match(scenario,/id="farm-scenarios"/);
 assert.match(decision,/id="farm-equipment"/);
 assert.match(cost,/id="farm-cost-form"/);
 assert.match(read("pages/[locale]/guides/farm-cost-calculator/index.astro"),/NEW_LOCALES\.map/);
 for(const lang of LOCALES){
  const c=practicalGuideLinks(lang);
  const base=localizedPath(lang,"/guides/farm-cost-calculator/");
  assert.deepEqual(c.links.map(x=>x.href),["#farm-scenarios","#farm-equipment","#farm-cost-form"].map(x=>base+x));
  assert.equal(c.guide.href,localizedPath(lang,"/guides/choosing-a-tractor/"));
  assert.ok([c.heading,c.description,c.returnNote,c.guide.label,...c.links.map(x=>x.label)].every(x=>typeof x==="string"&&x.trim()));
 }
});


test("published selection guides and advisors link to one another in every locale",async()=>{
 const {practicalGuideLinks,ADVISOR_DISCOVERY_NOTE}=await import("../src/lib/practical-guide-links.ts");
 const guide=read("components/TractorSelectionGuide.astro");
 const advisor=read("components/FarmAdvisor.astro");
 assert.match(guide,/href=\{practicalGuideLinks\(lang\)\.advisor\.href\}/);
 assert.match(guide,/ADVISOR_DISCOVERY_NOTE\[lang\]/);
 assert.match(advisor,/href=\{localizedPath\(lang,"\/guides\/choosing-a-tractor\/"\)\}/);
 assert.match(read("pages/[locale]/farm-advisor/index.astro"),/NEW_LOCALES\.map/);
 for(const lang of LOCALES){
  const p=practicalGuideLinks(lang);
  assert.equal(p.advisor.href,localizedPath(lang,"/farm-advisor/"));
  assert.ok(p.advisor.label.trim()&&ADVISOR_DISCOVERY_NOTE[lang].trim());
 }
 assert.equal(new Set(Object.values(ADVISOR_DISCOVERY_NOTE)).size,10);
});
