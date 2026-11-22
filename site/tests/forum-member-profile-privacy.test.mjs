import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const sql=read("../../supabase/migrations/20261122183000_forum_profiles_public_opt_in_rls.sql");
const original=read("../../supabase/migrations/20261121130000_forum_members_profiles_votes_v1.sql");
const panel=read("../src/components/ForumMemberPanel.astro");

test("new member profiles are not publicly listed without an explicit opt-in",()=>{
 assert.match(sql,/ALTER TABLE public\.tc_member_profiles\s+ALTER COLUMN show_leaderboard SET DEFAULT false/i);
 assert.match(panel,/name="show_leaderboard"\s*\/>/);
 assert.doesNotMatch(panel,/name="show_leaderboard"\s+checked\s*\/>/);
 assert.match(panel,/avatar_path:null,show_leaderboard:false/);
 assert.doesNotMatch(panel,/show_leaderboard:true/);
});

test("RLS allows only opted-in public profiles and the authenticated owner's profile",()=>{
 assert.match(sql,/DROP POLICY IF EXISTS tc_member_profile_read ON public\.tc_member_profiles/i);
 assert.match(sql,/CREATE POLICY tc_member_profile_read ON public\.tc_member_profiles\s+FOR SELECT TO anon,authenticated/i);
 assert.match(sql,/USING \(\(show_leaderboard IS TRUE\) OR \(id = \(select auth\.uid\(\)\)\)\)/i);
 assert.doesNotMatch(sql,/USING\s*\(\s*true\s*\)/i);
 assert.match(original,/WITH \(security_invoker=true\)/i);
 assert.match(original,/WHERE p\.show_leaderboard=true OR p\.id=\(select auth\.uid\(\)\)/i);
});

test("migration never erases profiles or resets existing members' publication choices",()=>{
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE FROM|TRUNCATE)\s+public\.tc_member_profiles\b/i);
 assert.doesNotMatch(sql,/\bDROP TABLE\b/i);
 assert.match(sql,/BEGIN;[\s\S]*COMMIT;/);
});
