import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {discussionLink,replyMatches,appendReplyQuote} from "../src/lib/forum-thread-tools.mjs";
import {THREAD_TOOLS} from "../src/lib/forum-thread-tools-i18n.ts";
import {forumBlocks} from "../src/lib/forum-format.mjs";
const canonical="https://tractorvs.com/tr/forum/test-topic-12345/";
const id="reply-11111111-2222-4333-8444-555555555555";
test("share URLs omit query and private fragments and accept only exact public reply anchors",()=>{
 assert.equal(discussionLink(canonical+"?token=secret#access_token=private"),canonical);
 assert.equal(discussionLink(canonical,id),canonical+"#"+id);
 assert.throws(()=>discussionLink("https://tractorvs.com.evil.test/tr/forum/test-topic/"));
 assert.throws(()=>discussionLink("https://user:pass@tractorvs.com/tr/forum/test-topic/"));
 assert.throws(()=>discussionLink(canonical,"#access_token=private"));
 assert.throws(()=>discussionLink("https://tractorvs.com/tr/forum/"));
});
test("local reply search is normalized and order independent",()=>{
 assert.ok(replyMatches("HİDROLİK pompa basıncı","pompa hidrolik","tr"));
 assert.ok(replyMatches("ＡＢＣ   123","abc 123","en"));
 assert.ok(!replyMatches("pompa basıncı","pompa lastik","tr"));
});
test("bounded quote retains every existing draft character and adds exact source link",()=>{
 const draft="Mevcut taslak 🚜";
 const link=discussionLink(canonical,id);
 const text=appendReplyQuote(draft,"Bir yanıt\n\nİkinci satır",link,6000);
 assert.ok(text.startsWith(draft+"\n\n"));
 assert.ok(text.includes("> Bir yanıt İkinci satır\n> "+link));
 assert.equal(forumBlocks(text).at(-1).type,"quote");
 assert.equal(appendReplyQuote(draft,"reply",link,20),null);
 assert.ok(appendReplyQuote("","🚜".repeat(500),link,6000).includes("…"));
 assert.equal(appendReplyQuote(""," ",link,6000),null);
});
test("all ten languages provide complete interaction copy and public rendering stays safe",()=>{
 const keys=Object.keys(THREAD_TOOLS.en).sort();
 assert.equal(Object.keys(THREAD_TOOLS).length,10);
 for(const labels of Object.values(THREAD_TOOLS)){
  assert.deepEqual(Object.keys(labels).sort(),keys);
  assert.ok(Object.values(labels).every(x=>x.trim()));
 }
 const client=readFileSync(new URL("../src/lib/forum-thread-tools-client.ts",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
 assert.doesNotMatch(client,/innerHTML|service_role|fetch\(|localStorage|sessionStorage/);
 assert.match(client,/form.hidden/);
 assert.match(client,/field.dispatchEvent\(new Event\("input"/);
 assert.match(client,/MutationObserver/);
 assert.match(page,/data-thread-canonical/);
 assert.match(page,/@media print/);
 assert.match(page,/data-static-reply-id/);
});
