import test from "node:test";
import assert from "node:assert/strict";
import {LOCALES} from "../src/lib/locales.ts";
import {UI} from "../src/lib/ui.ts";
import {HOME} from "../src/lib/home-ui.ts";
import {advisorText,advisorTranslationIssues} from "../src/lib/advisor-i18n.ts";
import {FORUM_TEXT} from "../src/lib/forum-i18n.ts";
import {FORUM_EDITOR_COPY} from "../src/lib/forum-editor-i18n.ts";
import {FORUM_DASHBOARD_TEXT} from "../src/lib/forum-dashboard-i18n.ts";
import {FORUM_THREAD_NAV_TEXT} from "../src/lib/forum-thread-nav-i18n.ts";
import {FORUM_LIVE_TEXT} from "../src/lib/forum-live-i18n.ts";
import {MEMBER_TEXT} from "../src/lib/member-i18n.ts";
import {ANALYTICS_TEXT} from "../src/lib/analytics-i18n.ts";
import {INDEPENDENT_SOURCE_COPY} from "../src/lib/independent-source-i18n.ts";

/** Automated completeness and semantic guardrails; not native-speaker approval. */
const matches=(value)=>(value.match(/\{[A-Za-z][\w]*\}/g)||[]).sort();
const matricies={UI,HOME};
const localeRecords={FORUM_TEXT,FORUM_EDITOR_COPY,FORUM_DASHBOARD_TEXT,
 FORUM_THREAD_NAV_TEXT,FORUM_LIVE_TEXT,MEMBER_TEXT,ANALYTICS_TEXT,
 INDEPENDENT_SOURCE_COPY};

test("all public core UI arrays have a nonempty translation per supported locale",()=>{
 assert.equal(LOCALES.length,10);
 for(const [dictionary,records] of Object.entries(matricies)){
   for(const [key,values] of Object.entries(records)){
     assert.equal(values.length,10,dictionary+"."+key+" should have 10 translations");
     values.forEach((value,i)=>{
       assert.equal(typeof value,"string",dictionary+"."+key+" "+LOCALES[i]);
       assert.ok(value.trim(),dictionary+"."+key+" "+LOCALES[i]+" is blank");
       assert.deepEqual(matches(value),matches(values[0]),dictionary+"."+key+" "+LOCALES[i]+" placeholder mismatch");
     });
   }
 }
});

test("forum, membership, analytics and source attribution have identical keys in all ten locales",()=>{
 for(const [dictionary,records] of Object.entries(localeRecords)){
   assert.deepEqual(Object.keys(records).sort(),[...LOCALES].sort(),dictionary+" locale matrix");
   const base=records.en;
   const keys=Object.keys(base).sort();
   for(const locale of LOCALES){
     const translated=records[locale];
     assert.deepEqual(Object.keys(translated).sort(),keys,dictionary+" "+locale+" missing or extra keys");
     for(const key of keys){
       const value=translated[key];
       assert.equal(typeof value,"string",dictionary+" "+locale+"."+key+" not string");
       assert.ok(value.trim(),dictionary+" "+locale+"."+key+" blank");
       assert.deepEqual(matches(value),matches(base[key]),dictionary+" "+locale+"."+key+" placeholders");
     }
   }
 }
});

test("catalogue SEO description promises comparison and verified original manufacturer sources in all languages",()=>{
 const comparison={
   en:/compare/i,tr:/karşılaştır/u,zh:/比较|对比/u,hi:/तुलना/u,
   "pt-br":/compar/i,fr:/compar/i,de:/vergleich/i,
   ru:/сравн/iu,ja:/比較/u,es:/compar/i
 };
 const manufacturer={
   en:/manufacturer/i,tr:/üretici/iu,zh:/制造商/u,hi:/निर्माता/u,
   "pt-br":/fabricant/i,fr:/constructeur/i,de:/hersteller/i,
   ru:/производител/iu,ja:/メーカー/u,es:/fabricant/i
 };
 for(const [i,locale] of LOCALES.entries()){
   const description=UI.catalogDesc[i];
   assert.match(description,comparison[locale],locale+" missing comparison promise");
   assert.match(description,manufacturer[locale],locale+" missing manufacturer source reference");
 }
});

test("Japanese selection assistant preserves the full tractor-condition question",()=>{
 assert.equal(advisorText("ja","condition"),"トラクターの状態（新車・中古）");
 assert.deepEqual(advisorTranslationIssues(),[]);
});

// Guard material safety, price and unit-conversion semantics against future shortened translations.
test("every language retains key caveats in equipment, pricing and screening guidance",()=>{
 const markers={
  "priceNote": [
    "country",
    "ülke",
    "国家",
    "देश",
    "país",
    "pays",
    "Länder",
    "страну",
    "国",
    "país"
  ],
  "bigha": [
    "verified",
    "doğrulanmış",
    "核实",
    "सत्यापित",
    "verificada",
    "vérifiée",
    "geprüfte",
    "проверенный",
    "確認済み",
    "verificada"
  ],
  "unavailable": [
    "catalogue",
    "kataloğu",
    "目录",
    "कैटलॉग",
    "catálogo",
    "catalogue",
    "Katalog",
    "каталог",
    "機種一覧",
    "catálogo"
  ],
  "plowCaution": [
    "implement",
    "ekipman",
    "农具",
    "उपकरण",
    "implemento",
    "outil",
    "Geräte",
    "орудия",
    "作業機",
    "apero"
  ],
  "loaderCaution": [
    "safe lifting",
    "kaldırma güvenliğini",
    "举升安全",
    "सुरक्षित",
    "seguros",
    "sécurité du levage",
    "sicheres Heben",
    "безопасность подъёма",
    "安全な持ち上げ",
    "seguridad de elevación"
  ]
};
 for(const [key,terms] of Object.entries(markers)){
   LOCALES.forEach((locale,i)=>{
     const value=advisorText(locale,key).toLocaleLowerCase();
     assert.ok(value.includes(terms[i].toLocaleLowerCase()),locale+" "+key+" omits a material condition");
   });
 }
});
