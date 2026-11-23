import test from "node:test";
import assert from "node:assert/strict";
import {FORUM_DRAFT_MAX,FORUM_DRAFT_LENGTH_COPY,draftLengthState,wouldOverflowForumPaste}
 from "../src/lib/forum-draft-length.mjs";
import {FORUM_HUB_META_OVERRIDES,forumHubSeoDescription}
 from "../src/lib/forum-hub-seo.mjs";

const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
test("forum body limits retain published DB-compatible caps",()=>{
 assert.deepEqual(FORUM_DRAFT_MAX,{topic:12000,reply:6000});
 assert.deepEqual(Object.keys(FORUM_DRAFT_LENGTH_COPY).sort(),locales.slice().sort());
 for(const lang of locales)for(const key of ["unit","near","full","paste"])
  assert.ok(FORUM_DRAFT_LENGTH_COPY[lang][key]?.trim(),lang+" missing "+key);
});

test("counter warns at 90%, at 12k, and includes UTF-16 surrogate units",()=>{
 assert.deepEqual(draftLengthState("A".repeat(10800),12000),{
  used:10800,limit:12000,remaining:1200,warning:true,full:false
 });
 assert.deepEqual(draftLengthState("A".repeat(11999),12000),{
  used:11999,limit:12000,remaining:1,warning:true,full:false
 });
 const exact=draftLengthState("A".repeat(12000),12000);
 assert.equal(exact.full,true);assert.equal(exact.remaining,0);
 const emoji=draftLengthState("😀".repeat(3000),6000);
 assert.equal(emoji.used,6000);assert.equal(emoji.full,true);
 assert.equal(draftLengthState("",6000).warning,false);
 assert.throws(()=>draftLengthState("",0),RangeError);
});

test("oversize paste rejects without changing draft, but selection replacement can fit",()=>{
 const initial="A".repeat(11900);
 assert.equal(wouldOverflowForumPaste(initial,11900,11900,"B".repeat(150),12000),true);
 assert.equal(wouldOverflowForumPaste(initial,11900,11900,"B".repeat(100),12000),false);
 assert.equal(wouldOverflowForumPaste(initial,11700,11900,"B".repeat(250),12000),false);
 assert.equal(wouldOverflowForumPaste(initial,11700,11900,"B".repeat(301),12000),true);
 assert.equal(wouldOverflowForumPaste("A".repeat(11999),11999,11999,"😀",12000),true);
 assert.equal(wouldOverflowForumPaste(initial,-1,12,"bad",12000),false);
});

test("JA and ZH forum hub metadata is original, informative, and bounded",()=>{
 assert.deepEqual(Object.keys(FORUM_HUB_META_OVERRIDES).sort(),["ja","zh"]);
 for(const lang of ["ja","zh"]){
  const desc=forumHubSeoDescription(lang,"Old summary");
  assert.equal(desc,FORUM_HUB_META_OVERRIDES[lang]);
  assert.ok([...desc].length>=70&&[...desc].length<=160,lang+" length "+[...desc].length);
  assert.ok(desc.includes("TractorVS"),lang);
 }
 for(const lang of locales.filter(x=>!["ja","zh"].includes(x)))
  assert.equal(forumHubSeoDescription(lang,"Original"),"Original");
});
