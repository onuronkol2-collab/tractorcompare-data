import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {FORUM_DASHBOARD_TEXT} from "../src/lib/forum-dashboard-i18n.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const hub=read("../src/components/ForumHub.astro");
const rail=read("../src/components/ForumDashboardRail.astro");
const panels=read("../src/components/ForumDashboardPanels.astro");

test("dashboard navigation and all meaningful empty states translated for every locale",()=>{
 const keys=Object.keys(FORUM_DASHBOARD_TEXT.en);
 assert.equal(LOCALES.length,10);
 assert.ok(keys.length>=30);
 for(const lang of LOCALES){
  assert.deepEqual(Object.keys(FORUM_DASHBOARD_TEXT[lang]).sort(),keys.slice().sort());
  for(const key of keys)assert.ok(FORUM_DASHBOARD_TEXT[lang][key].trim().length>=2,lang+" "+key);
 }
});
test("all five tabs are functional, use explicit labels and do not fabricate activity",()=>{
 for(const name of ["latest","popular","unanswered","following","events"]){
  assert.match(hub,new RegExp('"'+name+'"'));
  assert.match(hub,/data-forum-view=\{key\}/);
 }
 assert.match(hub,/data-forum-special="following"/);
 assert.match(hub,/data-forum-special="events"/);
 assert.match(hub,/data-forum-dashboard-copy/);
 assert.match(hub,/replyCount\(card\)===0/);
 assert.match(hub,/data-forum-topic-id/);
 assert.match(hub,/tc_member_topic_follows/);
 assert.match(hub,/readForumSession/);
 assert.doesNotMatch(hub+panels,/142,8 B|18,7 B|1\.264|Math\.random\(/);
 assert.doesNotMatch(panels,/fake|demo_data|mocked/);
});
test("immutable published forum source and SEO quality gate remain",()=>{
 for(const code of [
  "allPublicForumTopics()","allPublicForumReplies()",
  "approvedForumHubLocales","isIndexableForumTopic",
  "structuredData={schema}","topic.title","topic.body",
  "href={path+topic.slug+\"/\"}","ForumComposer lang={lang}",
  "ForumMemberPanel lang={lang}",'class="community-topic-grid" id="forum-topic-list"'
 ])assert.ok(hub.includes(code),code);
 assert.match(hub,/r\.machine_translated\|\|r\.locale!==r\.original_locale/);
 assert.match(hub,/data-forum-live-root/);
});
test("dashboard counts and categories derive only from public source data",()=>{
 assert.match(rail,/topics\.filter\(t=>t\.category===cat\.key\)\.length/);
 assert.match(panels,/topics\.filter\(t=>t\.category===key\)\.length/);
 assert.match(panels,/>10<\/strong>/);
 assert.match(hub,/const visibleReplyCount=/);
 assert.match(panels,/topics\.length/);
 assert.match(panels,/replyCount/);
});
test("responsive design supports three columns, known users and reduced motion",()=>{
 assert.match(hub,/community-content-grid\{grid-template-columns:minmax\(175px,215px\)/);
 assert.match(hub,/@media\(max-width:960px\)/);
 assert.match(hub,/@media\(max-width:720px\)/);
 assert.match(hub,/overflow-x:auto/);
 assert.match(hub,/prefers-reduced-motion:reduce/);
 assert.match(hub,/class="community-sidebar"/);
 assert.match(hub,/class="community-panel-categories"/);
 assert.match(hub,/class="community-starter-grid"/);
 assert.match(hub,/class="community-content-grid"/);
 assert.match(hub,/class="container community-hero-inner"/);
 assert.match(hub,/data-forum-category/);
 assert.match(hub,/document\.addEventListener\("tractorvs-forum-live-updated",filter\)/);
});
