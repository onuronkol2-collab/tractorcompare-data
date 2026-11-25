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
  assert.match(source,/\+"reviews\/basak-2075-bk\/"\)/);
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
  for(const locale of ["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"])
    assert.ok(source.includes('"/'+locale+'reviews/basak-2075-bk/"'),locale);;
});

test("new public SEO smoke audit reports 404 translated pages, not just a success exit code",()=>{
  const code=read("scripts/live-website-audit.mjs");
  assert.match(code,/TRACTORVS_LIVE_EDITORIAL_HEALTH/);
  assert.match(code,/http_non_ok/);
  // All canonical production audits (push, scheduled, manual) fail on
  // partial HTTP/markup/identity errors; PRs remain observational.
  assert.ok(code.includes('production&&process.env.GITHUB_EVENT_NAME!=="pull_request"'));
  assert.ok(code.includes('publicProblems.length||modelProblems.length||parity.length'));
  assert.match(code,/TRACTORVS_PUBLIC_RESPONSE_HEALTH/);
  assert.match(code,/process\.exitCode=1/);
});
