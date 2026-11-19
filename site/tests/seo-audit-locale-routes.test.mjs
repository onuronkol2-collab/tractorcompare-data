import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("production SEO auditing validates only actually published locale alternatives",()=>{
  const source=read("scripts/production-seo-audit.mjs");
  assert.match(source,/unique\.has\(expected\)/);
  assert.match(source,/hreflang-nonexistent/);
  assert.match(source,/TRACTORVS_EDITORIAL_SITEMAP/);
  assert.match(source,/editorial-sitemap-lag/);
  assert.match(source,/reviews\/basak-2075-bk/);
  assert.match(source,/defaultExpected=BASE\+base/);
  assert.doesNotMatch(source,/if\(alternateMap\.get\(code\)!==expected\)error/);
});
test("live public audit covers all ten guide routes and two authored methodology pages",()=>{
  const source=read("scripts/live-website-audit.mjs");
  for(const locale of ["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"]){
    assert.ok(source.includes('"/'+locale+'guides/choosing-a-tractor/"'),locale);
  }
  for(const path of ["/methodology/","/tr/methodology/"])assert.ok(source.includes('"'+path+'"'))
  for(const path of ["/reviews/basak-2075-bk/","/tr/reviews/basak-2075-bk/"])
    assert.ok(source.includes('"'+path+'"'));;
});
