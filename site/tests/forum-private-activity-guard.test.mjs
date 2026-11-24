import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const panel=readFileSync(new URL("../src/components/ForumMemberPanel.astro",import.meta.url),"utf8");
test("private activity requests are invalidated immediately on session changes",()=>{
 const self=panel.slice(panel.indexOf(" async function loadSelf()"),panel.indexOf(' profileForm?.addEventListener("submit"'));
 assert.match(self,/ownId="";\s*clearPrivateActivity\(\);setPanels\(\);/);
 assert.match(panel,/\+\+bookmarkVersion;\+\+followVersion/);
 assert.match(panel,/bookmarkList\?\.replaceChildren\(\);followingList\?\.replaceChildren\(\)/);
 for(const kind of ["Bookmarks","Followed"]){
  const start=panel.indexOf(" async function load"+kind+"()");
  const end=panel.indexOf("\n }",start);
  const loader=panel.slice(start,end);
  assert.match(loader,/owner===ownId/);
  assert.ok((loader.match(/if\(!current\(\)\)return;/g)||[]).length>=2);
 }
});
test("unread counts ignore own replies, disclose cap and retain followed topics when counters fail",()=>{
 assert.match(panel,/reply\.author_id!==owner/);
 assert.match(panel,/replies\.length===500\?"≥":""/);
 assert.match(panel,/counts\.get\(b\.id\)/);
 assert.match(panel,/repliesAvailable\?txt\.noFollowingTopics:txt\.memberLoadError/);
});
