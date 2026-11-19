import {readFileSync} from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { LOCALES, NEW_LOCALES, localizedPath, unlocalizedPath, preferredLocale } from "../src/lib/locales.ts";
import { UI, t, assertCompleteTranslations } from "../src/lib/ui.ts";
import { HOME, homeText } from "../src/lib/home-ui.ts";
import { validateTechnicalGlossary, localizedSpecificationName } from "../src/lib/spec-i18n.ts";
import worker from "../worker/index.js";
import { suggestedLocale } from "../src/lib/locale-hint.ts";

test("ten locales include unchanged legacy English and Turkish paths", () => {
  assert.equal(LOCALES.length,10);
  assert.equal(NEW_LOCALES.length,8);
  assert.equal(localizedPath("en","/tractors/model-abc/"),"/tractors/model-abc/");
  assert.equal(localizedPath("tr","/tractors/model-abc/"),"/tr/tractors/model-abc/");
  assert.equal(localizedPath("pt-br","/tractors/model-abc/"),"/pt-br/tractors/model-abc/");
  assert.equal(unlocalizedPath("/de/tractors/model-abc/"),"/tractors/model-abc/");
  assert.equal(unlocalizedPath("/tr/"),"/");
  assert.equal(unlocalizedPath("/tractor-details/"),"/tractor-details/");
});

test("all ten languages have nonempty UI and home translations", () => {
  assert.doesNotThrow(assertCompleteTranslations);
  assert.doesNotThrow(validateTechnicalGlossary);
  for (const locale of LOCALES) {
    for (const key of Object.keys(UI)) {
      assert.ok(t(locale,key).trim(),locale+" "+key);
    }
    for (const key of Object.keys(HOME)) {
      assert.ok(homeText(locale,key).trim(),locale+" "+key);
    }
  }
});

test("core technical concepts remain distinct in all new languages", () => {
  for (const locale of NEW_LOCALES) {
    const nominal = localizedSpecificationName("engine_rated_power","",locale);
    const max = localizedSpecificationName("engine_max_power","",locale);
    assert.ok(nominal && max);
    assert.notEqual(nominal,max,locale+" nominal and max power must stay distinct");
    assert.notEqual(localizedSpecificationName("hydraulic_total_flow","",locale),
      localizedSpecificationName("hydraulic_main_flow","",locale));
  }
});

test("country routing respects ten markets and Canadian bilingual choice", () => {
  for (const [country,expected] of [
    ["TR","tr"],["DE","de"],["CN","zh"],["IN","hi"],["BR","pt-br"],
    ["FR","fr"],["RU","ru"],["JP","ja"],["ES","es"],["US","en"],
  ]) assert.equal(preferredLocale(country),expected,country);
  assert.equal(preferredLocale("CA","fr-CA,fr;q=0.9,en;q=0.7"),"fr");
  assert.equal(preferredLocale("CA","en-CA,en;q=0.9"),"en");
  assert.equal(preferredLocale("XX","ja,en;q=0.8"),"ja");
  assert.equal(preferredLocale("XX","xx"),"en");
});

function mockRequest(path, country="DE", options={}) {
  return {
    url:"https://tractorvs.example"+path,
    method:"GET",
    cf:{country},
    headers:new Headers({
      accept:"text/html", "sec-fetch-mode":"navigate", "user-agent":"Mozilla/5.0",
      ...(options.headers||{}),
    }),
  };
}
const env={ASSETS:{fetch:async () => new Response("static asset",{status:200})}};

test("canonical root is stable HTML for people, crawlers and every country", async () => {
  for (const country of ["DE","TR","CN","US","JP"]) {
    for(const agent of ["Mozilla/5.0","Googlebot","Bingbot"]) {
      const response=await worker.fetch(mockRequest("/",country,{headers:{"user-agent":agent}}),env);
      assert.equal(response.status,200,country+" / "+agent);
      assert.equal(response.headers.get("location"),null);
      assert.equal(response.headers.get("x-robots-tag"),null);
    }
  }
  assert.equal((await worker.fetch(mockRequest("/tr/","DE"),env)).status,200);
});

test("explicit visitor preference overrides country and is cookie-backed",async () => {
  const selected=await worker.fetch(mockRequest("/language/ja/?next=%2Fja%2Fcompare%2F","DE"),env);
  assert.equal(selected.status,302);
  assert.equal(selected.headers.get("location"),"/ja/compare/");
  assert.match(selected.headers.get("set-cookie"),/tractorvs_locale=ja/);
  assert.match(selected.headers.get("set-cookie"),/HttpOnly/);
  const returnVisit=await worker.fetch(mockRequest("/","DE",{headers:{cookie:"tractorvs_locale=ja"}}),env);
  assert.equal(returnVisit.status,200, "Saved locale must not rewrite the canonical root");
  assert.equal(returnVisit.headers.get("location"),null);
});

test("language switch prevents external redirects and preserves safe query",async () => {
  const external=await worker.fetch(mockRequest("/language/fr/?next=https%3A%2F%2Fevil.example","TR"),env);
  assert.equal(external.headers.get("location"),"/fr/");
  const protocolRelative=await worker.fetch(mockRequest("/language/fr/?next=%2F%2Fevil.example","TR"),env);
  assert.equal(protocolRelative.headers.get("location"),"/fr/");
  const safe=await worker.fetch(mockRequest("/language/fr/?next=%2Ffr%2Fcompare%2F%3Fleft%3Da%26right%3Db","TR"),env);
  assert.equal(safe.headers.get("location"),"/fr/compare/?left=a&right=b");
});

test("non-intrusive locale hint uses browser language, not guessed country",()=>{
  assert.equal(suggestedLocale("tr-TR"),"tr");
  assert.equal(suggestedLocale("zh-CN"),"zh");
  assert.equal(suggestedLocale("pt-PT"),"pt-br");
  assert.equal(suggestedLocale("ja-JP"),"ja");
  assert.equal(suggestedLocale("de-DE"),"de");
  assert.equal(suggestedLocale("en-GB"),null);
  assert.equal(suggestedLocale("xx-XX"),null);
  const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
  const prompt=readFileSync(new URL("../src/components/LocaleSuggestion.astro",import.meta.url),"utf8");
  assert.match(layout,/lang==="en" && Astro.url.pathname==="\/" && <LocaleSuggestion/);
  assert.match(prompt,/locale-suggestion\[hidden\]\{display:none\}/);
  assert.match(prompt,/sessionStorage/);
  assert.match(prompt,/\?next=/);
});
