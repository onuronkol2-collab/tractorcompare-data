import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const article=read("../../site/docs/forum-2026-2027-on-marka-guvenilirlik.md");
const opening=read("../../site/docs/forum-2026-2027-kisa-tartisma-acilisi.md");
const route=read("../src/pages/tr/guides/2026-2027-traktor-guvenilirlik/index.astro");
const hub=read("../src/components/ForumHub.astro");
const brands=["Kubota","Case IH","John Deere","New Holland","Massey Ferguson","Versatile","Fendt","Valtra","Claas","Deutz-Fahr"];
const events=[76,119,120,126,135,164];
test("2026-27 report visibly distinguishes its historical 2021 samples",()=>{
 assert.match(article,/2026–2027 Traktör Arıza Araştırması/);
 assert.match(article,/Sayıların veri yılı:\*\* 2021 ABD/);
 assert.match(article,/2026–2027 yılına ait şikâyet oranları değildir/);
 assert.match(article,/2\.262 katılımcı ve 7\.755 traktör/);
 assert.match(article,/tek traktörde birden çok şikâyet/);
 assert.match(article,/2027'de gelecekte yaşanacak arızalar henüz bilinemez/);
 assert.match(article,/satışa göre gerçek arıza yüzdesi/i);
});
test("10 unique modern brands; only six numeric measurements from a shared survey",()=>{
 const rows=[...article.matchAll(/<tr><td>(\d+|—)<\/td><th scope="row">([^<]+)<\/th><td>(.+?)<\/td><td>(.+?)<\/td><\/tr>/g)];
 assert.equal(rows.length,10);
 for(let i=0;i<brands.length;i++){
  assert.equal(rows[i][2],brands[i]);
  assert.equal(rows[i][1],i<6?String(i+1):"—");
  if(i<6){assert.equal(rows[i][3],'<strong>'+events[i]+'</strong>');assert.equal(rows[i][4],"2021");}
  else{assert.equal(rows[i][3],"Doğrulanmış oran yok");assert.equal(rows[i][4],"—");}
 }
 assert.equal(new Set(rows.map(r=>r[2])).size,10);
 assert.equal((article.match(/role="region" tabindex="0"/g)||[]).length,1);
 assert.match(article,/Allis-Chalmers/);
});
test("one photo of each brand has a license attribution; model != sampled tractor",()=>{
 assert.equal((article.match(/^!\[/gm)||[]).length,10);
 assert.equal((article.match(/CC BY-SA 4\.0/g)||[]).length,10);
 assert.equal((article.match(/Fotoğraf anket katılımcısına ait değildir/g)||[]).length,10);
 assert.match(article,/valtra-g135-9d4a4ea3/);
 assert.match(article,/Massey_Ferguson_5M\.95/);
});
test("single Turkish canonical article and original forum opening",()=>{
 assert.match(route,/Content as Research.*on-marka-guvenilirlik\.md/);
 assert.match(route,/<Research\s*\/>/);
 assert.match(route,/availableLocales=\{\["tr"\]\}/);
 assert.match(route,/indexableLocales=\{\["tr"\]\}/);
 assert.match(route,/"@type": "Article"/);
 assert.match(route,/\.research-table-scroll/);
 assert.match(hub,/100 Traktöre Kaç Şikâyet/);
 assert.match(opening,/2026–2027 Traktör Arıza Araştırması/);
 assert.match(opening,/100 değerlendirilen traktöre düşen sorun sayısını/);
 assert.doesNotMatch(route,/set:html=|innerHTML|service_role|sb_secret_/);
});
test("forum RLS-compatible moderation and auth limits remain untouched",()=>{
 const forum=read("../src/components/ForumComposer.astro");
 const rows=read("../src/lib/forum.ts");
 assert.match(forum,/status:"pending"/);
 assert.match(rows,/status==="published"/);
});