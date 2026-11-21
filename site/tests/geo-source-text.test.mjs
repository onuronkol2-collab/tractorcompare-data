import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {MODEL_SOURCE_COPY} from "../src/lib/model-source-index.ts";

const evidence=readFileSync(new URL("../src/lib/model-evidence-answers.ts",import.meta.url),"utf8");
const labels={
 en:"Manufacturer sources",
 tr:"Üretici kaynakları",
 zh:"制造商来源",
 hi:"निर्माता के स्रोत",
 "pt-br":"Fontes do fabricante",
 fr:"Les sources du constructeur",
 de:"Herstellerquellen",
 ru:"Источники производителя",
 ja:"メーカーの情報源",
 es:"las fuentes del fabricante",
};
test("all ten locale source intros cover linked HTML product pages as well as PDFs",()=>{
 assert.deepEqual(Object.keys(labels),[...LOCALES]);
 for(const lang of LOCALES){
  const copy=MODEL_SOURCE_COPY[lang];
  assert.ok(copy.introduction.includes(labels[lang]),lang+" source intro");
  assert.ok(copy.caution.length>45,lang+" comparison warning");
  assert.ok(copy.recordReviewed.length>7,lang+" review date");
  assert.doesNotMatch(copy.introduction,/manufacturer documents|üretici belgeleri|製造商文件|निर्माता के दस्तावेज़|documentos do fabricante|documents constructeur|herstellerunterlagen|メーカー文書|documentos del fabricante/i,lang);
 }
});
test("TR/EN model fact summaries never assume a cited source URL is a PDF",()=>{
 for(const misleading of [
  "linked document","reviewed document","kaynak belgesinden",
  "bağlantılı belgeden","teknik belgede"
 ]){
  assert.ok(!evidence.includes(misleading),"Unexpected document-only claim: "+misleading);
 }
 assert.match(evidence,/linked source/);
 assert.match(evidence,/bağlantılı kaynaktan/);
 assert.match(evidence,/reviewed source/);
});
test("source caveats still warn about variant and measurement conditions",()=>{
 for(const lang of LOCALES){
  const copy=MODEL_SOURCE_COPY[lang];
  assert.ok(copy.caution.length>55,lang);
  assert.ok(copy.introduction.length>55,lang);
 }
});
