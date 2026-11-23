import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const composer=read("../src/components/ForumComposer.astro");
const topic=read("../src/components/ForumTopic.astro");
const hub=read("../src/components/ForumHub.astro");
const members=read("../src/components/ForumMemberPanel.astro");

test("mobile form inputs and authoring fields are at least 16px on narrow screens",()=>{
 assert.match(composer, /@media\(max-width:640px\)\{[\s\S]*?\.community-composer input:not\(\[type="checkbox"\]\),\s*\.community-composer select,\.community-composer textarea\{font-size:16px\}/);
 assert.match(composer, /@media\(max-width:640px\)\{[\s\S]*?\.community-composer label\{font-size:14px\}/);
 assert.match(composer, /data-forum-remember/);
 assert.match(composer, /rememberForumSession\(/);
});
test("mobile thread interaction controls meet touch-size and readable-text requirements",()=>{
 assert.match(topic, /@media\(max-width:640px\)\{[\s\S]*?\.forum-thread-actions button,\.forum-helpful button\{min-height:46px;font-size:14px\}/);
 for(const action of ["data-like-toggle","data-bookmark-toggle","data-follow-toggle","data-helpful-toggle"])
  assert.ok(topic.includes(action),action);
 assert.match(topic,/aria-pressed="false"/);
});

test("mobile search and optional profile editing stay legible without harming public opt-in",()=>{
 assert.match(hub, /@media\(max-width:640px\)\{[\s\S]*?\.community-filters input\{font-size:16px\}/);
 assert.match(members, /@media\(max-width:640px\)\{[\s\S]*?\.member-own input:not\(\[type="checkbox"\]\),\.member-own textarea\{font-size:16px\}/);
 assert.match(members, /name="show_leaderboard"\/>/);
 assert.doesNotMatch(members, /name="show_leaderboard" checked/);
});
