import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const article=read("../../site/docs/forum-2026-2027-traktor-guvenilirlik-ilk-konu.md");
const route=read("../src/pages/tr/guides/2026-2027-traktor-guvenilirlik/index.astro");

test("editorial research has no artificial 5+5 ranking and retains model-level provenance",()=>{
 assert.match(article,/21 Kasım 2026/);
 assert.match(article,/2027 yılına ait gerçekleşmiş uzun dönem arıza kayıtları henüz yok/);
 const models=[...article.matchAll(/^### \d+\. (.+)$/gm)].map(m=>m[1]);
 assert.ok(models.length>10,"The editorial model count must not be artificially capped at ten");
 assert.equal(new Set(models).size,models.length,"Distinct tractor model entries only");
 assert.ok((article.match(/\*\*\[Birincil saha kaynağı\]\(https:\/\//g)||[]).length>=models.length,
  "Every evaluated model must carry a direct source link");
 assert.match(article,/1\.000 saat/);
 assert.match(article,/2\.000 satılmış ve ilk 12 ayı izlenmiş/);
 assert.match(article,/sıfır arıza/i);
 assert.doesNotMatch(article,/## SEO \/ GEO yayın alanları/);
});

test("long-form research page uses Astro's precompiled Markdown renderer, not untrusted HTML",()=>{
 assert.match(route,/Content as Research/);
 assert.match(route,/<Research\s*\/>/);
 assert.match(route,/SiteLayout lang="tr"/);
 assert.match(route,/availableLocales=\{\["tr"\]\}/);
 assert.match(route,/indexableLocales=\{\["tr"\]\}/);
 assert.match(route,/"@type": "Article"/);
 assert.match(route,/mainEntityOfPage: canonicalUrl/);
 assert.match(route,/https:\/\/schema\.org/);
 assert.doesNotMatch(route,/set:html=|innerHTML|service_role|sb_secret_/);
});

test("forum remains moderated and keeps its security-based posting limit",()=>{
 const forum=read("../src/components/ForumComposer.astro");
 const forumRows=read("../src/lib/forum.ts");
 assert.match(forum,/status:"pending"/);
 assert.match(forumRows,/status==="published"/);
 assert.match(article,/2026–2027/);
});
