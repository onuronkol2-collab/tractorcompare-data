import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {LOCALES,BREADCRUMB_LABELS,RELATED_PAGES_LABELS} from "../src/lib/locales.ts";

const read=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const LANGS=LOCALES.filter(lang=>!["tr","en"].includes(lang));
const minChars=(locale,latin,compact)=>["zh","ja"].includes(locale)?compact:latin;

/**
 * The two existing long-form translation sources are JSON-shaped TS literals.
 * Parse them as DATA, never evaluate arbitrary repository code.
 */
function sourceTranslations(path,constant){
 const text=read(path);
 const at=text.indexOf("export const "+constant);
 assert.ok(at>=0,"Missing "+constant);
 const eq=text.indexOf("=",at),start=text.indexOf("{",eq),end=text.indexOf("\n};",start);
 assert.ok(eq>=0&&start>eq&&end>start,"Cannot locate "+constant);
 return JSON.parse(text.slice(start,end+2).replace(/,\s*}/g,"}"));
}
const selections=sourceTranslations("lib/tractor-guide-i18n.ts","GUIDE_TRANSLATIONS");
const reviews=sourceTranslations("lib/basak-2075-review-i18n.ts","REVIEW_TRANSLATIONS");

const textKeys=[
 "title","meta","category","h1","lead","updated","noTest",
 "worksheetTitle","sourceTitle","sourceIntro","sourcePrefix","ctaTitle",
 "ctaDesc","catalog","compare","method","limits","breadcrumb"
];
const reviewKeys=[
 "title","meta","kicker","h1","lead","lastChecked","disclaimer",
 "figures","label","value","sourceTitle","sourceIntro","manufacturerSource",
 "pdfSource","cabinSource","twoWheelSource","tableSource","variantNote",
 "modelPage","selectionGuide","catalog","methodNote"
];

test("ten distinct accessible navigation labels are maintained in all supported languages",()=>{
 assert.equal(LOCALES.length,10);
 for(const locale of LOCALES){
  assert.ok(BREADCRUMB_LABELS[locale]?.trim().length>=4,locale+" breadcrumb");
  assert.ok(RELATED_PAGES_LABELS[locale]?.trim().length>=4,locale+" related pages");
 }
 const selection=read("components/TractorSelectionGuide.astro");
 const review=read("components/Basak2075Review.astro");
 assert.match(selection,/aria-label=\{BREADCRUMB_LABELS\[lang\]\}/);
 assert.match(review,/aria-label=\{BREADCRUMB_LABELS\[lang\]\}/);
 assert.match(review,/aria-label=\{RELATED_PAGES_LABELS\[lang\]\}/);
});

test("every translated selection guide retains all sections, explanations, questions and references",()=>{
 assert.deepEqual(Object.keys(selections).sort(),[...LANGS].sort());
 const expectedRefs=[[3],[0,1,2],[0,1],[0,1],[0],[3]];
 for(const locale of LANGS){
  const source=selections[locale];
  for(const key of textKeys)assert.ok(typeof source[key]==="string"&&source[key].trim().length>minChars(locale,4,1),locale+" "+key);
  assert.equal(source.sections.length,6,locale+" section count");
  source.sections.forEach((section,index)=>{
   assert.ok(section.title.trim().length>4,locale+" chapter title");
   assert.ok(section.question.trim().length>20,locale+" question");
   assert.equal(section.paragraphs.length,2,locale+" paragraphs "+index);
   for(const paragraph of section.paragraphs)assert.ok(paragraph.trim().length>minChars(locale,70,35),locale+" paragraph unexpectedly short");
   assert.deepEqual(section.refs,expectedRefs[index],locale+" sources "+index);
  });
  assert.equal(source.headers.length,3,locale+" comparison column count");
  assert.equal(source.rows.length,5,locale+" comparison row count");
  source.rows.forEach(row=>assert.equal(row.length,3,locale+" comparison values"));
  assert.ok(source.noTest.trim().length>minChars(locale,60,30)&&source.limits.trim().length>minChars(locale,50,18),locale+" evidence limits");
 }
});

test("each Başak technical review preserves claims, safety limits, table rows and variant cautions",()=>{
 assert.deepEqual(Object.keys(reviews).sort(),[...LANGS].sort());
 const expected=["53","72","273","3142","1600","1953","1506","3000","3080","540E"];
 for(const locale of LANGS){
  const r=reviews[locale];
  for(const key of reviewKeys)assert.ok(typeof r[key]==="string"&&r[key].trim().length>minChars(locale,3,1),locale+" "+key);
  assert.equal(r.rowLabels.length,8,locale+" table field names");
  assert.equal(r.localizedValues.length,3,locale+" localized descriptive values");
  assert.equal(r.sectionTitles.length,4,locale+" chapter count");
  assert.equal(r.sectionParagraphs.length,4,locale+" paragraph groups");
  for(const section of r.sectionParagraphs){
   assert.equal(section.length,2,locale+" source paragraph parity");
   for(const paragraph of section)assert.ok(paragraph.trim().length>minChars(locale,80,40),locale+" missing paragraph");
  }
  const body=JSON.stringify(r.sectionParagraphs);
  for(const num of expected)assert.ok(body.includes(num),locale+" missing technical number "+num);
  assert.ok(r.disclaimer.trim().length>minChars(locale,55,30),locale+" field-test disclosure missing");
  assert.ok(r.variantNote.trim().length>minChars(locale,20,12),locale+" variant caution missing");
 }
 const sharedTable=read("components/Basak2075Review.astro");
 assert.match(sharedTable,/53 kW \/ 72 hp @ 2500 rpm/);
 assert.match(sharedTable,/273 Nm @ 1600 rpm/);
 assert.match(sharedTable,/540E @ 1506 engine rpm/);
});

test("the editorial archive never passes an untranslated article off as a translated one",()=>{
 const archive=read("components/EditorialHub.astro");
 const localeCopy=read("lib/editorial-hub-i18n.ts");
 assert.match(archive,/const destinationLanguage/);
 assert.match(archive,/englishOnly\(entry\)/);
 assert.match(archive,/localized\?\.englishOriginal/);
 assert.match(archive,/hreflang=\{LOCALE_TAGS\[destinationLanguage\(entry\)\]\}/);
 assert.match(archive,/aria-label=\{titleFor\(entry\).*localized\?\.englishOriginal/s);
 for(const lang of LANGS){
  assert.ok(localeCopy.includes(lang+":" )||localeCopy.includes('"'+lang+'":'),lang+" missing archive translation");
 }
 assert.ok(localeCopy.includes("आँकड़ों की तुलना करें"),"Hindi comparison grammar regression");
 assert.ok(localeCopy.includes("कर्षण क्षमता"),"Hindi traction terminology regression");
});

test("original citations and actual translation scope remain honest",()=>{
 const choose=read("components/TractorSelectionGuide.astro");
 const review=read("components/Basak2075Review.astro");
 const deepDive=read("components/TractorTechnicalDeepDive.astro");
 assert.match(choose,/guideTranslation\(lang\)/);
 assert.match(review,/reviewedLanguage\(lang\)/);
 assert.match(choose,/sources\.map/);
 assert.match(review,/citation:\[manufacturerUrl,brochureUrl,cabinUrl,twoWheelUrl,btManufacturerUrl\]/);
 assert.match(deepDive,/availableLocales=\{\["en","tr"\]\}/);
});
