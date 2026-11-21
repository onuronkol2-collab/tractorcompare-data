import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {FORUM_TEXT,FORUM_CATEGORY_KEYS} from "../src/lib/forum-i18n.ts";
import {FORUM_STARTER_GUIDES} from "../src/lib/forum-starter-guides.ts";
import {isSafeForumTopic} from "../src/lib/forum.ts";
const text=path=>readFileSync(new URL(path,import.meta.url),"utf8");
test("all ten forum locales have complete original UI, categories and consent semantics",()=>{
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 assert.deepEqual(Object.keys(FORUM_TEXT),locales);
 const keys=Object.keys(FORUM_TEXT.en).sort();
 for(const locale of locales){
  assert.deepEqual(Object.keys(FORUM_TEXT[locale]).sort(),keys);
  for(const key of keys)assert.ok(FORUM_TEXT[locale][key]?.trim().length>0,locale+" "+key);
  for(const category of FORUM_CATEGORY_KEYS)assert.ok(FORUM_TEXT[locale][category]);
  assert.match(FORUM_TEXT[locale].consent,/AI|yapay zek|ИИ|人工智能|KI|IA|एआई|AI|ＡＩ|AI/i);
 }
});
test("only explicitly published, safe-slug public forum topics may become static pages",()=>{
 const row={
  id:"9058289c-16e0-43f9-b5d5-fd9cc03037f2",topic_id:"9058289c-16e0-43f9-b5d5-fd9cc03037f2",
  locale:"en",original_locale:"en",slug:"sample-topic-9058289c16e043f9b5d5fd9cc03037f2",
  category:"questions",tractor_id:null,title:"Tractor maintenance question",body:"Please share a real and useful tractor maintenance question instead of fabricated reviews.",
  status:"published",created_at:"2026-11-21",updated_at:"2026-11-21",seo_ready:true,machine_translated:false
 };
 assert.equal(isSafeForumTopic(row),true);
 assert.equal(isSafeForumTopic({...row,status:"pending"}),false);
 assert.equal(isSafeForumTopic({...row,slug:"../../private"}),false);
 assert.equal(isSafeForumTopic({...row,title:"spam"}),false);
});
test("moderated posting never exposes service-role keys, publishes immediately, or forges authorship",()=>{
 const composer=text("../src/components/ForumComposer.astro");
 const data=text("../src/lib/forum.ts");
 const topic=text("../src/components/ForumTopic.astro");
 const layout=text("../src/layouts/SiteLayout.astro");
 const sitemap=text("../astro.config.mjs");
 const hub=text("../src/components/ForumHub.astro");
 assert.match(composer,/status:"pending"/);
 assert.match(composer,/create_user:true/);
 assert.match(composer,/sessionStorage/);
 assert.match(composer,/translation_consent/);
 assert.match(composer,/mode="topic"|mode===/);
 assert.match(data,/SUPABASE_PUBLISHABLE_KEY/);
 assert.match(data,/sb_secret_/);
 assert.match(data,/status==="published"/);
 assert.doesNotMatch(composer,/service_role|sb_secret_/);
 assert.doesNotMatch(topic,/DiscussionForumPosting/); // no real author data yet
 assert.match(hub,/indexable=\{indexable\}/);
 assert.match(sitemap,/forum\(\?:/);
 assert.match(layout,/forumCopy\(lang,"name"\)/);
});

test("empty forum has useful original editorial guidance in ten locales, without manufactured UGC",()=>{
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 assert.deepEqual(Object.keys(FORUM_STARTER_GUIDES),locales);
 for(const lang of locales){
  const group=FORUM_STARTER_GUIDES[lang];
  assert.ok(group.heading.length>12 && group.intro.length>40,lang);
  assert.equal(group.items.length,3,lang);
  assert.equal(new Set(group.items.map(i=>i.title)).size,3,lang);
  for(const item of group.items){
   assert.ok(Array.from(item.title).length >= (lang==="zh"||lang==="ja"?4:6) && Array.from(item.detail).length>35,lang+" "+item.title);
  }
 }
 const hub=text("../src/components/ForumHub.astro");
 assert.match(hub,/FORUM_STARTER_GUIDES\[lang\]/);
 assert.match(hub,/class="community-starter-grid"/);
 assert.match(hub,/indexable=\{indexable\}/);
 assert.match(hub,/const indexable=publicCount>0/);
 assert.doesNotMatch(hub,/<DiscussionForumPosting/);
});
