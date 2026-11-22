import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {FORUM_THREAD_NAV_TEXT} from "../src/lib/forum-thread-nav-i18n.ts";
import {forumBlocks} from "../src/lib/forum-format.mjs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const topic=read("../src/components/ForumTopic.astro");
const rich=read("../src/components/ForumRichText.astro");
const hub=read("../src/components/ForumHub.astro");
const css=read("../src/styles/forum-readable.css");

test("real return to localized forum home exists above and after long discussion",()=>{
 assert.match(topic,/const forumUrl=localizedPath\(lang,"\/forum\/"\)/);
 assert.match(topic,/<nav class="thread-breadcrumb" aria-label=\{threadNav\.navigation\}>/);
 assert.match(topic,/<a href=\{forumUrl\} class="forum-home-button">/);
 assert.match(topic,/class="thread-breadcrumb-current"/);
 assert.match(topic,/<nav class="forum-back" aria-label=\{threadNav\.navigation\}>/);
 assert.equal((topic.match(/class="forum-home-button"/g)||[]).length,2);
 assert.match(topic,/class="forum-home-icon" aria-hidden="true">←/);
 assert.doesNotMatch(topic,/\{ft\(lang,"back"\)\} ↗/);
});
test("real article headings yield anchored table of contents; no arbitrary slugs or new pages",()=>{
 assert.match(topic,/forumBlocks\(topic\.body\)\.flatMap/);
 assert.match(topic,/block\.type==="heading"&&block\.level===2/);
 assert.match(topic,/const showContents=headingLinks\.length>=3/);
 assert.match(topic,/class="forum-topic-toc"/);
 assert.match(topic,/href=\{"#"+item\.id\}/);
 assert.match(topic,/class="forum-jump-replies" href="#forum-replies-heading"/);
 assert.match(topic,/headingPrefix="topic-heading"/);
 assert.match(rich,/id=\{headingPrefix\?headingPrefix\+"-"\+index:undefined\}/);
 const examples=forumBlocks("Start.\n\n## First section\nIntro.\n\n## Second section\nData.\n\n## Third section\nMore.");
 const heads=examples.flatMap((x,i)=>x.type==="heading"&&x.level===2?[{id:"topic-heading-"+i,label:x.items[0].map(p=>p.text).join("")}]:[]);
 assert.deepEqual(heads.map(x=>x.label),["First section","Second section","Third section"]);
 assert.equal(new Set(heads.map(x=>x.id)).size,3);
 assert.doesNotMatch(topic,/Math\.random\(|interactionStatistic|aggregateRating/);
});
test("forum navigation is localized in all ten published or protected forum languages",()=>{
 assert.equal(LOCALES.length,10);
 assert.deepEqual(Object.keys(FORUM_THREAD_NAV_TEXT).sort(),[...LOCALES].sort());
 const keys=["home","navigation","onThisPage","replies"];
 for(const locale of LOCALES){
  const x=FORUM_THREAD_NAV_TEXT[locale];
  assert.deepEqual(Object.keys(x).sort(),keys.slice().sort());
  for(const key of keys)assert.ok(x[key]?.trim().length>=3,locale+" "+key);
 }
 assert.match(rich,/const tableHints:Record<Locale,string>/);
 assert.match(rich,/forum-table-hint/);
});
test("safe readable type scale limited to forum and preserves controls",()=>{
 assert.match(hub,/import "\.\.\/styles\/forum-readable\.css"/);
 assert.match(topic,/import "\.\.\/styles\/forum-readable\.css"/);
 assert.match(css,/#main \.community-shell \.community-topic h3/);
 assert.match(css,/#main \.community-shell \.member-recent \.member-entry small/);
 assert.match(css,/#main \.community-shell \.community-composer label/);
 assert.match(css,/#main \.forum-thread \.forum-rich-text p/);
 assert.match(css,/#main \.forum-thread \.forum-table-wrap table/);
 assert.match(css,/font-size:16px;min-height:46px/);
 assert.match(css,/min-height:46px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/\.community-composer button\{font-size/);
 assert.doesNotMatch(css,/\b!important\s*;?\s*\}/); // no blanket override
});
test("existing SEO, moderation, reply and engagement contract remains untouched",()=>{
 for(const text of ["isIndexableForumTopic(topic)","structuredData={schema}",
   'href={localizedPath(originalTopic.locale,"/forum/"+originalTopic.slug+"/")}',
   "forumThreadReplies(","allPublicForumMedia()","data-thread-engagement",
   "data-like-toggle","data-bookmark-toggle","data-follow-toggle",
   'ForumComposer lang={lang} mode="reply"','id="forum-replies-heading"'])
  assert.ok(topic.includes(text),text);
 assert.match(rich,/rel="ugc nofollow noopener noreferrer"|ForumInline parts=\{parts\}/);
});
