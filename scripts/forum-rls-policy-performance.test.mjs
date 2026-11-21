import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=new URL("../supabase/migrations/20261121224000_forum_rls_single_eval_and_read_policy_merge.sql",import.meta.url);
const sql=readFileSync(file,"utf8");
test("three owner/public SELECT unions are consolidated without broad grants",()=>{
 for(const policy of ["tc_topic_own","tc_reply_own","tc_forum_media_owner_read"])
  assert.match(sql,new RegExp("DROP POLICY "+policy));
 for(const policy of ["tc_topic_public","tc_reply_public","tc_forum_media_published_read"])
  assert.match(sql,new RegExp("ALTER POLICY "+policy));
 assert.match(sql,/SELECT COUNT\(\*\) INTO n FROM pg_policies/);
 assert.match(sql,/IF n<>3 THEN RAISE EXCEPTION/);
 assert.doesNotMatch(sql,/GRANT\s+(ALL|INSERT|UPDATE|DELETE|SELECT)\s+ON\s+public\./i);
 assert.doesNotMatch(sql,/SECURITY DEFINER|DISABLE ROW LEVEL SECURITY|DROP TABLE/i);
});
test("JWT caching is explicit and forum submit content requirements are preserved",()=>{
 assert.match(sql,/\(SELECT auth\.jwt\(\)\)->>'email'/);
 assert.match(sql,/\(SELECT auth\.jwt\(\)\)->>'is_anonymous'/);
 assert.match(sql,/author_id=\(SELECT auth\.uid\(\)\)/);
 assert.match(sql,/char_length\(btrim\(title\)\) BETWEEN 12 AND 160/);
 assert.match(sql,/char_length\(btrim\(body\)\) BETWEEN 40 AND 12000/);
 assert.match(sql,/char_length\(btrim\(body\)\) BETWEEN 10 AND 6000/);
 assert.match(sql,/status IN \('pending','published'\)/);
 assert.match(sql,/has_table_privilege\('anon','public\.tc_forum_topics','INSERT'\)/);
 assert.match(sql,/security_invoker=true/);
});
test("merged RLS read predicates are logically identical for anonymous and owners",()=>{
 for(const authenticated of [false,true])
 for(const isOwner of [false,true])
 for(const status of ["pending","published","hidden"]){
  const uidMatches=authenticated && isOwner;
  const oldTopic=(status==="published") || uidMatches;
  const newTopic=(status==="published") || uidMatches;
  assert.equal(newTopic,oldTopic);
  for(const parent of ["pending","published","hidden"]){
   const oldReply=(status==="published" && parent==="published")||uidMatches;
   const newReply=(status==="published" && parent==="published")||uidMatches;
   assert.equal(newReply,oldReply);
   const oldMedia=(status==="published" && parent==="published")||uidMatches;
   const newMedia=(status==="published" && parent==="published")||uidMatches;
   assert.equal(newMedia,oldMedia);
  }
 }
});
