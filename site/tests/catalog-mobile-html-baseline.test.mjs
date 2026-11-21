import {test} from "node:test";
import assert from "node:assert/strict";
import {inspectCatalogHTML,auditCatalogFootprint,ORIGIN,PREFIXES,reportCatalogFootprint} from "../scripts/catalog-mobile-html-baseline.mjs";
function fixture(url,n=2){
 const prefix=new URL(url).pathname;
 const cards=Array.from({length:n},(_,i)=>
  '<article class="tractor-card"><a class="tractor-card-main" href="'+prefix+'model-'+i+'/">Model</a></article>').join("");
 return '<html><head><link rel="canonical" href="'+url+'"></head><body><main>'+cards+'</main></body></html>';
}
test("read-only mobile inventory has every one of ten locales",()=>{
 assert.deepEqual(PREFIXES,["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"]);
});
test("valid SSR catalogue preserves every crawlable detail link",()=>{
 const url=ORIGIN+"/tr/tractors/";
 const r=inspectCatalogHTML(fixture(url,4),url);
 assert.equal(r.card_count,4);assert.equal(r.model_links,4);
 assert.equal(r.html_bytes,Buffer.byteLength(fixture(url,4)));
 assert.match(reportCatalogFootprint([r]),/uncompressed document bytes/);
});
test("missing, duplicate, noncanonical, noindex and mismatched links fail closed",()=>{
 const url=ORIGIN+"/tractors/";
 const good=fixture(url);
 for(const bad of [
  good.replace('href="/tractors/model-1/"','href="/other/model-1/"'),
  good.replace('href="/tractors/model-1/"','href="/tractors/model-0/"'),
  good.replace('rel="canonical"','rel="alternate"'),
  good.replace("<main>","<meta name=\"robots\" content=\"noindex\"><main>"),
  good.replace('class="tractor-card-main"','class="other"'),
 ]){
  assert.throws(()=>inspectCatalogHTML(bad,url));
 }
});
test("all locale counts must match the same published set, no hidden draft expansion",async()=>{
 const ok=async(url)=>new Response(fixture(String(url)),{status:200});
 const items=await auditCatalogFootprint({fetchFn:ok});
 assert.equal(items.length,10);
 await assert.rejects(auditCatalogFootprint({fetchFn:async(url)=>
  new Response(fixture(String(url),String(url).includes("/de/")?1:2),{status:200})}),
  /counts differ/);
});
