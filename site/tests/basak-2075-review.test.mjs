import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES,NEW_LOCALES,localizedPath} from "../src/lib/locales.ts";
import {reviewedLanguage} from "../src/lib/basak-2075-review-i18n.ts";
import {BASAK_VARIANT_COMPARISON_COPY} from "../src/lib/basak-2075-comparison-i18n.ts";
import {t} from "../src/lib/ui.ts";
const read=path=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const article=read("components/Basak2075Review.astro");
test("technical analysis is authored in ten locale routes and has no fake field test",()=>{
  assert.match(read("pages/reviews/basak-2075-bk/index.astro"),/lang="en"/);
  assert.match(read("pages/tr/reviews/basak-2075-bk/index.astro"),/lang="tr"/);
  assert.match(article,/availableLocales=\{LOCALES\}/);
  assert.match(read("pages/[locale]/reviews/basak-2075-bk/index.astro"),/NEW_LOCALES\.map/);
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
test("model detail links only to the exact Başak 2075 BK review in the active locale",()=>{
  const detail=read("components/TractorDetail.astro");
  assert.match(detail,/hasBasak2075Analysis/);
  assert.match(detail,/tractor\.model_name\.trim\(\)\.toLocaleLowerCase\("tr"\)==="2075 bk"/);
  assert.match(detail,/\{hasBasak2075Analysis && <section/);
  assert.match(detail,/\/reviews\/basak-2075-bk\//);
  assert.match(detail,/tractor\.model_name\.trim\(\)\.toLocaleLowerCase\("tr"\)==="2075 bt"/);
  for(const lang of LOCALES)assert.ok(t(lang,"reviewedModelAnalysis").trim().length>=3,lang);
});

test("Turkish manufacturer table labels preserve technical values and English equivalents",()=>{
  const article=read("components/Basak2075Review.astro");
  for(const phrase of [
    "4 silindir · 3142 cm³","Mekanik senkromeçli · 16 ileri / 8 geri",
    "540 (1953 motor dev/dak) · 540E (1506 motor dev/dak)",
    "Mechanical synchromesh · 16F / 8R",
    "540 @ 1953 engine rpm · 540E @ 1506 engine rpm"
  ])assert.ok(article.includes(phrase),"Missing identity-preserving translation: "+phrase);
  assert.match(article,/tr\?row\.trValue\?\?row\.value:row\.value/);
  assert.match(article,/const rows: Array<\{tr:string;en:string;value:string;trValue\?:string\}>/);
  for(const literal of ["53 kW / 72 hp @ 2500 rpm","273 Nm @ 1600 rpm","3000 kg","3080 kg","72 L"])
    assert.ok(article.includes(literal),"Measured number must be left unchanged: "+literal);
});

test("all eight newly authored review locales contain full evidence-bounded technical explanations",()=>{
  for(const lang of NEW_LOCALES){
    const r=reviewedLanguage(lang);
    assert.ok(r,lang+" review translation missing");
    assert.ok(r.h1.length>=8 && r.meta.length>=(lang==="zh"||lang==="ja"?35:80));
    assert.equal(r.rowLabels.length,8,lang+" table headings");
    assert.equal(r.localizedValues.length,3,lang+" natural engine/gear/PTO wording");
    assert.equal(r.sectionTitles.length,4,lang+" full sections");
    assert.equal(r.sectionParagraphs.length,4);
    for(const part of r.sectionParagraphs){
      assert.equal(part.length,2,lang+" analysis arguments");
      assert.ok(part.every(t=>t.length>=(lang==="zh"||lang==="ja"?45:120)),lang+" substantive prose");
    }
    assert.ok(r.disclaimer.length>=(lang==="zh"||lang==="ja"?24:65),lang+" no-test disclaimer");
    assert.ok(localizedPath(lang,"/reviews/basak-2075-bk/").startsWith("/"+lang+"/"));
    assert.ok(r.sourceTitle && r.pdfSource && r.variantNote && r.methodNote);
  }
  assert.match(article,/reviewedLanguage\(lang\)/);
  assert.match(article,/localized\?\.rowLabels\[i\]/);
  assert.match(article,/localized\?localized\.sectionTitles/);
  assert.match(article,/localized\?\.sourceIntro/);
  assert.match(article,/const rows: Array<\{tr:string;en:string;value:string;trValue\?:string\}>/);
  const detail=read("components/TractorDetail.astro");
  assert.match(detail,/href=\{localizedPath\(lang,"\/reviews\/basak-2075-bk\/"\)\}/);
  assert.doesNotMatch(detail,/reviewedModelAnalysis"\)\}\{lang==="en"/);
});

test("all ten Başak review locales use the manufacturer's maximum engine power label, not rated power",()=>{
 const expected={
  ru:"Максимальная мощность двигателя (по данным изготовителя)",
  ja:"最大エンジン出力（メーカー公表値）",
  es:"Potencia máxima del motor (dato del fabricante)",
  "pt-br":"Potência máxima do motor (declarada pelo fabricante)",
  fr:"Puissance maximale du moteur (donnée constructeur)",
  de:"Maximale Motorleistung (Herstellerangabe)",
  zh:"最大发动机功率（制造商数据）",
  hi:"अधिकतम इंजन शक्ति (निर्माता के अनुसार)"
 };
 assert.match(article,/Azami motor gücü \(üretici beyanı\)/);
 assert.match(article,/Maximum engine power \(manufacturer-stated\)/);
 assert.doesNotMatch(article,/Nominal ve azami motor gücü|Rated and maximum engine power/);
 for(const locale of NEW_LOCALES){
  const item=reviewedLanguage(locale);
  assert.equal(item.rowLabels[1],expected[locale],locale+" power type must match manufacturer max-power heading");
 }
 assert.match(article,/53 kW \/ 72 hp @ 2500 rpm/);
 assert.match(article,/localized\?\.rowLabels\[i\]/);
 assert.match(article,/citation:\[manufacturerUrl,brochureUrl,cabinUrl,twoWheelUrl,btManufacturerUrl\]/);
});

test("manufacturer-backed BK 4WD vs BT comparison is accessible across ten languages",()=>{
  assert.deepEqual(Object.keys(BASAK_VARIANT_COMPARISON_COPY).sort(),[...LOCALES].sort());
  const checks=["72 HP @ 2500 rpm","273 Nm @ 1600 rpm","16 F / 8 R",
    "2205 mm","2120 mm","3080 kg","3515 kg"];
  for(const figure of checks)assert.ok(article.includes(figure),figure);
  assert.match(article,/basak-bk-bt-comparison-title/);
  assert.match(article,/review-variant-comparison/);
  assert.match(article,/review-comparison-cell-model/);
  assert.match(article,/dateModified:"2026-11-22"/);
  assert.match(article,/btManufacturerUrl/);
  assert.match(article,/publicBtModel/);
  assert.match(article,/source(?:s)?:/i);
  assert.match(article,/citation:\[manufacturerUrl,brochureUrl,cabinUrl,twoWheelUrl,btManufacturerUrl\]/);
  for(const locale of LOCALES){
    const copy=BASAK_VARIANT_COMPARISON_COPY[locale];
    assert.equal(copy.labels.length,5,locale+" labels");
    for(const key of ["heading","lead","metric","bk","bt","note","twoWheel","sources","viewBt","checked"])
      assert.ok(copy[key]?.trim().length>(locale==="zh"||locale==="ja"?1:7),locale+" "+key);
    assert.ok(copy.note.includes("435")&&copy.note.includes("85"),locale+" preserved dimensional differences");
    assert.ok(copy.twoWheel.includes("16")&&copy.twoWheel.includes("6"),locale+" 2WD gearbox caution");
  }
});
