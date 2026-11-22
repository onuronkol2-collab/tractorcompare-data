import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const txt=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const hub=txt("../src/components/ForumHub.astro");
const topic=txt("../src/components/ForumTopic.astro");
const composer=txt("../src/components/ForumComposer.astro");
const member=txt("../src/components/ForumMemberPanel.astro");
const editor=txt("../src/components/ForumEditor.astro");

test("professional responsive forum keeps published indexable topics and native links",()=>{
 assert.match(hub,/class="container community-hero-inner"/);
 assert.match(hub,/class="community-content-grid"/);
 assert.match(hub,/class="community-sidebar"/);
 assert.match(hub,/class="community-topic-grid" id="forum-topic-list"/);
 assert.match(hub,/topics\.map\(topic=>/);
 assert.match(hub,/href=\{path\+topic\.slug\+"\/"\}/);
 assert.match(hub,/class="community-panel-categories"/);
 assert.match(hub,/class="community-starter-grid"/);
 assert.match(hub,/community-content-grid\{display:grid/);
 assert.match(hub,/@media\(max-width:960px\)/);
 assert.match(hub,/overflow-x:auto/);
 assert.match(hub,/prefers-reduced-motion:reduce/);
 assert.ok(hub.indexOf('<ForumComposer lang={lang} mode="topic"/>') <
  hub.indexOf('<ForumMemberPanel lang={lang}/>'));
});
test("redesign does not change sign-in, translation, posting, moderation or members",()=>{
 for(const x of ['data-forum-auth-gate','data-forum-register','data-forum-password',
  'data-forum-email','data-forum-remember','data-forum-logout','data-forum-post',
  'translation_consent','ForumEditor lang={lang}','data-editor-count']) {
  assert.ok((composer+editor).includes(x),x);
 }
 assert.match(member,/show_leaderboard:"eq.true",order:"created_at.desc"/);
 assert.match(member,/data-recent-members/);
 assert.match(member,/data-member-leaders-toggle/);
 assert.match(member,/data-member-form hidden/);
 assert.match(topic,/isIndexableForumTopic\(topic\)/);
 assert.match(topic,/structuredData=\{schema\}/);
 assert.match(topic,/data-like-toggle/);
 assert.match(topic,/data-follow-toggle/);
 assert.match(topic,/data-bookmark-toggle/);
 assert.match(topic,/data-thread-read-count/);
 assert.match(topic,/data-helpful-toggle/);
 assert.match(composer,/data-forum-remember checked/);
});
test("topic page respects mobile reading width and accessible engagement",()=>{
 assert.match(topic,/forum-thread>\.container\{width:min\(920px/);
 assert.match(topic,/forum-first-post h1/);
 assert.match(topic,/min-height:44px/);
 assert.match(topic,/forum-thread-actions button\[aria-pressed="true"\]/);
 assert.match(member,/member-community button:focus-visible/);
 assert.match(editor,/forum-editor-toolbar button:focus-visible/);
 assert.doesNotMatch(hub+topic,/Math\.random\(|interactionStatistic|aggregateRating/);
});
