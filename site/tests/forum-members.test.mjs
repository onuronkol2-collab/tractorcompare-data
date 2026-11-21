import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MEMBER_TEXT} from "../src/lib/member-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
const sql=readFileSync(new URL("../../supabase/migrations/20261121130000_forum_members_profiles_votes_v1.sql",import.meta.url),"utf8");
const rollback=readFileSync(new URL("../../supabase/rollback/20261121130000_forum_members_profiles_votes_v1_rollback.sql",import.meta.url),"utf8");
const hub=readFileSync(new URL("../src/components/ForumHub.astro",import.meta.url),"utf8");
const auth=readFileSync(new URL("../src/components/ForumComposer.astro",import.meta.url),"utf8");
const panel=readFileSync(new URL("../src/components/ForumMemberPanel.astro",import.meta.url),"utf8");
const topic=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
test("all 10 locales contain natural, nonempty member experience vocabulary",()=>{
 assert.equal(LOCALES.length,10);
 const required=Object.keys(MEMBER_TEXT.en);
 assert.ok(required.length>=45);
 for(const lang of LOCALES){
  const copy=MEMBER_TEXT[lang];
  assert.deepEqual(Object.keys(copy).sort(),required.slice().sort(),lang);
  for(const key of required){
   assert.equal(typeof copy[key],"string",lang+":"+key);
   assert.ok(copy[key].trim().length>=3,lang+":"+key);
  }
  if(lang!=="en")assert.notEqual(copy.memberHeading,MEMBER_TEXT.en.memberHeading,lang);
 }
});
test("password login and signup preserve existing magic-link and OTP forms",()=>{
 for(const marker of ["data-forum-email","data-forum-verify","data-forum-password",
  'data-forum-oauth="google"','data-forum-oauth="github"','/auth/v1/signup',
  '/auth/v1/token?grant_type=password','/auth/v1/authorize',
  'data-forum-logout','verifySession(data.access_token']){
  assert.ok(auth.includes(marker),marker);
 }
 assert.match(auth,/password\.length<12/);
 assert.doesNotMatch(auth,/localStorage\.setItem\([^)]*(?:password|refresh)/);
 assert.doesNotMatch(auth,/console\.log\([^)]*(?:password|access_token|refresh_token)/);
});
test("RLS: profile owns updates; public never sees voter or bookmark identities",()=>{
 for(const name of ["tc_member_profiles","tc_forum_helpful_votes",
  "tc_forum_reply_helpful_totals","tc_member_bookmarks"])
  assert.ok(sql.includes("ALTER TABLE public."+name+" ENABLE ROW LEVEL SECURITY"),name);
 assert.match(sql,/id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/voter_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/member_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/r\.author_id<>\(select auth\.uid\(\)\)/);
 assert.match(sql,/GRANT SELECT,INSERT,DELETE ON public\.tc_forum_helpful_votes TO authenticated/);
 assert.doesNotMatch(sql,/GRANT SELECT ON public\.tc_forum_helpful_votes TO anon/);
 assert.doesNotMatch(sql,/GRANT SELECT ON public\.tc_member_bookmarks TO anon/);
 assert.match(sql,/security_invoker=true/);
});
test("engagement points are earned only for approved visible content and capped votes",()=>{
 assert.match(sql,/FROM public\.tc_forum_topics WHERE status='published'/);
 assert.match(sql,/r\.status='published' AND t\.status='published'/);
 assert.match(sql,/least\(v\.helpful_count,10\)/);
 assert.match(sql,/month_replies/);
 assert.match(sql,/month_topics/);
 assert.match(sql,/24 hours/);
 assert.doesNotMatch(sql,/CREATE POLICY[^;]*FOR UPDATE TO authenticated[^;]*tc_forum_reply_helpful_totals/s);
});
test("avatars are per-member cropped WebP, stripped of original metadata, and small",()=>{
 assert.match(sql,/tc-forum-avatars/);
 assert.match(sql,/350000/);
 assert.match(sql,/image\/webp/);
 assert.match(sql,/storage\.foldername\(name\)/);
 assert.match(sql,/storage\.filename\(name\)/);
 assert.match(panel,/createImageBitmap\(file\)/);
 assert.match(panel,/canvas\.toBlob\(resolve,"image\/webp"/);
 assert.match(panel,/blob\.size>350_000/);
 assert.match(panel,/x-upsert/);
 assert.match(sql,/avatar_path=id::text\|\|'/);
});
test("member UI and rating buttons are connected but do not change SEO publication policy",()=>{
 assert.match(hub,/<ForumMemberPanel lang=\{lang\}\/>/);
 assert.match(panel,/tc_member_profiles/);
 assert.match(panel,/tc_member_scores/);
 assert.match(panel,/tc_member_bookmarks/);
 assert.match(panel,/show_leaderboard/);
 assert.match(topic,/data-helpful-reply/);
 assert.match(topic,/tc_forum_helpful_votes/);
 assert.match(topic,/data-bookmark-toggle/);
 assert.match(topic,/tc_member_bookmarks/);
 assert.match(hub,/const indexable=publicCount>0/);
 assert.match(topic,/const eligible=isIndexableForumTopic\(topic\)/);
});
test("rollback refuses data loss once any member or image exists",()=>{
 assert.match(rollback,/Member data exists/);
 assert.match(rollback,/storage\.objects WHERE bucket_id='tc-forum-avatars'/);
 assert.doesNotMatch(sql,/\bUPDATE public\.tc_forum_topics\b/i);
 assert.doesNotMatch(sql,/\bUPDATE public\.tc_forum_replies\b/i);
});
