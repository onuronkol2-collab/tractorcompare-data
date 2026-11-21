import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES,localizedPath} from "../src/lib/locales.ts";
import {editorialHubTranslation} from "../src/lib/editorial-hub-i18n.ts";

const read=path=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const home=read("components/HomeExperience.astro");
const model=read("components/TractorDetail.astro");
const styles=read("styles/home-experience.css");

test("all ten homepages expose real, localized, source-backed article entry points in server HTML",()=>{
 assert.equal(LOCALES.length,10);
 assert.match(home,/const articlesUrl = localizedPath\(lang, "\/articles\/"\)/);
 assert.match(home,/const selectionGuideUrl = localizedPath\(lang, "\/guides\/choosing-a-tractor\/"\)/);
 assert.match(home,/const basakReviewUrl = localizedPath\(lang, "\/reviews\/basak-2075-bk\/"\)/);
 assert.match(home,/class="home-editorial"/);
 assert.match(home,/href=\{articlesUrl\}/);
 assert.match(home,/href=\{selectionGuideUrl\}/);
 assert.match(home,/href=\{basakReviewUrl\}/);
 assert.match(home,/<h2 id="home-editorial-title">/);
 assert.equal((home.match(/class="home-editorial-card"/g)||[]).length,2);
 assert.doesNotMatch(home,/Article|FAQPage|AggregateRating/);
 for(const lang of LOCALES){
  const article=localizedPath(lang,"/articles/");
  const selection=localizedPath(lang,"/guides/choosing-a-tractor/");
  const review=localizedPath(lang,"/reviews/basak-2075-bk/");
  for(const link of [article,selection,review]){
   assert.ok(link.startsWith(lang==="en"?"/":"/"+lang+"/"),lang+" incorrect locale path "+link);
  }
  if(lang!=="tr"&&lang!=="en"){
   const cardCopy=editorialHubTranslation(lang)?.cards;
   assert.equal(cardCopy?.length,6,lang+" six curated article entries");
   assert.ok(cardCopy[0][0].length>2&&cardCopy[5][1].length>9,lang+" translated card copy");
  }
 }
});

test("home editorial section is accessible, concise and responsive",()=>{
 assert.match(styles,/\.home-editorial-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(styles,/\.home-editorial-card:focus-visible/);
 assert.match(styles,/@media \(max-width:800px\)[\s\S]*?\.home-editorial-grid \{ grid-template-columns: 1fr; \}/);
 assert.match(styles,/@media \(max-width:620px\)[\s\S]*?\.home-editorial-card \{ min-height: 0;/);
 assert.match(home,/class="home-editorial-arrow"/);
});

test("untranslated model-locales link to genuine native-language selection guide, not fake glossary",()=>{
 assert.match(model,/const selectionGuideUrl=localizedPath\(lang,"\/guides\/choosing-a-tractor\/"\)/);
 assert.match(model,/editorialHubTranslation\(lang\)\?\.cards\[0\]/);
 assert.match(model,/translatedSelection && <a class="model-spec-glossary-banner" href=\{selectionGuideUrl\}>/);
 assert.match(model,/\(lang==="en"\|\|lang==="tr"\)/);
 assert.match(model,/href=\{localizedPath\(lang,"\/guides\/tractor-technical-terms\/"\)\}/);
 assert.doesNotMatch(model,/href=\{localizedPath\(lang,"\/guides\/tractor-technical-terms\/"\)\}\s*aria-label=/);
});
