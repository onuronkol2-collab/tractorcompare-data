import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditManualForumTranslation} from "./tractor-forum-manual-translation-qa.mjs";
const base={
 sourceTitle:"2026 Bayi Memnuniyeti",
 targetTitle:"2026 Dealer Satisfaction",
 sourceBody:"## Sonuç\n\nSame 13,7 / 20 puan, John Deere 12,3 puan. Güç 75 hp ve 3000 kg. https://example.org/study\n\n| Sıra | Marka | Puan |\n|---|---|---|\n| 1 | Same | 13,7 |\n\n- Bayi memnuniyeti güvenilirlikle aynı değildir.",
 targetBody:"## Results\n\nSame scored 13,7 / 20, John Deere 12,3. Power is 75 hp and 3000 kg. https://example.org/study\n\n| Rank | Brand | Score |\n|---|---|---|\n| 1 | Same | 13,7 |\n\n- Dealer satisfaction is not mechanical reliability.",
 locale:"en"
};
test("manual translations must preserve numbers, physical units, headings, links, table and brands",()=>{
 assert.deepEqual(auditManualForumTranslation(base).errors,[]);
 for(const [key,value,reason] of [
  ["targetBody",base.targetBody.replace("75 hp","75 PS"),"numeric_units_changed"],
  ["targetBody",base.targetBody.replace("3000","2000"),"numeric_facts_changed"],
  ["targetBody",base.targetBody.replace("example.org","example.com"),"urls_changed"],
  ["targetBody",base.targetBody.replaceAll("Same","Incorrect"),"brand_missing:Same"],
  ["targetBody",base.targetBody.replace("## Results","Results"),"heading_structure_changed"],
  ["targetBody",base.targetBody.replace("| 1 | Same | 13,7 |","1 Same 13,7"),"table_shape_changed"],
  ["targetBody",base.targetBody.replace("- Dealer satisfaction","Dealer satisfaction"),"list_structure_changed"]
 ]){
  const got=auditManualForumTranslation({...base,[key]:value});
  assert.ok(got.errors.some(x=>x===reason),reason);
 }
});
test("wrong alphabet never passes just because numbers match",()=>{
 const v=auditManualForumTranslation({...base,locale:"ru"});
 assert.ok(v.errors.includes("target_script_missing"));
});
test("production Edge handler has NO old provider imports or model calls",()=>{
 const body=readFileSync(new URL("../supabase/functions/tractor-forum-translate/index.ts",import.meta.url),"utf8");
 assert.match(body,/if\(input\?\.action!=="status"\)/);
 assert.match(body,/return reply\(423/);
 assert.doesNotMatch(body,/import \{.*(?:Gemini|Azure|Cloudflare).*from/);
 assert.doesNotMatch(body,/api\.cloudflare\.com|api\.cognitive\.microsofttranslator\.com|generativelanguage\.googleapis\.com/);
});
test("production workflow has no legacy TEST ONAY or active queue processor",()=>{
 const body=readFileSync(new URL("../.github/workflows/tractorvs-forum-translation.yml",import.meta.url),"utf8");
 assert.match(body,/workflow_dispatch:/);
 assert.match(body,/- KONTROL/);
 assert.doesNotMatch(body,/^\s*- (?:ONAY|TEST|TOPLU_TEST)$/m);
 assert.doesNotMatch(body,/^\s*(?:process|synthetic_test|synthetic_batch_test):/m);
});

test("CJK month numbers are allowed ONLY when source has the matching Turkish month",()=>{
 const tr={sourceTitle:"2026 Traktör Bayi Memnuniyeti",sourceBody:"## Tarih\n\n10 Kasım 2026 tarihinde bir araştırma yayımlandı."};
 const zh=auditManualForumTranslation({...tr,locale:"zh",
  targetTitle:"2026年拖拉机经销商满意度",
  targetBody:"## 日期\n\n研究于2026年11月10日公布。"});
 assert.ok(!zh.errors.includes("numeric_facts_changed"),JSON.stringify(zh.errors));
 const ja=auditManualForumTranslation({...tr,locale:"ja",
  targetTitle:"2026年トラクター販売店満足度",
  targetBody:"## 発表日\n\n2026年11月10日に調査が発表されました。"});
 assert.ok(!ja.errors.includes("numeric_facts_changed"),JSON.stringify(ja.errors));
 const broken=auditManualForumTranslation({...tr,locale:"zh",
  targetTitle:"2026年拖拉机经销商满意度",
  targetBody:"## 日期\n\n研究于2026年12月10日公布。"});
 assert.ok(broken.errors.includes("numeric_facts_changed"));
});

test("percent placement is localized without changing the measured value",()=>{
 const source={
  sourceTitle:"2026 Bayi Memnuniyeti Puanları",
  sourceBody:"## Sonuç\n\nBayi memnuniyetinde %2,6 fark vardır ve motor gücü 75 hp'dir."
 };
 const target={
  targetTitle:"2026 Dealer Satisfaction Scores",
  targetBody:"## Results\n\nThe dealer satisfaction difference is 2.6%, and engine power is 75 hp."
 };
 const good=auditManualForumTranslation({...source,...target,locale:"en"});
 assert.ok(!good.errors.includes("numeric_units_changed"),JSON.stringify(good.errors));
 assert.ok(!good.errors.includes("numeric_facts_changed"),JSON.stringify(good.errors));
 const changed=auditManualForumTranslation({...source,...target,
  targetBody:target.targetBody.replace("2.6%","2.7%"),locale:"en"});
 assert.ok(changed.errors.includes("numeric_units_changed"),JSON.stringify(changed.errors));
 assert.ok(changed.errors.includes("numeric_facts_changed"),JSON.stringify(changed.errors));
 const wrongUnit=auditManualForumTranslation({...source,...target,
  targetBody:target.targetBody.replace("75 hp","75 PS"),locale:"en"});
 assert.ok(wrongUnit.errors.includes("numeric_units_changed"),JSON.stringify(wrongUnit.errors));
});

test("French date ordinal and month are checked as a full calendar date",()=>{
 const source={
  sourceTitle:"2026 Bayi Memnuniyeti",
  sourceBody:"## Tarihler\n\n1 Eylül 2026 tarihinde duyuruldu. Nisan–Mayıs 2026 aralığı."
 };
 const good={
  targetTitle:"Satisfaction des concessionnaires en 2026",
  targetBody:"## Dates\n\nAnnoncé le 1er septembre 2026. Entre avril et mai 2026.",
  locale:"fr"
 };
 assert.ok(!auditManualForumTranslation({...source,...good}).errors.includes("calendar_facts_changed"));
 for(const replacement of ["1er octobre 2026","2 septembre 2026","1er septembre 2027"]){
  const bad=auditManualForumTranslation({...source,...good,
   targetBody:good.targetBody.replace("1er septembre 2026",replacement)});
  assert.ok(bad.errors.includes("calendar_facts_changed"),replacement);
 }
 const badRange=auditManualForumTranslation({...source,...good,
  targetBody:good.targetBody.replace("avril et mai 2026","avril et juin 2026")});
 assert.ok(badRange.errors.includes("calendar_facts_changed"));
});
test("Chinese/Japanese calendars accept natural date notation but not invented days/months",()=>{
 const source={
  sourceTitle:"2026 Bayi Memnuniyeti",
  sourceBody:"## Tarihler\n\n10 Kasım 2026 açıklandı. Nisan–Mayıs 2026 aralığı."
 };
 for(const [locale,targetTitle,targetBody,wrongDate,wrongRange] of [
  ["zh","2026年经销商满意度","## 日期\n\n2026年11月10日公布。2026年4月至5月调查。",
   "2026年12月10日","2026年4月至6月"],
  ["ja","2026年販売店満足度","## 日程\n\n2026年11月10日に公表。2026年4月から5月に調査。",
   "2026年11月11日","2026年4月から6月"]
 ]){
  const baseTest={...source,locale,targetTitle,targetBody};
  const good=auditManualForumTranslation(baseTest);
  assert.ok(!good.errors.includes("calendar_facts_changed"),JSON.stringify(good.errors));
  const badDate=auditManualForumTranslation({...baseTest,
   targetBody:targetBody.replace("2026年11月10日",wrongDate)});
  assert.ok(badDate.errors.includes("calendar_facts_changed"),locale);
  const badRange=auditManualForumTranslation({...baseTest,
   targetBody:targetBody.replace(locale==="zh"?"2026年4月至5月":"2026年4月から5月",wrongRange)});
  assert.ok(badRange.errors.includes("calendar_facts_changed"),locale);
 }
});

test("same numbers with swapped scores between brands must never be considered publish-safe",()=>{
 const sourceTitle="2026 Traktör Bayi Memnuniyeti";
 const targetTitle="2026 Tractor Dealer Satisfaction";
 const sourceBody="## Sıralama\n\n| Sıra | Marka | Puan |\n|---|---|---|\n| 🥇 1 | Same | **13,7** |\n| 🥈 2 | Deutz-Fahr | **13,2** |\n\n- Sıralama bayi memnuniyetine dayanır.";
 const validBody="## Ranking\n\n| Rank | Brand | Score |\n|---|---|---|\n| 🥇 1 | Same | **13.7** |\n| 🥈 2 | Deutz-Fahr | **13.2** |\n\n- Ranking reflects dealer satisfaction.";
 const cfg={sourceTitle,targetTitle,sourceBody,locale:"en"};
 const ok=auditManualForumTranslation({...cfg,targetBody:validBody});
 assert.ok(!ok.errors.includes("brand_rank_score_mapping_changed"),JSON.stringify(ok));
 const swapped=validBody.replace("Same | **13.7**","Same | **13.2**")
  .replace("Deutz-Fahr | **13.2**","Deutz-Fahr | **13.7**");
 const bad=auditManualForumTranslation({...cfg,targetBody:swapped});
 assert.ok(!bad.errors.includes("numeric_facts_changed"),"global numeric bag check misses swaps");
 assert.ok(bad.errors.includes("brand_rank_score_mapping_changed"),JSON.stringify(bad));
 const swappedRank=validBody.replace("🥇 1 | Same","🥇 2 | Same");
 const badRank=auditManualForumTranslation({...cfg,targetBody:swappedRank});
 assert.ok(badRank.errors.includes("brand_rank_score_mapping_changed"),JSON.stringify(badRank));
});
