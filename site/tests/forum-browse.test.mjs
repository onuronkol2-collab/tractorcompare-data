import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {FORUM_PAGE_SIZE,forumBrowseOrder,forumBrowseWindow,forumModelOptions} from "../src/lib/forum-browse.mjs";
import {FORUM_BROWSE_TEXT} from "../src/lib/forum-browse-i18n.ts";
const id=n=>String(n).repeat(8)+"-1111-4111-8111-111111111111";
test("model filtering options retain exact identities, deduplicate and sort naturally",()=>{
 assert.deepEqual(forumModelOptions([{id:id(2),label:"Model 20"},{id:id(1),label:"Model 2"},{id:id(1),label:"Duplicate"},{id:"bad",label:"Invalid"},{id:id(3),label:" "}],"tr").map(x=>x.id),[id(1),id(2)]);
});
test("browse window preserves all matching rows and does not mistake unknown reply counts for zero",()=>{
 const rows=Array.from({length:61},(_,i)=>i);
 assert.deepEqual(forumBrowseWindow(rows),{visible:rows.slice(0,FORUM_PAGE_SIZE),total:61,more:true});
 assert.equal(forumBrowseWindow(rows,72).more,false);
 assert.deepEqual(forumBrowseWindow(rows,48).visible,rows.slice(0,48));
 const a={publishedAt:"2026-11-20",activityAt:"2026-11-25",replies:2},b={publishedAt:"2026-11-23",activityAt:"2026-11-23",replies:0};
 assert.ok(forumBrowseOrder(a,b,"activity")<0);
 assert.ok(forumBrowseOrder(a,b,"newest")>0);
 assert.ok(forumBrowseOrder({...a,replies:null},b,"popular")>0);
});
test("all ten locales cover model discovery; server-rendered links and indexability remain intact",()=>{
 assert.equal(Object.keys(FORUM_BROWSE_TEXT).length,10);
 for(const labels of Object.values(FORUM_BROWSE_TEXT)){assert.deepEqual(Object.keys(labels),Object.keys(FORUM_BROWSE_TEXT.en));assert.ok(Object.values(labels).every(x=>x.trim()))}
 const hub=readFileSync(new URL("../src/components/ForumHub.astro",import.meta.url),"utf8");
 const live=readFileSync(new URL("../src/lib/forum-live-client.ts",import.meta.url),"utf8");
 assert.match(hub,/href=\{path\+topic.slug\+"\/"\}/);
 assert.match(hub,/indexable=\{indexable\}/);
 assert.match(hub,/data-forum-model-id/);
 assert.match(hub,/forumBrowseWindow\(matches,pageLimit\)/);
 assert.match(live,/article.dataset.forumModelId=modelId/);
 assert.match(live,/status:"eq.published"/);
 assert.doesNotMatch(live,/innerHTML\s*=|service_role/);
});
