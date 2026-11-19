import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {t} from "../src/lib/ui.ts";
const read=path=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const article=read("components/Basak2075Review.astro");
test("technical analysis is authored in the two published language variants and has no fake field test",()=>{
  assert.match(read("pages/reviews/basak-2075-bk/index.astro"),/lang="en"/);
  assert.match(read("pages/tr/reviews/basak-2075-bk/index.astro"),/lang="tr"/);
  assert.match(article,/availableLocales=\{\["en","tr"\]\}/);
  assert.match(article,/not a field test or an owner's review/i);
  assert.match(article,/saha testi veya sahip incelemesi değildir/);
  assert.match(article,/datetime="2026-11-19"/);
  assert.match(article,/Ba[şs]ak 2075 BK/);
});
test("every manufacturer figure is literal, source-linked and not confused with field testing",()=>{
  for(const fact of ["53 kW / 72 hp @ 2500 rpm","273 Nm @ 1600 rpm",
                     "3142 cm³","16F / 8R","540 @ 1953 engine rpm",
                     "540E @ 1506 engine rpm","3000 kg","3080 kg"])
    assert.ok(article.includes(fact),"Unverified or missing value "+fact);
  assert.match(article,/admin\.basaktraktor\.com\.tr\/upload\/4c2bf423-/);
  assert.match(article,/2075-bk-2-wd/);
  assert.match(article,/2075-bk-kabin/);
  assert.match(article,/manufacturer-stated specifications/);
  assert.doesNotMatch(article,/aggregateRating|priceCurrency|\bProduct\b.*@type/i);
});
test("model detail links only to the relevant Başak 2075 BK review with honest fallback language",()=>{
  const detail=read("components/TractorDetail.astro");
  assert.match(detail,/hasBasak2075Analysis/);
  assert.match(detail,/tractor\.model_name\.trim\(\)\.toLocaleLowerCase\("tr"\)==="2075 bk"/);
  assert.match(detail,/\{hasBasak2075Analysis && <section/);
  assert.match(detail,/\/reviews\/basak-2075-bk\//);
  for(const lang of LOCALES)assert.ok(t(lang,"reviewedModelAnalysis").trim().length>=3,lang);
});
