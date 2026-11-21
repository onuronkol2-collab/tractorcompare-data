import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {t,assertCompleteTranslations} from "../src/lib/ui.ts";
import {LOCALES,localizedPath} from "../src/lib/locales.ts";

const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
const style=readFileSync(new URL("../src/styles/global.css",import.meta.url),"utf8");

test("all ten locales have distinct translated discovery labels and valid target paths",()=>{
 assert.doesNotThrow(assertCompleteTranslations);
 for(const lang of LOCALES){
  for(const key of ["navHome","navResources","navTechnicalTerms","findTractor","navExplore"]){
   assert.ok(t(lang,key).trim().length>1,lang+" "+key);
  }
  assert.equal(localizedPath(lang,"/tractors/"),lang==="en"?"/tractors/":"/"+lang+"/tractors/");
 }
});

test("global discovery search works as a real GET form without JS or new API requests",()=>{
 assert.match(layout,/class="header-search-form" action=\{catalogPath\} method="get" role="search"/);
 assert.match(layout,/class="mobile-menu-search" action=\{catalogPath\} method="get" role="search"/);
 assert.match(layout,/id="header-model-search" name="q" type="search" maxlength="100"/);
 assert.match(layout,/id="mobile-model-search" name="q" type="search" maxlength="100"/);
 assert.match(layout,/class="mobile-nav-links" aria-label=\{t\(lang,"navMain"\)\}/);
 assert.doesNotMatch(layout,/fetch\(["']\/api\/global-search/);
});

test("navigation offers guides, sources, glossary and locale-safe English fallbacks",()=>{
 for(const name of ["guidePath","glossaryPath","methodologyPath","articlesPath","catalogPath","comparePath","forumPath","advisorPath"]){
  assert.ok(layout.includes("href={"+name+"}"),"Missing crawlable link "+name);
 }
 assert.match(layout,/glossaryPath = localizedPath\(lang==="tr"\?"tr":"en"/);
 assert.match(layout,/methodologyPath = localizedPath\(lang==="tr"\?"tr":"en"/);
 assert.match(layout,/class="resource-nav-links"/);
 assert.match(layout,/class="mobile-nav-group-label"/);
 assert.match(layout,/lang!=="tr"&&lang!=="en"\?" \(EN\)":""/);
});

test("details remain keyboard accessible and current-page navigation does not falsify leaf pages",()=>{
 assert.match(layout,/data-site-disclosure/);
 assert.match(layout,/event\.key !== "Escape"/);
 assert.match(layout,/\[data-language-choice\]/);
 assert.match(layout,/aria-current=\{plainPath==="\/tractors\/"\?"page":undefined\}/);
 assert.match(style,/mobile-nav-links \{ max-height:/);
 assert.match(style,/mobile-nav-links a\[aria-current="page"\]/);
 assert.match(style,/header-search-form :is\(input, button\):focus-visible/);
});

test("global navigation does not alter indexability or add misleading synthetic schema",()=>{
 assert.match(layout,/const indexingEnabled =/);
 assert.match(layout,/indexableLocales\.map/);
 assert.match(layout,/rel="canonical"/);
 assert.doesNotMatch(layout,/SearchAction|FAQPage|AggregateRating/);
});
