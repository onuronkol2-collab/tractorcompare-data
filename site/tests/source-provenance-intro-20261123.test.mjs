import test from "node:test";
import assert from "node:assert/strict";
import {LOCALES} from "../src/lib/locales.ts";
import {UI,t,assertCompleteTranslations} from "../src/lib/ui.ts";
import {readFileSync} from "node:fs";
const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");

test("all ten model-spec intros are source-neutral and do not claim manufacturer-only provenance",()=>{
  assert.equal(LOCALES.length,10);
  assert.equal(UI.modelSpecIntro.length,10);
  for(const lang of LOCALES){
    const copy=t(lang,"modelSpecIntro");
    assert.ok(copy.length>(["zh","ja"].includes(lang)?30:70),lang+" introductory source copy too short");
    assert.ok(!/only checked original manufacturer|yalnızca doğrulanmış resmî üretici|仅提供已核实的制造商|केवल सत्यापित मूल निर्माता|Somente fontes originais verificadas|Seules les sources originales|nur zu geprüften Originalquellen|только на проверенные оригинальные|メーカー公式資料に限り|Solo se enlazan fuentes originales/i.test(copy),lang+" falsely restricts source provenance");
  }
  assert.match(t("en","modelSpecIntro"),/manufacturer documents or independently published technical materials/);
  assert.match(t("tr","modelSpecIntro"),/üretici belgeleri veya bağımsız yayımlanmış teknik materyaller/);
  assert.match(t("fr","modelSpecIntro"),/indépendamment/);
  assert.match(t("de","modelSpecIntro"),/unabhängig/);
  assert.match(t("ru","modelSpecIntro"),/независимо/);
  assert.match(t("ja","modelSpecIntro"),/独立/);
  assert.doesNotThrow(assertCompleteTranslations);
});

test("public tractor detail UI still displays the exact translation key without altering raw evidence",()=>{
  assert.match(detail,/t\(lang,"modelSpecIntro"\)/);
  assert.match(detail,/groupSpecifications\(tractor.specifications,lang\)/);
  assert.match(detail,/modelStructuredData\(tractor, lang/);
});
