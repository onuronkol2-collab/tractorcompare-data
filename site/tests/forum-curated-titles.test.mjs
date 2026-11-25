import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {VERIFIED_FORUM_TITLE_PAIRS,sourceAwareForumSeoTitle}
 from "../src/lib/forum-curated-titles.mjs";

const reliability="9f82b9f3-7aab-41ee-8588-a0a383f80694";
const dealer="713ab252-a925-4ab7-b2c8-a30ce5b86706";
const expected=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];

test("10 independently published reliability headings get concise native-language snippets",()=>{
 assert.deepEqual(Object.keys(VERIFIED_FORUM_TITLE_PAIRS[reliability]).sort(),expected.sort());
 for(const [locale,pair] of Object.entries(VERIFIED_FORUM_TITLE_PAIRS[reliability])){
  const [original,curated]=pair;
  assert.equal(sourceAwareForumSeoTitle(reliability,locale,original),curated);
  assert.ok([...curated].length<=60,locale+" unexpectedly long");
  assert.ok(curated.includes("2020–2027")||curated.includes("2020–2027年"),locale+" missing research window");
  assert.ok(curated.endsWith(" | TractorVS"));
  assert.ok(original.length>curated.length-12,locale+" probably wrong source title");
 }
});

test("dealer-research snippets are offered only for the six genuinely published locales",()=>{
 assert.deepEqual(Object.keys(VERIFIED_FORUM_TITLE_PAIRS[dealer]).sort(),
  ["en","tr","pt-br","fr","de","ru"].sort());
 for(const [locale,[original,short]] of Object.entries(VERIFIED_FORUM_TITLE_PAIRS[dealer])){
  assert.equal(sourceAwareForumSeoTitle(dealer,locale,original),short);
  assert.ok([...short].length<=60&&short.includes("2026"));
 }
 for(const locale of ["zh","hi","ja","es"])
  assert.equal(sourceAwareForumSeoTitle(dealer,locale,"Unpublished topic"),
   "Unpublished topic | TractorVS");
});

test("edited, unrelated or unknown topic titles always stay truthful",()=>{
 const original=VERIFIED_FORUM_TITLE_PAIRS[reliability].en[0];
 assert.equal(sourceAwareForumSeoTitle(reliability,"en",original+" (updated)"),
  original+" (updated) | TractorVS");
 assert.equal(sourceAwareForumSeoTitle("unknown","en","Actual independent title"),
  "Actual independent title | TractorVS");
 assert.equal(sourceAwareForumSeoTitle(dealer,"es","Other subject 2026"),
  "Other subject 2026 | TractorVS");
 assert.equal(sourceAwareForumSeoTitle(reliability,"zz","Verschiedenes"),
  "Verschiedenes | TractorVS");
});

test("only metadata is curated; visible H1, topic schema and published locality stay unchanged",()=>{
 const source=readFileSync(new URL("../src/components/ForumTopic.astro",import.meta.url),"utf8");
 assert.match(source,/title=\{sourceAwareForumSeoTitle\(topic\.topic_id,lang,topic\.title\)\}/);
 assert.match(source,/<h1>\{topic\.title\}<\/h1>/);
 assert.match(source,/name:topic\.title/);
 assert.match(source,/indexable=\{eligible\}/);
 assert.match(source,/availableLocales=\{availableLocales\}/);
});


test("all ten approved origin-research metadata titles retain year and locale with exact source guards",()=>{
 const origins="b11d1ad6-f0cc-4a18-ab83-9d18ccc2f7ea";
 const pairs=VERIFIED_FORUM_TITLE_PAIRS[origins];
 assert.equal(Object.keys(pairs).length,10);
 assert.deepEqual(Object.keys(pairs).sort(),["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"].sort());
 for(const [lang,[original,short]] of Object.entries(pairs)){
  assert.equal(sourceAwareForumSeoTitle(origins,lang,original),short);
  assert.ok(short.includes("2026"),lang);
  assert.ok(short.length<=60,lang);
  assert.ok(short.length<original.length+12,lang);
  assert.equal(sourceAwareForumSeoTitle(origins,lang,original+" edited"),original+" edited | TractorVS");
 }
 assert.equal(new Set(Object.values(pairs).map(p=>p[1])).size,10);
});
