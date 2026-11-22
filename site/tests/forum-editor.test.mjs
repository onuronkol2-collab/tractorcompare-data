import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {forumBlocks,forumInline} from "../src/lib/forum-format.mjs";
import {FORUM_EDITOR_COPY} from "../src/lib/forum-editor-i18n.ts";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("forum editor has complete human-oriented labels in all ten locales",()=>{
 const codes=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 assert.deepEqual(Object.keys(FORUM_EDITOR_COPY),codes);
 const all=Object.keys(FORUM_EDITOR_COPY.en).sort();
 for(const locale of codes){
  assert.deepEqual(Object.keys(FORUM_EDITOR_COPY[locale]).sort(),all);
  for(const label of all)assert.ok(FORUM_EDITOR_COPY[locale][label].trim().length>0,locale+":"+label);
  assert.match(FORUM_EDITOR_COPY[locale].photoHint,/400|４００/);
 }
});

test("semantic editor parser is deterministic and never interprets HTML or image URL markup",()=>{
 const result=forumBlocks("Engine **needs repair**.\n\n- First check\n- Second *inspect*\n\n> Avoid `unknown` settings.\n\n<script>alert('x')</script>");
 assert.deepEqual(result.map(x=>x.type),["paragraph","list","quote","paragraph"]);
 assert.equal(result[0].items[0][1].type,"bold");
 assert.equal(result[1].items[1][1].type,"italic");
 assert.equal(result[2].items[0][1].type,"code");
 assert.ok(result[3].items[0].some(x=>x.text.includes("<script>")));
 assert.equal(forumInline("no markup")[0].type,"text");
 const forum=read("../src/components/ForumRichText.astro");
 assert.doesNotMatch(forum,/set:html|innerHTML/);
 const client=read("../src/lib/forum-editor-client.ts");
 assert.doesNotMatch(client,/innerHTML|dangerouslySetInnerHTML|service_role|sb_secret_/);
});

