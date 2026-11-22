import test from "node:test";
import assert from "node:assert/strict";
import {forumSearchText} from "../src/lib/forum-search.mjs";

test("Turkish dotted capital I and accent-free queries match all published/live cards",()=>{
 const content=forumSearchText("İŞ MAKİNELERİ · ÇİFTÇİ GÖRÜŞÜ · ŞANZIMAN","tr");
 for(const query of ["iş makineleri","is makineleri","Çiftçi","ciftci","sanziman"])
  assert.equal(content.includes(forumSearchText(query,"tr")),true,query);
 const dotless=forumSearchText("IRMAK","tr");
 assert.equal(dotless.includes(forumSearchText("irmak","tr")),true);
});
test("diacritic-tolerant French, German, Spanish and Portuguese search",()=>{
 assert.equal(forumSearchText("Über Öl","de").includes(forumSearchText("uber ol","de")),true);
 assert.equal(forumSearchText("Réparation","fr"),"reparation");
 assert.equal(forumSearchText("comparación","es"),"comparacion");
 assert.equal(forumSearchText("transmissão","pt-br"),"transmissao");
});
test("non-Latin script search preserves significant combining marks",()=>{
 assert.equal(forumSearchText("भारत में ट्रैक्टर","hi"),"भारत में ट्रैक्टर");
 assert.equal(forumSearchText("ガソリン","ja"),"ガソリン");
 assert.equal(forumSearchText("发动机","zh"),"发动机");
 assert.equal(forumSearchText("Сервис","ru"),"сервис");
});
test("never modifies source text and safely handles empty values",()=>{
 const original="İ Ş Ü";
 assert.equal(forumSearchText(original,"tr"),"i s u");
 assert.equal(original,"İ Ş Ü");
 assert.equal(forumSearchText(null,"en"),"");
});
