import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {approvedForumHubLocales} from "../src/lib/forum-hub-locales.mjs";

const languages=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const eligible=row=>row.status==="published"&&row.seo_ready===true&&row.body.length>=150;

test("indexable Turkish forum does not emit hreflang toward empty/noindex forums",()=>{
 const topics=[{locale:"tr",status:"published",seo_ready:true,body:"A".repeat(300)}];
 assert.deepEqual(approvedForumHubLocales(topics,languages,eligible),["tr"]);
});
test("a reviewed language becomes reciprocal only after its topic passes the SEO gate",()=>{
 const topics=[
  {locale:"tr",status:"published",seo_ready:true,body:"A".repeat(300)},
  {locale:"en",status:"pending",seo_ready:true,body:"A".repeat(300)},
  {locale:"de",status:"published",seo_ready:false,body:"A".repeat(300)},
  {locale:"fr",status:"published",seo_ready:true,body:"thin"},
  {locale:"ja",status:"published",seo_ready:true,body:"A".repeat(300)}
 ];
 assert.deepEqual(approvedForumHubLocales(topics,languages,eligible),["tr","ja"]);
 assert.deepEqual(approvedForumHubLocales(topics.map(t=>({...t,seo_ready:false})),languages,eligible),[]);
});
test("ForumHub passes the approved language subset into SiteLayout, never ALL ten by default",()=>{
 const forum=readFileSync(new URL("../src/components/ForumHub.astro",import.meta.url),"utf8");
 assert.match(forum,/allPublicForumTopics\(\)/);
 assert.match(forum,/approvedForumHubLocales\(publicTopics,LOCALES,isIndexableForumTopic\)/);
 assert.match(forum,/indexableLocales=\{indexableLocales\}/);
 assert.match(forum,/indexable=\{indexable\}/);
 const thread=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
 assert.match(thread,/versions\.filter\(isIndexableForumTopic\)\.map\(row=>row\.locale\)/);
});
