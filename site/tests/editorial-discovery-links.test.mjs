import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES,localizedPath} from "../src/lib/locales.ts";
import {editorialHubTranslation} from "../src/lib/editorial-hub-i18n.ts";
import {catalogEditorialLinks} from "../src/lib/catalog-editorial-links.ts";

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

test("reviewed GS comparison is a natural SSR link only on verified EN/TR homepages",()=>{
 assert.match(home,/const reviewedGsPair=\(lang==="tr"\|\|lang==="en"\)/);
 assert.match(home,/curatedDeutz5DPair\(catalogue\.tractors\)/);
 assert.match(home,/const reviewedGsPairHref=reviewedGsPair/);
 assert.match(home,/localizedPath\(lang,DEUTZ_5D_GS_PILOT\.path\)/);
 assert.match(home,/\{reviewedGsPairHref && <div class="home-editorial-resource home-editorial-source-pair">/);
 assert.match(home,/href=\{reviewedGsPairHref\}/);
 assert.match(home,/Bağımsız saha testi değildir\./);
 assert.match(home,/Not an independent field test\./);
 // The existing ten-language editorial cards stay unchanged; a verified pair
 // appears as one extra resource, not an invented page in eight locales.
 assert.equal((home.match(/class="home-editorial-card"/g)||[]).length,2);
 assert.equal((home.match(/href=\{reviewedGsPairHref\}/g)||[]).length,1);
 for(const lang of ["en","tr"]){
  const destination=localizedPath(lang,"/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/");
  assert.equal(destination,lang==="en"
   ?"/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/"
   :"/tr/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/");
 }
 for(const lang of LOCALES.filter(x=>x!=="en"&&x!=="tr"))
  assert.ok(!["en","tr"].includes(lang),lang+" must not receive untranslated comparison");
});

test("catalog exposes published editorial resources in ten languages, without invented glossary routes",()=>{
 const catalog=read("components/TractorCatalog.astro");
 assert.match(catalog,/const editorial = catalogEditorialLinks\(lang\)/);
 assert.match(catalog,/<nav class="catalog-editorial-links" aria-label=\{editorial.label\}>/);
 assert.match(catalog,/editorial.links.map\(link=><a href=\{link.href\}>/);
 assert.match(catalog,/\.catalog-editorial-links a\{[^}]*min-height:44px/);
 assert.match(catalog,/\.catalog-editorial-links a:focus-visible/);
 for(const lang of LOCALES){
  const {label,links}=catalogEditorialLinks(lang);
  assert.ok(label.trim().length>2);
  const expected=["/articles/","/guides/choosing-a-tractor/"];
  if(lang==="en"||lang==="tr") expected.push("/guides/tractor-technical-terms/");
  assert.deepEqual(links.map(x=>x.href),expected.map(x=>localizedPath(lang,x)));
  assert.ok(links.every(x=>x.label.trim().length>2));
  if(lang!=="en"&&lang!=="tr"){
   const copy=editorialHubTranslation(lang);
   assert.equal(links[0].label,copy?.heading);
   assert.equal(links[1].label,copy?.cards[0][0]);
  }
 }
});
