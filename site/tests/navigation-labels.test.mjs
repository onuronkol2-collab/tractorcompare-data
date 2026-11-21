import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES,localizedPath} from "../src/lib/locales.ts";
import {forumText} from "../src/lib/forum-i18n.ts";
import {advisorText,advisorTranslationIssues} from "../src/lib/advisor-i18n.ts";
import {t,assertCompleteTranslations} from "../src/lib/ui.ts";

const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
const forumLabels=["Tractor forum","Topluluk Forumu","拖拉机论坛","ट्रैक्टर फ़ोरम",
  "Fórum de tratores","Forum des tracteurs","Traktorforum","Форум о тракторах",
  "トラクターフォーラム","Foro de tractores"];
const advisorLabels=["Tractor selection assistant","Traktör Seçim Asistanı","拖拉机选型助手","ट्रैक्टर चयन सहायक",
  "Assistente de escolha de tratores","Assistant au choix de tracteur","Traktor-Auswahlassistent","Помощник по выбору трактора",
  "トラクター選びアシスタント","Asistente para elegir tractor"];
const searchLabels=["Search","Ara","搜索","खोजें","Pesquisar","Rechercher","Suchen","Найти","検索","Buscar"];

test("ten natural forum names tell visitors that the space contains tractor discussions",()=>{
 assert.equal(LOCALES.length,10);
 for(const [i,lang] of LOCALES.entries()){
  assert.equal(forumText(lang,"name"),forumLabels[i],lang);
  assert.ok(forumText(lang,"heading").trim().length>=(lang==="zh"||lang==="ja"?9:15),"Forum subject must remain descriptive: "+lang);
  assert.ok(forumText(lang,"intro").trim().length>=(lang==="zh"||lang==="ja"?20:30),lang+" accurate community context");
 }
 assert.equal(forumText("tr","name"),"Topluluk Forumu");
});

test("farm preselection is accurately named a tractor selection assistant without a certified fitment promise",()=>{
 assert.deepEqual(advisorTranslationIssues(),[]);
 for(const [i,lang] of LOCALES.entries()){
  assert.equal(advisorText(lang,"nav"),advisorLabels[i],lang);
  assert.ok(advisorText(lang,"lead").length>=(lang==="zh"||lang==="ja"?16:30),lang+" should preserve non-certified disclaimer");
 }
});

test("search submit has a clear label, not an unrelated Discover action, in ten locales",()=>{
 assert.doesNotThrow(assertCompleteTranslations);
 for(const [i,lang] of LOCALES.entries())assert.equal(t(lang,"navSearch"),searchLabels[i]);
 assert.match(layout,/<button type="submit">\{t\(lang,"navSearch"\)\}<\/button>/);
 assert.match(layout,/<button type="submit" aria-label=\{t\(lang,"navSearch"\)\}>\{t\(lang,"navSearch"\)\}<\/button>/);
});

test("primary navigation and footer share accurate labels and retain crawlable canonical routes",()=>{
 const root=layout.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0]||"";
 const mobile=layout.match(/<nav class="mobile-nav-links"[\s\S]*?<\/nav>/)?.[0]||"";
 const footer=layout.match(/<div class="footer-links">[\s\S]*?<\/div>/)?.[0]||"";
 for(const block of [root,mobile,footer]){
  assert.ok(block.includes('href={forumPath}'),"Forum link missing");
  assert.ok(block.includes('href={advisorPath}'),"Tractor finder link missing");
  assert.ok(block.includes('forumCopy(lang,"name")'),"Forum label no longer linked to localized content");
  assert.ok(block.includes('tx(lang,"nav")'),"Finder label no longer linked to localized form");
 }
 assert.match(footer,/<a href=\{homePath\}>\{t\(lang,"navHome"\)\}<\/a>/);
 assert.match(layout,/const forumPath = localizedPath\(lang, "\/forum\/"\)/);
 assert.match(layout,/const advisorPath = localizedPath\(lang, "\/farm-advisor\/"\)/);
 for(const lang of LOCALES){
  assert.ok(localizedPath(lang,"/forum/").endsWith("/forum/"));
  assert.ok(localizedPath(lang,"/farm-advisor/").endsWith("/farm-advisor/"));
 }
 assert.doesNotMatch(layout,/SearchAction|FAQPage|AggregateRating/);
});
