import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {t} from "../src/lib/ui.ts";

const read=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("original tractor selection guide has exactly two actually authored and reciprocal language routes",()=>{
  const en=read("pages/guides/choosing-a-tractor/index.astro");
  const tr=read("pages/tr/guides/choosing-a-tractor/index.astro");
  const guide=read("components/TractorSelectionGuide.astro");
  assert.match(en,/<TractorSelectionGuide lang="en" \/>/);
  assert.match(tr,/<TractorSelectionGuide lang="tr" \/>/);
  assert.match(guide,/availableLocales=\{\["en","tr"\]\}/);
  assert.match(guide,/Traktör seçerken nelere dikkat edilmeli/);
  assert.match(guide,/How to choose a tractor beyond horsepower/);
  assert.match(guide,/datetime="2026-11-19"/);
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
  assert.doesNotMatch(guide,/[\'"]@type[\'"]\s*:\s*[\'"](?:AggregateRating|Offer)[\'"]|author:\s*\{|fakeReview/i);
  assert.match(guide,/localizedPath\(lang,"\/compare\/"\)/);
  assert.match(guide,/localizedPath\(lang,"\/tractors\/"\)/);
});

test("guide is discoverable in every locale without pretending to offer 10 translated articles",()=>{
  const layout=read("layouts/SiteLayout.astro");
  const methodology=read("components/DataMethodology.astro");
  assert.equal(LOCALES.length,10);
  for(const lang of LOCALES){
    assert.ok(t(lang,"guideLink").trim().length>=4,lang+" guide link");
  }
  assert.match(layout,/lang==="tr"\?"\/tr\/guides\/choosing-a-tractor\/"\:"\/guides\/choosing-a-tractor\/"/);
  assert.match(layout,/\?"":" \(EN\)"/);
  assert.match(methodology,/href=\{tr\?"\/tr\/guides\/choosing-a-tractor\/":"\/guides\/choosing-a-tractor\/"\}/);
});
