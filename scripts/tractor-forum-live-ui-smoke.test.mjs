import test from "node:test";
import assert from "node:assert/strict";
import {FORUM_PATHS,ORIGIN,inspectForumUiHtml,auditLiveForumUi} from "./tractor-forum-live-ui-smoke.mjs";

const healthy='<!doctype html><html><body>'+
 '<div class="container community-hero-inner"></div>'+
 '<div class="community-content-grid"><div class="community-topic-grid"></div></div>'+
 '<details data-forum-auth-gate></details><ol data-recent-members></ol>'+
 '<input type="checkbox" name="show_leaderboard"/></body></html>';
const reply=(body=healthy,status=200,contentType="text/html")=>new Response(body,{
 status,headers:{"content-type":contentType}
});

test("every production forum locale uses an explicit unchecked public-list opt-in",async()=>{
 const visited=[];
 const result=await auditLiveForumUi({fetchFn:async url=>{
  visited.push(url);return reply();
 }});
 assert.equal(result.ok,true);
 assert.equal(result.checked,10);
 assert.deepEqual(new Set(visited),new Set(FORUM_PATHS.map(p=>ORIGIN+p)));
});

test("privacy regression: checked attributes are unsafe even when checked=false",()=>{
 for(const flag of [' checked',' checked=""',' checked="false"']){
  const html=healthy.replace('name="show_leaderboard"','name="show_leaderboard"'+flag);
  assert.match(inspectForumUiHtml(html).join(" "),/checked by default/);
 }
});

test("no hidden, removed or non-checkbox opt-in passes",()=>{
 assert.match(inspectForumUiHtml(healthy.replace('name="show_leaderboard"','name="other"')).join(" "),/exactly one/);
 assert.match(inspectForumUiHtml(healthy.replace('type="checkbox"','type="hidden"')).join(" "),/not a checkbox/);
 assert.match(inspectForumUiHtml(healthy.replace("community-hero-inner","old-layout")).join(" "),/Missing forum layout/);
 assert.match(inspectForumUiHtml(healthy.replace("data-recent-members","data-other-members")).join(" "),/Newest members/);
});

test("one stale locale, non-HTML or HTTP failure fails the whole live check",async()=>{
 const first=FORUM_PATHS[0];
 const missing=await auditLiveForumUi({fetchFn:async url=>
  reply(url.endsWith(first)?healthy.replace('name="show_leaderboard"','name="show_leaderboard" checked'):healthy)});
 assert.equal(missing.ok,false);
 assert.match(missing.errors.join(" "),/checked by default/);
 const badHttp=await auditLiveForumUi({paths:[first],fetchFn:async()=>reply("not available",503)});
 assert.equal(badHttp.ok,false);assert.match(badHttp.errors.join(" "),/HTTP 503/);
 const badType=await auditLiveForumUi({paths:[first],fetchFn:async()=>reply("{}",200,"application/json")});
 assert.equal(badType.ok,false);assert.match(badType.errors.join(" "),/Non-HTML/);
 await assert.rejects(auditLiveForumUi({origin:"https://example.net"}),/External origin/);
});
