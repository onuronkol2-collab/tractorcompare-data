import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newPublicReplies} from "../src/lib/forum-live-replies.ts";
const topic="11111111-1111-4111-8111-111111111111";
const id=n=>String(n).repeat(8)+"-1111-4111-8111-111111111111";
const row=(n,extra={})=>({id:id(n),topic_id:topic,locale:"tr",original_locale:"tr",status:"published",created_at:"2026-11-24T10:00:00Z",body:"A real, sufficiently long reply.",machine_translated:false,...extra});
test("public live replies exclude static duplicates, private rows, translations and other threads",()=>{
 const rows=[row(1),row(2),row(2),row(3,{status:"draft"}),row(4,{locale:"en",machine_translated:true}),row(5,{topic_id:id(9)}),row(6,{created_at:"bad"}),row(7,{body:"short"}),row(8,{locale:"ja",original_locale:"ja",created_at:"2026-11-24T09:00:00Z"})];
 assert.deepEqual(newPublicReplies(rows,topic,new Set([id(1)])).map(x=>x.id),[id(8),id(2)]);
 assert.throws(()=>newPublicReplies({},topic,new Set()));
});
test("live reply client uses only bounded anonymous public read and safe rendering",()=>{
 const client=readFileSync(new URL("../src/lib/forum-live-replies.ts",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
 const composer=readFileSync(new URL("../src/components/ForumComposer.astro",import.meta.url),"utf8");
 assert.match(client,/tc_forum_localized_replies/);
 assert.match(client,/topic_id:"eq\."\+cfg.topicId,status:"eq.published",machine_translated:"eq.false"/);
 assert.match(client,/limit:"60"/);
 assert.match(client,/ugc nofollow noopener noreferrer/);
 assert.doesNotMatch(client,/innerHTML|readForumSession|service_role|sb_secret_|method:"POST"/);
 assert.match(page,/data-static-reply-id/);
 assert.match(page,/initForumLiveReplies\(liveReplies\)/);
 assert.match(composer,/tractorvs-forum-reply-saved/);
});
