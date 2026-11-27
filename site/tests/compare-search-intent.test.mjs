import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {t} from "../src/lib/ui.ts";

test("comparison titles distinguish all ten locales and describe real technical comparison",()=>{
 const component=readFileSync(new URL("../src/components/TractorComparison.astro",import.meta.url),"utf8");
 assert.match(component,/title=\{t\(lang,"compareTitle"\) \+ " \| TractorVS"\}/);
 assert.match(component,/description=\{t\(lang,"compareDesc"\)\}/);
 assert.match(component,/comparisonSpecs\(tractor, lang\)/);
 const titles=LOCALES.map(lang=>t(lang,"compareTitle")+" | TractorVS");
 assert.equal(new Set(titles).size,10);
 for(const title of titles){
  assert.ok(title.length<=60);
  assert.doesNotMatch(title,/\b(?:best|guaranteed|cheapest)\b|en iyi|garanti/i);
 }
 assert.match(t("en","compareTitle"),/specifications/);
 assert.match(t("tr","compareTitle"),/teknik özellikler/);
 assert.match(t("de","compareTitle"),/technische Daten/);
 assert.notEqual(t("pt-br","compareTitle"),t("es","compareTitle"));
});
