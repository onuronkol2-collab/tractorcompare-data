import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {forumText} from "../src/lib/forum-i18n.ts";
import {FORUM_DASHBOARD_TEXT} from "../src/lib/forum-dashboard-i18n.ts";

const hub=readFileSync(new URL("../src/components/ForumHub.astro",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles/forum-readable.css",import.meta.url),"utf8");

test("empty category keeps user choice while surfacing a deliberate show-all action",()=>{
 assert.match(hub,/data-forum-empty-help hidden/);
 assert.match(hub,/data-forum-show-all/);
 assert.match(hub,/view==="latest"&&canList&&hasTopics&&count===0&&allFiltered/);
 assert.match(hub,/emptyReset\?\.addEventListener\("click"/);
 assert.match(hub,/view="latest";\s*resetFilters\(\)/);
 assert.match(hub,/selected="all";\s*filter\(\);input\?\.focus\(\)/);
 const filterBody=hub.slice(hub.indexOf(" const filter=()=>{"),hub.indexOf(" async function loadFollowing"));
 assert.match(filterBody,/markCategories\(\);/,"Filter refresh must also restore the active category controls");
 assert.match(hub,/data-forum-rail-category/);
 assert.match(hub,/data-forum-category/);
 assert.match(hub,/data-forum-tag-category/);
});
test("recommendations are limited to genuinely published forum rows and local URLs",()=>{
 assert.match(hub,/const suggestedTopics=\[\.\.\.topics\]/);
 assert.match(hub,/const topics=publicTopics\.filter\(topic=>topic\.locale===lang\)/);
 assert.match(hub,/allPublicForumTopics\(\)/);
 assert.match(hub,/suggestedTopics\.map\(item=>/);
 assert.match(hub,/href=\{path\+item\.slug\+"\/"\}/);
 assert.doesNotMatch(hub,/fakeTopic|sampleTopic|syntheticTopic/i);
 assert.match(hub,/const indexable=publicCount>0/);
});
test("10 locale labels and mobile recovery hit targets remain accessible",()=>{
 assert.equal(LOCALES.length,10);
 for(const locale of LOCALES){
  assert.ok(forumText(locale,"all").trim().length>0,locale);
  assert.ok(FORUM_DASHBOARD_TEXT[locale].latest.trim().length>0,locale);
 }
 assert.match(css,/\.forum-empty-help button\{[\s\S]*?min-height:46px/);
 assert.match(css,/\.forum-empty-suggestions a:focus-visible/);
 assert.match(css,/#main \.community-shell \.forum-empty-help/);
});
