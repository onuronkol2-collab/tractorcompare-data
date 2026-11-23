import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isIndexableForumTopic} from "../src/lib/forum.ts";

const read=(relative)=>readFileSync(new URL(relative,import.meta.url),"utf8");
const forum=read("../src/lib/forum.ts");
const topic=read("../src/components/ForumTopic.astro");
const members=read("../src/components/ForumMemberPanel.astro");

test("forum public topic projection never invents or exposes author identities for SEO",()=>{
  const select=forum.match(/loadRows<ForumTopic>\("tc_forum_localized_topics",\s*"([^"]+)"\)/);
  assert.ok(select,"public topic projection missing; review SEO schema data privacy gate");
  for(const forbidden of ["author_id","author_name","email","password","profile","token"]){
    assert.ok(!select[1].split(",").includes(forbidden),"private identity field in public projection: "+forbidden);
  }
  assert.match(topic,/No real author identity is present in the public projection/);
});

test("current forum schema stays honest WebPage until real published author proof exists",()=>{
  assert.match(topic,/const eligible=isIndexableForumTopic\(topic\)/);
  assert.match(topic,/const schema=eligible\?\{/);
  assert.match(topic,/"@type":"WebPage"/);
  assert.match(topic,/indexable=\{eligible\} structuredData=\{schema\}/);
  assert.doesNotMatch(topic,/"@type"\s*:\s*"(DiscussionForumPosting|SocialMediaPosting|ProfilePage)"/);
  assert.doesNotMatch(topic,/"author"\s*:|"userInteractionCount"\s*:|"interactionStatistic"\s*:/);
});

test("private member forms are not presented as public profile rich results",()=>{
  assert.match(members,/show_leaderboard/);
  assert.doesNotMatch(members,/"@type"\s*:\s*"ProfilePage"/);
  assert.doesNotMatch(members,/\/rest\/v1\/auth\.users/);
});

test("published, reviewed forum content only: draft and unreviewed translations remain unindexable",()=>{
  const baseline={status:"published",seo_ready:true,machine_translated:false,
    title:"Reviewed tractor reliability evidence",body:"Source-backed, moderated facts. ".repeat(8),
    category:"general"};
  assert.equal(isIndexableForumTopic(baseline),true);
  assert.equal(isIndexableForumTopic({...baseline,status:"draft"}),false);
  assert.equal(isIndexableForumTopic({...baseline,seo_ready:false}),false);
  assert.equal(isIndexableForumTopic({...baseline,machine_translated:true,seo_ready:false}),false);
});
