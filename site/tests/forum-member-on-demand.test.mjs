import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const panel=readFileSync(new URL("../src/components/ForumMemberPanel.astro",import.meta.url),"utf8");

test("forum opens without requesting optional, collapsed leaderboard data",()=>{
 assert.match(panel,/if\(showRanks&&!leadersReady\)void loadLeaders\(\)/);
 assert.doesNotMatch(panel,/void loadLeaders\(\);void loadRecentMembers\(\);void loadSelf\(\)/);
 assert.match(panel,/void loadRecentMembers\(\);void loadSelf\(\)/);
 assert.match(panel,/if\(leadersLoading\)return/);
 assert.match(panel,/leadersReady=true/);
 assert.match(panel,/leadersReady=false;renderLeaders\(\)/);
});

test("private bookmarks and followed topics are not fetched before member activity opens",()=>{
 assert.match(panel,/if\(showActivity\)await Promise\.all\(\[loadBookmarks\(\),loadFollowed\(\)\]\)/);
 assert.match(panel,/if\(showActivity\)\{editing=false;void Promise\.all\(\[loadBookmarks\(\),loadFollowed\(\)\]\);\}/);
 assert.match(panel,/if\(showRanks\)await loadLeaders\(\)/);
 assert.match(panel,/if\(showRanks\)void loadLeaders\(\)/);
 assert.match(panel,/show_leaderboard:"eq\.true"/);
 assert.match(panel,/show_leaderboard:false/);
});