test("photos remain private and require two-stage moderation, a reservation and owning member",()=>{
 const sql=read("../../supabase/migrations/20261121200000_forum_photo_attachments_v1.sql");
 const edge=read("../../supabase/functions/forum-media/index.ts");
 const compose=read("../src/components/ForumComposer.astro");
 assert.match(sql,/tc_forum_media_own_reserve/);
 assert.match(sql,/tc_forum_media_storage_owner_insert/);
 assert.match(sql,/tc_forum_media_approval_guard/);
 assert.match(sql,/public=false/);
 assert.match(sql,/license_confirmed=true/);
 assert.match(sql,/num_nonnulls\(topic_id,reply_id\)=1/);
 assert.match(sql,/security_invoker=true/);
 assert.doesNotMatch(sql,/GRANT\s+(UPDATE|DELETE)\s+ON\s+public\.tc_forum_media\s+TO\s+authenticated/i);
 assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(edge,/m\.status!=="published"/);
 assert.match(edge,/r\.status!=="published"/);
 assert.match(edge,/p\.status!=="published"/);
 assert.doesNotMatch(edge,/console\.log\(.*serviceKey/);
 assert.match(compose,/initForumEditor/);
 assert.match(compose,/editor\.valid\(\)/);
 assert.match(compose,/editor\.commit/);
 const topic=read("../src/components/ForumTopic.astro");
 assert.match(topic,/ForumMediaGallery/);
 assert.match(topic,/ForumRichText/);
});


test("safe forum markup supports source citations, responsive tables and real headings",()=>{
 const sample=[
  "## 2026 Bayi memnuniyeti",
  "",
  "| Marka | Puan |",
  "|---|---|",
  "| Same | **13,7** |",
  "| CLAAS | 13,1 |",
  "",
  "Kaynak: https://www.climmar.com/news."
 ].join("\n");
 const blocks=forumBlocks(sample);
 assert.deepEqual(blocks.map(x=>x.type),["heading","table","paragraph"]);
 assert.equal(blocks[0].level,2);
 assert.equal(blocks[1].header.length,2);
 assert.equal(blocks[1].rows.length,2);
 assert.equal(blocks[1].rows[0][1][0].type,"bold");
 assert.equal(blocks[2].items[0][1].type,"url");
 assert.equal(forumInline("javascript:alert(1)")[0].type,"text");
 assert.equal(forumInline("https://user:secret@example.com")[0].type,"text");
 const html=read("../src/components/ForumRichText.astro");
 const inline=read("../src/components/ForumInline.astro");
 const preview=read("../src/lib/forum-editor-client.ts");
 assert.match(html,/scope="col"/);
 assert.match(html,/overflow-x:auto/);
 assert.match(inline,/ugc nofollow noopener noreferrer/);
 assert.doesNotMatch(html+inline+preview,/innerHTML|set:html|dangerouslySetInnerHTML/);
});

test("SEO descriptions are readable rather than literal Markdown fragments",async()=>{
 const {forumSeoDescription}=await import("../src/lib/forum-format.mjs");
 const description=forumSeoDescription("## 2026 Results\n\n**Same** 13,7 puan aldı.");
 assert.match(description,/Same 13,7 puan aldı/);
 assert.doesNotMatch(description,/\*\*|##/);
});

test("2026 dealer-satisfaction news SEO excerpt ends on a sourced complete sentence",async()=>{
 const {forumSeoDescription}=await import("../src/lib/forum-format.mjs");
 const original="2026 yılında traktör bayilerinin üreticilere verdiği en yüksek memnuniyet puanları hangi markalara ait?\n\n"+
  "Avrupa'da Same 13,7 puanla ilk sıraya yerleşirken Deutz-Fahr ve CLAAS onu takip etti. "+
  "Hindistan'da Swaraj, Kuzey Amerika'da ise Yanmar kendi araştırma kategorilerinin liderleri oldu.";
 const meta=forumSeoDescription(original);
 assert.equal(meta,"Avrupa'da Same 13,7 puanla ilk sıraya yerleşirken Deutz-Fahr ve CLAAS onu takip etti.");
 assert.ok(meta.length<=160);
 assert.match(meta,/[.!?。！？]$/u);
 assert.ok(original.includes(meta),"meta cannot invent content not present in the topic");
});

test("forum SEO excerpt preserves decimal measurements and marks incomplete fallback",async()=>{
 const {forumSeoDescription}=await import("../src/lib/forum-format.mjs");
 const body=("The model delivers 13.7 kW under tested conditions and was checked against sources. ")+
  "Additional context about the testing method follows in the original post. ".repeat(5);
 const meta=forumSeoDescription(body,100);
 assert.equal(meta,"The model delivers 13.7 kW under tested conditions and was checked against sources.");
 assert.ok(!meta.endsWith("13."));
 const unpunctuated="uninterrupted factual note with a very long manufacturer catalogue explanation ".repeat(8);
 const fallback=forumSeoDescription(unpunctuated,120);
 assert.ok(fallback.length<=120);
 assert.ok(fallback.endsWith("…"));
 assert.ok(unpunctuated.startsWith(fallback.slice(0,-1)));
});

test("Chinese sentences end cleanly without whitespace and forum cards keep prior excerpt",async()=>{
 const {forumSeoDescription,forumCardExcerpt}=await import("../src/lib/forum-format.mjs");
 const chinese="液压提升能力以说明书和测试工况为准。不同市场的版本可能采用不同的提升器配置，需要对照产品编号确认。"+"请以官方数据核实具体参数。".repeat(5);
 const meta=forumSeoDescription(chinese,45);
 assert.equal(meta,"液压提升能力以说明书和测试工况为准。");
 const preview="## Tractor Forum\n\n**Brand** tests 13,7 points. "+"Manufacturer note about safety ".repeat(20);
 const clean=preview.replace(/^\\s{0,3}#{1,4}\\s+/gm,"")
  .replace(/(?:\\*\\*|\\x60|(?<!\\*)\\*(?!\\*)|[|])/g,"")
  .replace(/^\\s*[-•>]\\s+/gm,"").replace(/\\s+/g," ").trim();
 const previousCard=clean.slice(0,230).replace(/\\s+\\S*$/u,"").trimEnd()||clean.slice(0,230);
 assert.equal(forumCardExcerpt(preview,230),previousCard);
 assert.match(read("../src/components/ForumHub.astro"),/forumCardExcerpt\\(topic\\.body,230\\)/);
});
