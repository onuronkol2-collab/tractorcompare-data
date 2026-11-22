import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TECHNICAL_DEEP_DIVES } from "../src/lib/tractor-technical-deep-dives.ts";

const power=TECHNICAL_DEEP_DIVES.find(x=>x.slug==="tractor-engine-power-and-torque");
const article=readFileSync(new URL("../src/components/TractorTechnicalDeepDive.astro",import.meta.url),"utf8");

test("original bilingual power guide distinguishes manufacturer engine claims from independently tested tractor output",()=>{
  assert.ok(power,"existing engine-power guide must remain indexed");
  const section=power.sections.find(x=>x.anchor==="olcum-standartlari");
  assert.ok(section);
  assert.match(section.title.tr,/OECD Code 2/);
  assert.match(section.title.en,/UN\/ECE R120/);
  for(const lang of ["en","tr"]){
    assert.equal(section.paragraphs[lang].length,3);
    for(const paragraph of section.paragraphs[lang])
      assert.ok(paragraph.length>170,"substantive native-language explanation required");
    const all=section.paragraphs[lang].join(" ");
    assert.match(all,/OECD Code 2/);
    assert.match(all,/ISO 14396/);
    assert.match(all,/100 HP|identical numerical horsepower figures/);
  }
});

test("updated guide cites approved primary test standards and trusted independent specialist context",()=>{
  assert.match(article,/https:\/\/www\.oecd\.org\/en\/topics\/tractors\.html/);
  assert.match(article,/https:\/\/eur-lex\.europa\.eu\/eli\/reg\/2019\/405\/oj\/eng/);
  assert.match(article,/https:\/\/www\.dlg\.org\/en\/magazin\/survey-tests\/tractor-model-descriptions-no-standardised-information/);
  assert.match(article,/hasPowerStandards &&/);
  assert.match(article,/dateModified:editedOn/);
  assert.match(article,/availableLocales=\{\["en","tr"\]\}/);
  assert.doesNotMatch(article,/AggregateRating|offers:|"@type":"Product"/);
});

test("non-power educational guides retain their original wording and 20 November review date",()=>{
  const other=TECHNICAL_DEEP_DIVES.filter(x=>x.slug!=="tractor-engine-power-and-torque");
  assert.ok(other.length>0);
  for(const guide of other){
    assert.equal(guide.sections.some(x=>x.anchor==="olcum-standartlari"),false);
  }
  assert.match(article,/hasEditorialUpdate \? "2026-11-22" : "2026-11-20"/);
});
