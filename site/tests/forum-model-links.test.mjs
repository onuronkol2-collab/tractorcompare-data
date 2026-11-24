import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {modelForumTopics} from "../src/lib/forum.ts";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
test("catalog forum integration uses only exact model ID and language, public bounded rows",()=>{
 const lib=read("../src/lib/forum.ts");
 const detail=read("../src/components/TractorDetail.astro");
 assert.match(lib,/modelTopicsCache=allPublicForumTopics\(\)/);
 assert.match(lib,/row\.status!=="published"/);
 assert.match(lib,/row\.locale\+":"\+row\.tractor_id/);
 assert.match(lib,/group\.length<4/);
 assert.match(detail,/modelForumTopics\(lang,tractor\.tractor_id\)/);
 assert.match(detail,/modelDiscussions\.length>0/);
 assert.match(detail,/localizedPath\(lang,"\/forum\/"\+topic\.slug\+"\/"\)/);
 assert.match(detail,/encodeURIComponent\(tractor\.tractor_id\)/);
 assert.doesNotMatch(detail,/encodeURIComponent\(tractor\.tractor_id\)\+"#forum-compose"/);
});
