import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MEMBER_TEXT} from "../src/lib/member-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";

const read=(url)=>readFileSync(new URL(url,import.meta.url),"utf8");
const sql=read("../../supabase/migrations/20261122180000_tc_forum_topic_likes_unique_member_reads.sql");
const verify=read("../../supabase/verification/verify_forum_topic_engagement_20261122.sql");
const rollback=read("../../supabase/rollback/20261122180000_tc_forum_topic_likes_unique_member_reads_rollback.sql");
const topic=read("../src/components/ForumTopic.astro");
const composer=read("../src/components/ForumComposer.astro");
const panel=read("../src/components/ForumMemberPanel.astro");
const session=read("../src/lib/forum-session-store.mjs");

test("ten localized, semantically honest opt-in and topic engagement strings",()=>{
 for(const lang of LOCALES){
  const t=MEMBER_TEXT[lang];
  for(const key of ["rememberMe","rememberWarning","showPublicProfile","topicLike",
    "topicUnlike","topicLikes","memberReads","recentMembers","recentMembersIntro",
    "noRecentMembers","readsDetail"]){
   assert.ok(typeof t[key]==="string"&&t[key].trim().length>=3,lang+" "+key);
  }
 }
 assert.match(MEMBER_TEXT.tr.memberReads,/Üye okuması/);
 assert.match(MEMBER_TEXT.en.readsDetail,/guest visits are not tracked/);
});

test("persistent session is optional, bounded, verified and cleared by signout",()=>{
 assert.match(composer,/data-forum-remember checked/);
 assert.match(composer,/rememberForumSession\(jwt,nextRefresh/);
 assert.match(composer,/const saved=readForumSession\(\)/);
 assert.match(composer,/verifySession\(saved\?\.access\|\|""/);
 assert.match(composer,/clearForumSession\(\)/);
 assert.match(composer,/event\.key!==FORUM_SESSION_KEY/);
 assert.match(session,/SESSION_MAX_AGE_MS=7\*24\*60\*60\*1000/);
 assert.doesNotMatch(session,/password|user_metadata|auth\.users/);
 assert.doesNotMatch(composer,/console\.log\([^)]*(?:password|access_token|refresh_token)/);
 assert.match(panel,/readForumSession\(\)\?\.access/);
 assert.match(topic,/readForumSession\(\)\?\.access/);
});

test("newest members use existing published opt-in RLS view only",()=>{
 assert.match(panel,/data-recent-members/);
 assert.match(panel,/tc_member_scores/);
 assert.match(panel,/show_leaderboard:"eq.true",order:"created_at.desc"/);
 assert.match(panel,/p\.show_leaderboard===true/);
 assert.match(panel,/rows\.filter/);
 assert.doesNotMatch(panel,/\/rest\/v1\/auth\.users|raw_user_meta_data/);
 assert.doesNotMatch(panel,/localStorage\.setItem/);
});

test("likes cannot be forged, topics must be published, counts expose no member identities",()=>{
 for(const table of ["tc_forum_topic_likes","tc_forum_topic_member_reads",
  "tc_forum_topic_like_quotas","tc_forum_topic_engagement_totals"]){
  assert.ok(sql.includes("ALTER TABLE public."+table+" ENABLE ROW LEVEL SECURITY"),table);
 }
 assert.match(sql,/member_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/t\.status='published' AND t\.author_id<>\(select auth\.uid\(\)\)/);
 assert.match(sql,/PRIMARY KEY\(topic_id,member_id\)/);
 assert.match(sql,/votes_cast<20/);
 assert.match(sql,/REVOKE ALL ON public\.tc_forum_topic_engagement_totals FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/GRANT SELECT ON public\.tc_forum_topic_engagement_totals TO anon,authenticated/);
 assert.match(sql,/SECURITY DEFINER SET search_path TO ''/);
 assert.match(sql,/GRANT SELECT,INSERT ON public\.tc_forum_topic_member_reads TO authenticated/);
 assert.doesNotMatch(sql,/GRANT .* ON public\.tc_forum_topic_member_reads TO anon/);
 assert.doesNotMatch(sql,/\bUPDATE public\.tc_forum_topics\b/);
 assert.match(verify,/Topic engagement RLS missing/);
 assert.match(rollback,/refusing destructive rollback/);
});
test("forum topic renders sourced published article without fake SEO interaction stats",()=>{
 assert.match(topic,/data-thread-like-count/);
 assert.match(topic,/data-thread-read-count/);
 assert.match(topic,/data-like-toggle aria-pressed="false"/);
 assert.match(topic,/tc_forum_topic_engagement_totals/);
 assert.match(topic,/tc_forum_topic_likes/);
 assert.match(topic,/tc_forum_topic_member_reads/);
 assert.match(topic,/resolution=ignore-duplicates/);
 assert.match(topic,/total\?\.member_reads/);
 assert.match(topic,/const schema=eligible\?/);
 assert.doesNotMatch(topic,/"interactionStatistic"|"userInteractionCount"/);
 assert.doesNotMatch(topic,/Math\.random\(\).*likes|Math\.random\(\).*views/);
});
