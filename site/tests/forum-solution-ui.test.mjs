import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {solutionId} from "../src/lib/forum-solution-client.ts";
import {SOLUTION_TEXT} from "../src/lib/forum-solution-i18n.ts";
const id="11111111-1111-4111-8111-111111111111";
test("solution identity requires exactly zero or one valid reply",()=>{
 assert.equal(solutionId([]),"");assert.equal(solutionId([{reply_id:id}]),id);
 for(const bad of [null,{},[{reply_id:"bad"}],[{reply_id:id},{reply_id:id}]])assert.throws(()=>solutionId(bad));
});
test("ten localized controls distinguish selected answers from verified diagnoses",()=>{
 assert.equal(Object.keys(SOLUTION_TEXT).length,10);
 for(const row of Object.values(SOLUTION_TEXT)){assert.deepEqual(Object.keys(row),Object.keys(SOLUTION_TEXT.en));assert.ok(Object.values(row).every(x=>x.trim()));}
});
test("owner controls fail closed and mutation requires confirmed affected row",()=>{
 const read=name=>readFileSync(new URL("../src/"+name,import.meta.url),"utf8");
 const client=read("lib/forum-solution-client.ts"),topic=read("components/ForumTopic.astro"),live=read("lib/forum-live-replies.ts");
 assert.match(client,/user\.is_anonymous!==false/);
 assert.match(client,/author_id:"eq\."\+user.id/);
 assert.match(client,/token!==session\(\)/);
 assert.match(client,/solutionId\(data\)!==\(reply\|\|previous\)/);
 assert.match(client,/reply_id:"eq\."\+previous/);
 assert.match(client,/publicId=value;render\(\)/);
 assert.match(topic,/data-solution-reply-id=\{solutionEligible\?original.id:undefined\}/);
 assert.match(live,/article.dataset.solutionReplyId=row.id/);
 assert.doesNotMatch(client,/service_role|innerHTML/);
});
