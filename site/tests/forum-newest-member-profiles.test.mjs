import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/components/ForumMemberPanel.astro",import.meta.url),"utf8");

test("newest members open one shared profile dialog without a new data channel",()=>{
 assert.match(source,/function openMemberDialog\(p:Profile\)/);
 assert.match(source,/name\.addEventListener\("click",\(\)=>openMemberDialog\(p\)\)/);
 assert.match(source,/data-recent-members/);
 assert.match(source,/dialog\.showModal\(\)/);
 assert.match(source,/data-dialog-close/);
 assert.match(source,/\.member-recent \.member-profile-link/);
});
test("private profiles and personal emails never enter recent member cards or details",()=>{
 assert.match(source,/p\.show_leaderboard!==true\|\|!dialog/);
 assert.match(source,/p\.show_leaderboard===true&&p\.display_name!==starterName/);
 assert.match(source,/show_leaderboard:"eq\.true",order:"created_at\.desc",limit:"12"/);
 assert.match(source,/tc_member_scores/);
 assert.doesNotMatch(source,/select:"[^"]*(?:email|phone|password)[^"]*"/);
 assert.doesNotMatch(source,/fetch\(cfg\.url\+"\/auth\/v1\/admin\/users"/);
});
