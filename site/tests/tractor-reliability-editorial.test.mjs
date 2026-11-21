import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const article=read("../../site/docs/forum-2026-2027-on-marka-guvenilirlik.md");
const opening=read("../../site/docs/forum-2026-2027-kisa-tartisma-acilisi.md");
const route=read("../src/pages/tr/guides/2026-2027-traktor-guvenilirlik/index.astro");
const hub=read("../src/components/ForumHub.astro");
const brands=["Fendt","New Holland","JCB","Valtra","Case IH","Claas","Massey Ferguson","John Deere","Kubota","Deutz-Fahr"];

test("the 2026-27 article no longer promotes an older survey as current repair data",()=>{
 assert.match(article,/2026–2027 Traktör Arıza Araştırması/);
 assert.match(article,/2025–2026'da yayımlanmış bağımsız incelemeler/);
 assert.doesNotMatch(article,/2021|Reader Insights|76 sorun|164 sorun/);
 assert.doesNotMatch(opening,/2021|Reader Insights|76 sorun|164 sorun/);
 assert.doesNotMatch(route,/2021|Reader Insights/);
 assert.doesNotMatch(hub,/2021|Reader Insights/);
 assert.match(article,/2027 yılına ait gelecek arızalar henüz gerçekleşmedi/);
});

test("ten distinct brands and 100-tractor unknowns do not turn single-machine repairs into rates",()=>{
 const cards=[...article.matchAll(/<section class="research-model-card" aria-label="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(cards.length,10);
 assert.equal((article.match(/<tr><th scope="row">/g)||[]).length,10);
 assert.equal((article.match(/<td>Veri açıklanmadı<\/td>/g)||[]).length,10);
 assert.equal((article.match(/<strong>100 traktöre düşen doğrulanmış şikâyet:<\/strong> Açıklanmadı/g)||[]).length,10);
 for(const brand of brands)assert.ok(cards.some(x=>x.startsWith(brand+" — ")),"Brand missing: "+brand);
 assert.match(article,/Şikâyet sıklığı \(100 traktörde\)/);
 assert.match(article,/Arızalanan traktör oranı \(%\)/);
 assert.match(article,/farklı göstergelerdir/);
});

test("each brand card has real independent test citation and a credited non-test tractor photo",()=>{
 assert.equal((article.match(/<img src=/g)||[]).length,10);
 assert.equal((article.match(/<figcaption>/g)||[]).length,10);
 assert.equal((article.match(/Wikimedia Commons<\/a>/g)||[]).length,10);
 assert.equal((article.match(/CC BY-SA 4\.0/g)||[]).length,10);
 assert.equal((article.match(/<a href="https:\/\/(?:www\.profi\.|www\.profi\.co\.uk)/g)||[]).length,10);
 assert.match(article,/Fastrac 4220/);
 assert.match(article,/JCB_Fastrac_4220_%C3%96ko-Feldtage/);
 assert.match(article,/4\.400/);
 assert.match(article,/2\.920/);
 assert.match(article,/2\.150/);
});

test("only original Turkish article is indexable; no forum auth or moderation rules are bypassed",()=>{
 assert.match(route,/Content as Research.*on-marka-guvenilirlik\.md/);
 assert.match(route,/<Research\s*\/>/);
 assert.match(route,/availableLocales=\{\["tr"\]\}/);
 assert.match(route,/indexableLocales=\{\["tr"\]\}/);
 assert.match(route,/"@type": "Article"/);
 assert.match(route,/\.research-model-grid/);
 assert.match(route,/\.research-table-scroll/);
 assert.match(hub,/10 Markanın Gerçek Saha Kayıtları/);
 assert.doesNotMatch(route,/set:html=|innerHTML|service_role|sb_secret_/);
 const composer=read("../src/components/ForumComposer.astro");
 const forum=read("../src/lib/forum.ts");
 assert.match(composer,/status:"pending"/);
 assert.match(forum,/status==="published"/);
});