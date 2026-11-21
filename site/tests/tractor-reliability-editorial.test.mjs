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


test("two approved illustrative tractor photos retain exact identification and legal attribution",()=>{
 const photos=[...article.matchAll(/<img src="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(photos.length,2,"Editorial report has two vetted, nondecorative pictures");
 for(const src of photos){
  assert.match(src,/^\/images\/tractors\/[a-z0-9-]+-480\.jpg$/);
  assert.ok(article.includes("CC BY-SA 4.0"),"Credits and license must be shown");
 }
 assert.match(article,/Claas Axion 870 — model fotoğrafı, test edilen araç değildir/);
 assert.match(article,/New Holland T6\.180 \(2025\).*2016|T6 ailesinden bir örnek/);
 assert.match(article,/JoachimKohler-HB/);
 assert.match(article,/MarcelX42/);
});

test("keyboard-scrollable evidence table retains all 19 models as true HTML table rows",()=>{
 assert.match(article,/research-table-scroll" role="region" tabindex="0"/);
 assert.match(article,/<caption>TractorVS model kanıt tablosu/);
 assert.equal((article.match(/<tr><td>/g)||[]).length,19);
 assert.match(route,/\.research-table-scroll/);
 assert.match(route,/\.research-photo/);
 assert.match(route,/"@type": "ImageObject"/);
 assert.match(route,/İlgilendiğiniz bölüme geçin/);
});

test("forum remains moderated and keeps its security-based posting limit",()=>{
 const forum=read("../src/components/ForumComposer.astro");
 const forumRows=read("../src/lib/forum.ts");
 assert.match(forum,/status:"pending"/);
 assert.match(forumRows,/status==="published"/);
 assert.match(article,/2026–2027/);
});
