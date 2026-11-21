import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MEMBER_TEXT} from "../src/lib/member-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
const sql=readFileSync(new URL("../../supabase/migrations/20261121145000_tc_forum_follows_vote_quotas.sql",import.meta.url),"utf8");
const rollback=readFileSync(new URL("../../supabase/rollback/20261121145000_tc_forum_follows_vote_quotas_rollback.sql",import.meta.url),"utf8");
const topic=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
const panel=readFileSync(new URL("../src/components/ForumMemberPanel.astro",import.meta.url),"utf8");
test("ten localized topic following and new reply messages are present",()=>{
 assert.equal(LOCALES.length,10);
 for(const lang of LOCALES){
  for(const key of ["followTopic","unfollowTopic","followingTopics","noFollowingTopics","newReplies"]){
   assert.equal(typeof MEMBER_TEXT[lang][key],"string",lang+":"+key);
   assert.ok(MEMBER_TEXT[lang][key].length>=2);
  }
 }
});
test("follow RLS only allows signed-in owner and published topics",()=>{
 assert.match(sql,/tc_member_topic_follows\(/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/REVOKE ALL ON public\.tc_member_topic_follows FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/FOR SELECT TO authenticated USING\(member_id=\(select auth\.uid\(\)\)\)/);
 assert.match(sql,/FOR UPDATE TO authenticated USING\(member_id=\(select auth\.uid\(\)\)\)/);
 assert.match(sql,/FOR DELETE TO authenticated USING\(member_id=\(select auth\.uid\(\)\)\)/);
 assert.ok((sql.match(/t\.status='published'/g)||[]).length>=2);
 assert.doesNotMatch(sql,/GRANT SELECT[^;]*tc_member_topic_follows TO anon/);
});
test("vote quota counts submissions, not current votes that can be deleted",()=>{
 assert.match(sql,/tc_forum_vote_daily_quotas/);
 assert.match(sql,/SECURITY DEFINER SET search_path TO ''/);
 assert.match(sql,/NEW\.voter_id IS DISTINCT FROM auth\.uid\(\)/);
 assert.match(sql,/ON CONFLICT\(voter_id,vote_day\) DO UPDATE/);
 assert.match(sql,/votes_cast<20/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.tc_helpful_vote_rate_limit\(\) FROM PUBLIC,anon,authenticated/);
 assert.doesNotMatch(sql,/GRANT[^;]*tc_forum_vote_daily_quotas TO authenticated/);
});
test("follow UI stays private and counts only approved replies from other members",()=>{
 assert.match(topic,/data-follow-toggle/);
 assert.match(topic,/tc_member_topic_follows/);
 assert.match(topic,/last_seen_at:new Date\(\)\.toISOString\(\)/);
 assert.match(panel,/data-member-follows/);
 assert.match(panel,/tc_member_topic_follows/);
 assert.match(panel,/tc_forum_replies/);
 assert.match(panel,/status:"eq\.published"/);
 assert.match(panel,/reply\.author_id!==ownId/);
 assert.match(panel,/newReplies/);
 assert.doesNotMatch(topic,/update[^;]*tc_forum_topics\.status/i);
});
test("rollback protects followed discussions and abuse-history counters",()=>{
 assert.match(rollback,/Follow or vote quota data exists/);
 assert.doesNotMatch(sql,/(UPDATE|DELETE FROM|TRUNCATE)\s+public\.(tc_forum_topics|tc_forum_replies|tractors|tractor_specs)\b/i);
});
