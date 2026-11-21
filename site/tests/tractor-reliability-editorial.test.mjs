import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const article=read("../../site/docs/forum-2026-2027-yedi-marka-sorun-sikligi.md");
const opening=read("../../site/docs/forum-2026-2027-kisa-tartisma-acilisi.md");
const route=read("../src/pages/tr/guides/2026-2027-traktor-guvenilirlik/index.astro");
const library=read("../src/lib/historical-licensed-photos.ts");
const hub=read("../src/components/ForumHub.astro");

test("original editorial copy never sells 2021 owner observations as 2027 warranty or sales failure rates",()=>{
 assert.match(article,/Değerlendirme: 21 Kasım 2026/);
 assert.match(article,/Anket veri yılı: 2021/);
 assert.match(article,/2\.262 çiftçiden 7\.755 traktör değerlendirmesi/);
 assert.match(article,/2026–2027 üretimi traktörlerin satış başına arızalanma yüzdesi değildir/);
 assert.match(article,/yedi marka/);
 assert.match(article,/üç markası ortak/);
 assert.match(article,/Allis-Chalmers tarihsel bir markadır/);
 assert.match(article,/satış başına gerçek arıza yüzdesi/i);
 assert.match(article,/aynı traktörde birden çok sorun/);
});

test("source chart measurements are retained as incident counts per 100 evaluated tractors",()=>{
 const expected=[["Kubota","0,76",76],["Case IH","1,19",119],["John Deere","1,20",120],
 ["New Holland","1,26",126],["Massey Ferguson","1,35",135],
 ["Allis-Chalmers","1,46",146],["Versatile","1,64",164]];
 for(const [brand,ppu,events] of expected){
  assert.ok(article.includes(brand),"Missing brand "+brand);
  assert.ok(article.includes(ppu),"Missing PPU "+ppu);
  assert.ok(article.includes(String(events)),"Missing events/100 "+events);
 }
 assert.equal((article.match(/<div class="research-table-scroll"/g)||[]).length,2);
 assert.equal((article.match(/<tr><td>/g)||[]).length,10);
 assert.equal((article.match(/role="region" tabindex="0"/g)||[]).length,2);
 assert.match(article,/farm-equipment\.com\/ext\/resources\/aei\/2021/);
 assert.match(article,/dtnpf\.com\/agriculture\/web\/ag\/magazine\/article/);
 assert.match(opening,/En az sorun bildirilen 5 marka/);
 assert.match(opening,/En çok sorun bildirilen 5 marka/);
 assert.match(opening,/üç marka iki listede de var/);
});

test("seven documented, independently credited exact-model illustrative photos",()=>{
 assert.equal((article.match(/^!\[[^\n]+\]\(\/images\/tractors\/[a-z0-9-]+-480\.jpg\)$/gm)||[]).length,7);
 const files=["versatile-nemesis-175-e95b1863","allis-chalmers-ib-acroterion-2026",
 "massey-ferguson-5m-95-bene-riobo-2025","new-holland-t6-180-marcelx42-2025",
 "john-deere-6r-150-2c198cee","case-ih-puma-150-chris-woodrich-2025",
 "kubota-m6-141-4d0694e5"];
 for(const id of files)assert.ok(article.includes(id),"Missing image "+id);
 assert.ok(article.includes("Bene Riobó"));
 assert.ok(article.includes("Acroterion"));
 assert.equal((article.match(/CC BY-SA 4\.0/g)||[]).length,7);
 assert.equal((article.match(/anket kapsamında incelenen traktör değildir/g)||[]).length,7);
 assert.ok(library.includes("massey-ferguson-5m-95-bene-riobo-2025"));
 assert.ok(library.includes("allis-chalmers-ib-acroterion-2026"));
});

test("original Turkish-only canonical article and photograph rights are reflected in layout",()=>{
 assert.match(route,/Content as Research.*yedi-marka-sorun-sikligi\.md/);
 assert.match(route,/<Research\s*\/>/);
 assert.match(route,/<SiteLayout lang="tr"/);
 assert.match(route,/availableLocales=\{\["tr"\]\}/);
 assert.match(route,/indexableLocales=\{\["tr"\]\}/);
 assert.match(route,/"@type": "Article"/);
 assert.match(route,/"@type": "ImageObject"/);
 assert.match(route,/mainEntityOfPage: canonicalUrl/);
 assert.match(route,/MarcelX42/);
 assert.match(route,/\.research-table-scroll/);
 assert.match(hub,/2026–2027 Traktör Arızaları: 7 Markanın Gerçek Kullanıcı Verisi/);
 assert.doesNotMatch(route,/set:html=|innerHTML|service_role|sb_secret_/);
});

test("user forum moderation and auth limits remain intact",()=>{
 const forum=read("../src/components/ForumComposer.astro");
 const rows=read("../src/lib/forum.ts");
 assert.match(forum,/status:"pending"/);
 assert.match(rows,/status==="published"/);
});
