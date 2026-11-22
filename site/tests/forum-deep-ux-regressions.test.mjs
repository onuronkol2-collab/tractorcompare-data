import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MEMBER_TEXT} from "../src/lib/member-i18n.ts";
import {FORUM_TEXT} from "../src/lib/forum-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const hub=read("../src/components/ForumHub.astro");
const live=read("../src/lib/forum-live-client.ts");
const members=read("../src/components/ForumMemberPanel.astro");

test("all ten locales describe transient error, retry and filter reset without placeholders",()=>{
 assert.equal(LOCALES.length,10);
 for(const locale of LOCALES){
  for(const key of ["memberLoadError","retryMembers"])
   assert.ok(MEMBER_TEXT[locale][key]?.length>=2,locale+" "+key);
  for(const key of ["clearFilters","matchingResults"])
   assert.ok(FORUM_TEXT[locale][key]?.length>=2,locale+" "+key);
 }
});
test("search normalizer is shared by static and live client, not browser default locale",()=>{
 assert.match(hub,/forumSearchText\(/);
 assert.match(live,/forumSearchText\(/);
 assert.doesNotMatch(hub,/\.toLocaleLowerCase\(\)/);
 assert.doesNotMatch(live,/\.toLocaleLowerCase\(\)/);
 assert.match(hub,/data-forum-match-count/);
 assert.match(hub,/data-forum-clear/);
 assert.match(hub,/aria-pressed/);
});
test("failed member queries must never masquerade as no public members",()=>{
 assert.match(members,/data-retry-recent/);
 assert.match(members,/data-retry-leaders/);
 assert.match(members,/retryRecent\?\.addEventListener/);
 assert.match(members,/retryLeaders\?\.addEventListener/);
 assert.match(members,/recentStatus\.textContent=txt\.memberLoadError/);
 assert.match(members,/empty\.textContent=txt\.memberLoadError/);
 assert.match(members,/bookmarkEmpty\.textContent=txt\.memberLoadError/);
 assert.match(members,/followingEmpty\.textContent=txt\.memberLoadError/);
});
