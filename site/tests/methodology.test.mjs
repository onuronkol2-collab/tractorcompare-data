import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {t,assertCompleteTranslations} from "../src/lib/ui.ts";
const read=path=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("methodology publishes only its two actually authored language routes",()=>{
  assert.match(read("pages/methodology/index.astro"),/lang="en"/);
  assert.match(read("pages/tr/methodology/index.astro"),/lang="tr"/);
  const body=read("components/DataMethodology.astro");
  assert.match(body,/availableLocales=\{\["en","tr"\]\}/);
  assert.match(body,/TractorVS verileri nasıl doğrular/);
  assert.match(body,/How TractorVS checks its tractor data/);
  assert.match(body,/2026-11-19/);
  assert.match(body,/github.com\/onuronkol2-collab\/tractorcompare-data\/blob\/main\/site\/src\/lib\/catalog.ts/);
  assert.match(body,/TRACTORVS_IMAGE_POLICY.md/);
  assert.match(body,/Fotoğraf ve lisans politikası/);
  assert.match(body,/Photographs and permissions/);
  assert.doesNotMatch(body,/aggregateRating|claimed independent laboratory tested|invented customer reviews/i);
});

test("generic SiteLayout preserves full 10-locale hreflang by default and scopes untranslated pages",()=>{
  const layout=read("layouts/SiteLayout.astro");
  assert.match(layout,/availableLocales = LOCALES/);
  assert.match(layout,/availableLocales\.map\(\(locale\) => \(\{/);
  assert.match(layout,/const languageChoices = availableLocales\.map/);
  assert.match(layout,/lang==="tr"\?"\/tr\/methodology\/":"\/methodology\/"/);
  assert.doesNotThrow(assertCompleteTranslations);
  assert.equal(LOCALES.length,10);
  for(const l of LOCALES) assert.ok(t(l,"methodologyLink").trim().length>5);
});
