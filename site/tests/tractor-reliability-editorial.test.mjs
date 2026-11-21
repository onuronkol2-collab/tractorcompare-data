import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const article=read("../../site/docs/forum-2026-2027-on-marka-guvenilirlik.md");
const opening=read("../../site/docs/forum-2026-2027-kisa-tartisma-acilisi.md");
const route=read("../src/pages/tr/guides/2026-2027-traktor-guvenilirlik/index.astro");
const hub=read("../src/components/ForumHub.astro");
const ranks=["Valtra","John Deere","Fendt","Claas","Massey Ferguson","New Holland","Case IH","Deutz-Fahr","Zetor","Ursus"];
test("ten unique brands come from one historical academic source in one ranked list",()=>{
  const rows=[...article.matchAll(/<tr><td>(\d+)<\/td><th scope="row">([^<]+)<\/th>/g)];
  assert.equal(rows.length,10);
  for(let i=0;i<10;i++){assert.equal(Number(rows[i][1]),i+1);assert.equal(rows[i][2],ranks[i]);}
  assert.equal(new Set(rows.map(r=>r[2])).size,10);
  assert.match(article,/Karol Durczak/);
  assert.match(article,/2020/);
  assert.match(article,/1\.100 çevrimiçi anket/);
  assert.match(article,/1987–2017/);
  assert.match(article,/11 traktör güvenilirlik ölçütü/);
  assert.match(article,/satış başına mekanik arıza yüzdesi değildir/i);
  assert.match(article,/0,87/);
  assert.match(article,/0,86/);
  assert.match(article,/0,85/);
  assert.match(article,/https:\/\/doi\.org\/10\.17559\/TV-20190819132340/);
  assert.match(opening,/10 Marka, Tek Liste/);
  assert.ok(!opening.includes("En çok sorun bildirilen 5 marka"));
});
test("every brand has an attributed photo distinct from academic participants",()=>{
  const photoLines=[...article.matchAll(/^!\[[^\n]+\]\((.+)\)$/gm)];
  assert.equal(photoLines.length,10);
  for(const p of photoLines){
    assert.match(p[1],/^\/images\/tractors\/|^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  }
  assert.equal((article.match(/Fotoğraf: \[/g)||[]).length,10);
  assert.equal((article.match(/CC BY-SA 4\.0/g)||[]).length,10);
  assert.equal((article.match(/araştırmadaki traktörlerden biri değildir/g)||[]).length,10);
});
test("rendered article remains single Turkish canonical, accessible, and forum-safe",()=>{
  assert.match(route,/Content as Research.*on-marka-guvenilirlik\.md/);
  assert.match(route,/<Research\s*\/>/);
  assert.match(route,/availableLocales=\{\["tr"\]\}/);
  assert.match(route,/indexableLocales=\{\["tr"\]\}/);
  assert.match(route,/"@type": "Article"/);
  assert.match(route,/"@type": "ImageObject"/);
  assert.match(route,/\.research-table-scroll/);
  assert.match(hub,/Traktör Güvenilirlik Sıralaması: 10 Marka, Tek Liste/);
  assert.doesNotMatch(route,/set:html=|innerHTML|service_role|sb_secret_/);
});
test("moderation and authenticated forum limits remain untouched",()=>{
  const forum=read("../src/components/ForumComposer.astro");
  const rows=read("../src/lib/forum.ts");
  assert.match(forum,/status:"pending"/);
  assert.match(rows,/status==="published"/);
});