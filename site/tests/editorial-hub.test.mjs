import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const file=(p)=>readFileSync(resolve(root,p),"utf8");

test("article hub only creates genuine TR/EN editorial routes",()=>{
 const en="src/pages/articles/index.astro";
 const tr="src/pages/tr/articles/index.astro";
 assert.ok(existsSync(resolve(root,en)));
 assert.ok(existsSync(resolve(root,tr)));
 assert.match(file(en),/lang="en"/);
 assert.match(file(tr),/lang="tr"/);
 const hub=file("src/components/EditorialHub.astro");
 assert.match(hub,/availableLocales=\{\["en","tr"\]\}/);
 assert.match(hub,/indexableLocales=\{\["en","tr"\]\}/);
 assert.doesNotMatch(hub,/2026-2027-traktor-guvenilirlik/);
});
test("editorial index only lists existing articles in both supported languages",()=>{
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
