import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
test("thread engagement binds asynchronous private reads to the verified session and member",()=>{
 assert.match(page,/const version=\+\+sessionVersion/);
 assert.match(page,/version===sessionVersion&&token===getToken\(\)/);
 assert.match(page,/member_id:"eq\."\+owner/);
 assert.match(page,/voter_id:"eq\."\+owner/);
 assert.match(page,/if\(!currentSession\(version,token\)\)return;/);
 assert.match(page,/if\(currentSession\(version,token\)\)\{ownId=owner;verifiedToken=token\}/);
 assert.match(page,/ownId="";voted.clear\(\);isBookmarked=false;isFollowing=false;isLiked=false/);
});
test("each authenticated interaction retains its own immutable owner and token",()=>{
 assert.equal((page.match(/const snapshot=activeOwner\(\)/g)||[]).length,4);
 assert.equal((page.match(/if\(!isActive\(snapshot\)\)return;/g)||[]).length,4);
 assert.equal((page.match(/await api\((?:url|endpoint),snapshot.token,/g)||[]).length,4);
 assert.doesNotMatch(page,/await api\((?:url|endpoint),getToken\(\),/);
});
test("public counts are bounded, reject stale requests, and report unknown instead of inventing zero",()=>{
 assert.match(page,/const version=\+\+countVersion/);
 assert.match(page,/if\(version!==countVersion\)return/);
 assert.equal((page.match(/ids.slice\(offset,offset\+60\)/g)||[]).length,2);
 assert.match(page,/data-helpful-count aria-live="polite">—/);
 assert.match(page,/if\(count\)count.textContent="—"/);
});
