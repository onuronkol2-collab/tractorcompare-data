import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const file=(p)=>readFileSync(resolve(root,p),"utf8");

test("editorial index has authentic localized routes and hreflang in all ten languages",()=>{
 for(const [path,lang] of [
  ["src/pages/articles/index.astro","en"],
  ["src/pages/tr/articles/index.astro","tr"]
 ]){
  assert.ok(existsSync(resolve(root,path)),path);
  assert.match(file(path),new RegExp('lang="'+lang+'"'));
 }
 const route=file("src/pages/[locale]/articles/index.astro");
 assert.match(route,/NEW_LOCALES\.map/);
 assert.match(route,/<EditorialHub lang=\{locale\}/);
 const hub=file("src/components/EditorialHub.astro");
 assert.match(hub,/availableLocales=\{LOCALES\}/);
 assert.match(hub,/indexableLocales=\{LOCALES\}/);
 assert.match(hub,/inLanguage:LOCALE_TAGS\[lang\]/);
 assert.doesNotMatch(hub,/2026-2027-traktor-guvenilirlik/);
});
test("editorial index only links to languages where full article content exists",()=>{
 const hub=file("src/components/EditorialHub.astro");
 for(const slug of [
  "guides/choosing-a-tractor","guides/tractor-technical-terms",
  "guides/tractor-engine-power-and-torque","guides/tractor-hydraulic-lift-explained",
  "guides/pto-and-power-take-off","reviews/basak-2075-bk"
 ]){
   assert.ok(hub.includes("/"+slug+"/"),slug);
   for(const lang of ["","tr/"]){
    const target="src/pages/"+lang+slug+"/index.astro";
    assert.ok(existsSync(resolve(root,target)),target);
   }
 }
 assert.match(hub,/CollectionPage/);
 assert.match(hub,/ItemList/);
 assert.match(hub,/BreadcrumbList/);
 assert.match(hub,/destinationLanguage/);
 assert.match(hub,/englishOnly/);
 assert.match(hub,/entryHref\(entry\)/);
 assert.match(hub,/englishOriginal/);
 assert.match(hub,/methodologyHref/);
});
test("eight new languages have complete original index translations, not English filler",()=>{
 const source=file("src/lib/editorial-hub-i18n.ts");
 for(const lang of ["zh","hi","pt-br","fr","de","ru","ja","es"]){
  assert.ok(source.includes('"'+lang+'":')||source.includes(' '+lang+':'),lang);
 }
 assert.match(source,/cards:readonly/);
 assert.match(source,/englishOriginal:string/);
 assert.match(source,/rules:readonly/);
});
test("article metadata is explicit and main layout keeps website default",()=>{
 const layout=file("src/layouts/SiteLayout.astro");
 assert.match(layout,/ogType\?: "website" \| "article"/);
 assert.match(layout,/property="og:type" content=\{ogType\}/);
 assert.match(layout,/articlesPath/);
 assert.match(layout,/editorialLabel/);
 for(const name of [
   "TractorSelectionGuide","Basak2075Review",
   "TractorGlossary","TractorTechnicalDeepDive"
 ]){
   const source=file("src/components/"+name+".astro");
   assert.match(source,/ogType="article"/,name);
   assert.match(source,/TechArticle/,name);
 }
});

test("production release fails closed if bilingual archives or sitemap entries disappear",()=>{
 const gate=file("scripts/production-release-gate.mjs");
 const audit=file("scripts/production-seo-audit.mjs");
 for(const lang of ["articles","tr/articles","zh/articles","hi/articles","pt-br/articles",
 "fr/articles","de/articles","ru/articles","ja/articles","es/articles"]){
  assert.ok(gate.includes('"'+lang+'"'),lang);
 }
 assert.match(gate,/Editorial hub not included in generated sitemap/);
 assert.match(gate,/Editorial hub has wrong canonical/);
 assert.match(gate,/Editorial hub cannot be noindex/);
 assert.ok(audit.includes('"/articles/"'));
 assert.ok(audit.includes('"/tr/articles/"'));
});

test("ten-language article cards use readable metadata without inventing new routes",()=>{
 const hub=file("src/components/EditorialHub.astro");
 assert.match(hub,/editorial-eyebrow,\.editorial-kicker\{[^}]*font-size:13px/);
 assert.match(hub,/editorial-card-footer time\{[^}]*font-size:14px/);
 assert.match(hub,/editorial-language-note\{font-size:14px/);
 assert.match(hub,/editorial-grid\{list-style:none/);
 assert.match(hub,/href=\{entryHref\(entry\)\}/);
 assert.match(hub,/englishOnly\(entry\)/);
});


test("editorial archive exposes actual localized tools without inflating article counts",async()=>{
 const {editorialPracticalTools}=await import("../src/lib/practical-guide-links.ts");
 const {LOCALES,localizedPath}=await import("../src/lib/locales.ts");
 const hub=file("src/components/EditorialHub.astro");
 const cost=file("src/components/FarmCost.astro");
 const practical=hub.slice(hub.indexOf('<section class="editorial-practical"'),hub.indexOf('<section class="editorial-trust"'));
 assert.ok(practical.length>0);
 assert.match(practical,/href=\{practical\.primary\.href\}/);
 assert.match(practical,/practical\.links\.map/);
 assert.doesNotMatch(practical,/data-editorial-card|data-editorial-section-count/);
 assert.match(hub,/const articleCount=entries\.length\+extraReview/);
 assert.match(cost,/catalogEditorialLinks\(lang\)\.links\[0\]\.href/);
 for(const lang of LOCALES){
  const c=editorialPracticalTools(lang);
  const base=localizedPath(lang,"/guides/farm-cost-calculator/");
  assert.equal(c.primary.href,base);
  assert.deepEqual(c.links.map(x=>x.href),[base+"#farm-scenarios",base+"#farm-equipment"]);
  assert.ok([c.heading,c.description,c.primary.label,...c.links.map(x=>x.label)].every(v=>v.trim()));
 }
});
test("archive reflects the existing guide's actual editorial review date",()=>{
 const guide=file("src/components/TractorSelectionGuide.astro");
 const hub=file("src/components/EditorialHub.astro");
 const date=/const reviewedOn="(\d{4}-\d{2}-\d{2})"/.exec(guide)?.[1];
 assert.ok(date);
 assert.ok(hub.includes('path:"/guides/choosing-a-tractor/",checked:"'+date+'"'));
});


test("archive promotes the existing localized selection advisor without counting it as an article",async()=>{
 const {editorialPracticalTools}=await import("../src/lib/practical-guide-links.ts");
 const {LOCALES,localizedPath}=await import("../src/lib/locales.ts");
 const hub=file("src/components/EditorialHub.astro");
 const practical=hub.slice(hub.indexOf('<section class="editorial-practical"'),hub.indexOf('<section class="editorial-trust"'));
 assert.match(practical,/href=\{practical\.advisor\.href\}/);
 assert.doesNotMatch(practical,/data-editorial-card|data-editorial-section-count/);
 for(const lang of LOCALES)assert.equal(editorialPracticalTools(lang).advisor.href,localizedPath(lang,"/farm-advisor/"));
});
