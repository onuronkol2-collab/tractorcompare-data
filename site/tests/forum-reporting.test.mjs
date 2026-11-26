import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {pendingReports} from "../src/lib/forum-reporting-client.ts";
import {REPORT_TEXT,REPORT_REASONS} from "../src/lib/forum-reporting-i18n.ts";
const id="11111111-1111-4111-8111-111111111111";
const row={id,topic_id:id,reply_id:null,reason:"spam",status:"pending",created_at:"2026-11-26T00:00:00Z"};
test("moderation queue validates records and excludes reporter identity",()=>{
 assert.deepEqual(pendingReports([{...row,reporter_id:id}]),[row]);
 for(const data of [null,[{...row,id:"bad"}],[{...row,reason:"unknown"}],[{...row,status:"reviewed"}],[row,row],Array(51).fill(row)])assert.throws(()=>pendingReports(data));
});
test("all ten report locales preserve the fixed reason codes",()=>{
 assert.equal(Object.keys(REPORT_TEXT).length,10);
 assert.deepEqual(REPORT_REASONS,["spam","abuse","unsafe","off_topic","other"]);
 for(const copy of Object.values(REPORT_TEXT)){
  assert.deepEqual(Object.keys(copy),Object.keys(REPORT_TEXT.en));
  assert.equal(copy.reasons.length,5);assert.ok(copy.reasons.every(s=>s.trim()));
 }
});
test("report UI requires server capability and verified membership; no unsafe HTML",()=>{
 const read=p=>readFileSync(new URL("../src/"+p,import.meta.url),"utf8");
 const s=read("lib/forum-reporting-client.ts"),c=read("components/ForumReporting.astro");
 assert.match(s,/user.is_anonymous!==false/);
 assert.match(s,/settings\[0\]\?\.enabled===true/);
 assert.match(s,/members\[0\]\?\.member_id!==user.id/);
 assert.match(s,/members\[0\]\?\.active!==true/);
 assert.match(s,/status:"eq.pending",select:"id,status"/);
 assert.match(s,/data\[0\]\?\.status!==decision/);
 assert.doesNotMatch(s,/innerHTML|service_role|reporter_id/);
 assert.match(c,/data-forum-reporting data-reporting-config=\{payload\} hidden/);
});
