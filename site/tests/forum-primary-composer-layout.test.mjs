import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";

const hub=readFileSync(new URL("../src/components/ForumHub.astro",import.meta.url),"utf8");
const composer=readFileSync(new URL("../src/components/ForumComposer.astro",import.meta.url),"utf8");

test("single topic composer belongs to main content, not the narrow dashboard rail",()=>{
 assert.match(hub,/<div class="community-primary-column">[\s\S]*<section class="community-list"/);
 assert.match(hub,/<div class="forum-primary-composer" data-forum-compose-region>[\s\S]*?<ForumComposer lang=\{lang\} mode="topic"\/>/);
 assert.equal((hub.match(/<ForumComposer lang=\{lang\} mode="topic"\/>/g)||[]).length,1);
 assert.match(hub,/<aside class="community-sidebar" aria-label=\{dashboard.stats\}>\s*<ForumDashboardPanels/);
 assert.doesNotMatch(hub,/<aside class="community-sidebar"[^>]*>[\s\S]*?<ForumComposer/);
 assert.match(hub,/\.community-primary-column\{display:flex;flex-direction:column/);
 assert.match(hub,/\.forum-primary-composer :global\(\.community-composer\)\{margin:0;min-width:0;width:100%\}/);
});
test("forum CTA, topic visibility, auth and SEO markers remain wired",()=>{
 assert.match(hub,/href="#forum-compose"/);
 assert.match(hub,/data-forum-topic/);
 assert.match(hub,/allPublicForumTopics\(\)/);
 assert.match(hub,/indexable=\{indexable\}/);
 assert.match(hub,/structuredData=\{schema\}/);
 assert.match(hub,/indexableLocales=\{indexableLocales\}/);
 assert.match(hub,/<ForumMemberPanel lang=\{lang\}\/>/);
 assert.match(composer,/id="forum-compose"/);
 assert.match(composer,/data-forum-auth-gate/);
 assert.match(composer,/data-forum-post hidden/);
 assert.match(composer,/translation_consent/);
 assert.match(composer,/data-forum-logout/);
});
test("wide editor groups form fields without changing 10 language options",()=>{
 assert.equal(LOCALES.length,10);
 assert.match(composer,/class="forum-post-details-grid"/);
 assert.match(composer,/grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,255px\),1fr\)\)/);
 for(const marker of ['name="title"','name="category"','name="tractor_id"','name="source_locale"','name="body"'])assert.ok(composer.includes(marker),marker);
 assert.match(composer,/LOCALES\.map\(locale=>/);
});
