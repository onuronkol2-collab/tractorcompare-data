import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {forumSearchRank,forumHasNewReply,forumPrivateIds} from "../src/lib/forum-community.mjs";
import {FORUM_COMMUNITY_TEXT} from "../src/lib/forum-community-i18n.ts";
test("title relevance outweighs body-only matches; no fabricated relevance",()=>{
 assert.ok(forumSearchRank("john deere", "john deere hydraulic",["john","deere"])>forumSearchRank("hydraulic", "john deere hydraulic",["john","deere"]));
 assert.equal(forumSearchRank("tractor","tractor",[]),0);
});
test("new reply uses a real timestamp later than the member read timestamp",()=>{
 assert.equal(forumHasNewReply("2026-11-20","2026-11-21"),true);
 assert.equal(forumHasNewReply("2026-11-20","2026-11-20"),false);
 assert.equal(forumHasNewReply("2026-11-20",""),false);
 assert.equal(forumHasNewReply("invalid","2026-11-21"),false);
});
test("private member records are validated, not exposed or guessed",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 assert.deepEqual([...forumPrivateIds([{topic_id:id,last_seen_at:"2026-11-20"},{topic_id:"bad"},null])],[[id,"2026-11-20"]]);
 assert.throws(()=>forumPrivateIds({}));
});
test("ten complete locales and public/private boundaries remain explicit",()=>{
 assert.equal(Object.keys(FORUM_COMMUNITY_TEXT).length,10);
 for(const row of Object.values(FORUM_COMMUNITY_TEXT)){
  assert.deepEqual(Object.keys(row),Object.keys(FORUM_COMMUNITY_TEXT.en));assert.ok(Object.values(row).every(v=>v.trim()));
 }
 const hub=readFileSync(new URL("../src/components/ForumHub.astro",import.meta.url),"utf8");
 assert.match(hub,/data-forum-brand-filter/);
 assert.match(hub,/data-forum-latest-reply-at=\{activityByTopic.get\(topic.topic_id\)/);
 assert.match(hub,/saved\?"tc_member_bookmarks":"tc_member_topic_follows"/);
 assert.match(hub,/readForumSession\(\)\?\.access!==session.access/);
 assert.match(hub,/indexable=\{indexable\}/);
 assert.doesNotMatch(hub,/service_role/);
});
