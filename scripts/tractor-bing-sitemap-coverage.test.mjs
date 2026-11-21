import test from "node:test";
import assert from "node:assert/strict";
import {
  SITEMAPS, evaluateBingSitemapCoverage, checkBingSitemapCoverage,
  verifyAfterDeployment, bingCoverageMarkdown,
} from "./tractor-bing-sitemap-coverage.mjs";
import {ORIGIN} from "./tractor-search-discovery.mjs";

const prefixes = ["", "tr/", "zh/", "hi/", "pt-br/", "fr/", "de/", "ru/", "ja/", "es/"];
const modelURLs = prefixes.map(p => ORIGIN + "/" + p + "tractors/exact-model-123/");
const landingURLs = prefixes.map(p => ORIGIN + "/" + p + "tractors/");
const home = ORIGIN + "/";
const forumURL = ORIGIN + "/tr/forum/source-backed-research/";
const rootIndex = SITEMAPS.index;
const childURL = ORIGIN + "/sitemap-0.xml";
const xmlURLs = urls => '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  urls.map(url => "<url><loc>" + url + "</loc></url>").join("") + "</urlset>";
const good = () => ({
  robots: "User-agent: *\nAllow: /\n" +
    Object.values(SITEMAPS).map(url => "Sitemap: " + url).join("\n") + "\n",
  index: '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    [childURL, SITEMAPS.image, SITEMAPS.forum].map(url=>"<sitemap><loc>"+url+"</loc></sitemap>").join("") +
    "</sitemapindex>",
  children: [
    {url: childURL, xml: xmlURLs([home, ...landingURLs, ...modelURLs])},
    {url: SITEMAPS.image, xml: xmlURLs([modelURLs[0],modelURLs[1]])},
    {url: SITEMAPS.forum, xml: xmlURLs([ORIGIN + "/tr/forum/",forumURL])},
  ],
  image: xmlURLs([modelURLs[0], modelURLs[1]]),
  forum: xmlURLs([ORIGIN + "/tr/forum/", forumURL]),
  minimumMainUrls: 20,
  minimumModelUrls: 10,
});
function mockFetch(data, overrides = {}) {
  const calls = [];
  const paths = {
    [ORIGIN + "/robots.txt"]: data.robots,
    [rootIndex]: data.index,
    [childURL]: data.children[0].xml,
    [SITEMAPS.image]: data.image,
    [SITEMAPS.forum]: data.forum,
    ...overrides,
  };
  return {
    calls,
    fetchFn: async (url, options) => {
      calls.push({url, options});
      if (!Object.hasOwn(paths, url)) return new Response("missing", {status: 404});
      return new Response(paths[url], {status: 200});
    },
  };
}

test("Bing index child count is separate from canonical page and image counts", () => {
  const report = evaluateBingSitemapCoverage(good());
  assert.equal(report.child_sitemap_files, 3);
  assert.equal(report.main_page_urls, 21);
  assert.equal(report.localized_model_page_urls, 10);
  assert.equal(report.image_sitemap_page_entries, 2);
  assert.equal(report.forum_sitemap_page_urls, 2);
  assert.equal(report.distinct_page_urls_across_main_and_forum, 23);
  assert.equal(report.indexed_in_bing, "unknown_without_url_inspection");
  const summary = bingCoverageMarkdown(report);
  assert.match(summary, /child FILES \(not pages\)/);
  assert.match(summary, /already in main/);
  assert.match(summary, /NOT proof of indexing/);
});

test("all ten locale model slug sets must exactly match, even if aggregate minimum passes", () => {
 const english=ORIGIN+"/tractors/exact-model-123/";
 const de=ORIGIN+"/de/tractors/exact-model-123/";
 const incomplete=good();
 const secondModels=prefixes.map(prefix=>ORIGIN+"/"+prefix+"tractors/other-model-567/");
 incomplete.children[0].xml=xmlURLs([home,...landingURLs,...modelURLs.filter(url=>url!==de),...secondModels]);
 incomplete.minimumMainUrls=1;
 incomplete.minimumModelUrls=1;
 assert.throws(()=>evaluateBingSitemapCoverage(incomplete),/Localized model slug coverage mismatch: de/);
 const replaced=good();
 replaced.children[0].xml=xmlURLs([home,...landingURLs,...modelURLs.map(url=>
  url===de?ORIGIN+"/de/tractors/incorrect-model-999/":url)]);
 assert.throws(()=>evaluateBingSitemapCoverage(replaced),/Localized model slug coverage mismatch: de/);
 const valid=evaluateBingSitemapCoverage(good());
 assert.equal(valid.models_per_locale,1);
 assert.equal(valid.exact_model_slug_parity,true);
 assert.equal(valid.localized_model_page_urls,10);
});
test("approved forum photos are valid image sitemap pages; unapproved forum photos are rejected",()=>{
 const approved=good();
 approved.image=xmlURLs([modelURLs[0],forumURL]);
 approved.children[1].xml=approved.image;
 const report=evaluateBingSitemapCoverage(approved);
 assert.equal(report.image_sitemap_page_entries,2);
 assert.equal(report.image_pages_already_in_main,1);
 assert.equal(report.image_pages_in_approved_forum_only,1);
 assert.equal(report.distinct_page_urls_across_main_and_forum,23);
 const unapproved=good();
 unapproved.image=xmlURLs([ORIGIN+"/tr/forum/private-unreviewed-topic/"]);
 unapproved.children[1].xml=unapproved.image;
 assert.throws(()=>evaluateBingSitemapCoverage(unapproved),/absent from approved HTML\/forum sitemaps/);
});

test("live check reads only public GET URLs and never submits IndexNow or Bing URLs", async () => {
  const data = good();
  const mock = mockFetch(data);
  const report = await checkBingSitemapCoverage({
    fetchFn: mock.fetchFn,
    minimumMainUrls: 20, minimumModelUrls: 10,
  });
  assert.equal(report.main_page_urls, 21);
  assert.deepEqual(new Set(mock.calls.map(x => x.url)), new Set([
    ORIGIN + "/robots.txt", rootIndex, childURL, SITEMAPS.image, SITEMAPS.forum,
  ]));
  assert.ok(mock.calls.every(c => c.options.method === "GET"));
  assert.ok(mock.calls.every(c => c.options.redirect === "error"));
});

test("missing XML child or removed localized models is a hard regression", () => {
  const missingChild = good();
  missingChild.children = [];
  assert.throws(() => evaluateBingSitemapCoverage(missingChild), /child count/);

  const missingLocale = good();
  missingLocale.children[0].xml = xmlURLs([home, ...landingURLs.filter(x => !x.includes("/de/")), ...modelURLs]);
  assert.throws(() => evaluateBingSitemapCoverage(missingLocale), /Missing localized crawlable catalog/);

  const missingModels = good();
  missingModels.children[0].xml = xmlURLs([home, ...landingURLs]);
  missingModels.minimumMainUrls = 1; // Isolate model-detail coverage instead of the aggregate URL floor.
  assert.throws(() => evaluateBingSitemapCoverage(missingModels), /Published model URLs/);
});

test("image references outside canonical sitemap are rejected; overlap is not double-counted", () => {
  const orphan = good();
  orphan.image = xmlURLs([ORIGIN + "/tractors/not-a-published-model/"]);
  orphan.children[1].xml = orphan.image;
  assert.throws(() => evaluateBingSitemapCoverage(orphan), /Image sitemap references a page absent/);

  const overlappingForum = good();
  overlappingForum.forum = xmlURLs([home, forumURL]);
  overlappingForum.children[2].xml = overlappingForum.forum;
  const report = evaluateBingSitemapCoverage(overlappingForum);
  assert.equal(report.forum_pages_already_in_main, 1);
  assert.equal(report.distinct_page_urls_across_main_and_forum, 22);
});

test("invalid domain, missing robots registration, tiny sitemap or blocked HTTP fail closed", async () => {
  const wrongHost = good();
  wrongHost.children[0].xml = xmlURLs([home.replace("tractorvs.com", "example.net"), ...landingURLs, ...modelURLs]);
  assert.throws(() => evaluateBingSitemapCoverage(wrongHost), /Noncanonical/);

  const robots = good();
  robots.robots = robots.robots.replace("Sitemap: " + SITEMAPS.image, "");
  assert.throws(() => evaluateBingSitemapCoverage(robots), /robots.txt does not advertise/);

  const count = good();
  count.minimumMainUrls = 100;
  assert.throws(() => evaluateBingSitemapCoverage(count), /few PAGE URLs/);

  const mock = mockFetch(good(), {[childURL]: null});
  await assert.rejects(checkBingSitemapCoverage({
    fetchFn: async (url,opts) => url === childURL
      ? new Response("", {status: 404}) : mock.fetchFn(url,opts),
    minimumMainUrls: 20, minimumModelUrls: 10,
  }), /HTTP 404/);
});

test("empty approved forum sitemap remains valid without promoting private drafts", () => {
  const withNoForum = good();
  withNoForum.forum = xmlURLs([]);
  withNoForum.children[2].xml = withNoForum.forum;
  const report = evaluateBingSitemapCoverage(withNoForum);
  assert.equal(report.forum_sitemap_page_urls, 0);
  assert.equal(report.distinct_page_urls_across_main_and_forum, 21);
});

test("main push waits for Cloudflare only on known old-root index, then fully validates",async()=>{
 let count=0,waits=0;
 const expected={main_page_urls:3880};
 const result=await verifyAfterDeployment({
  check:async()=>{count++;if(count<3)throw Error("[TractorVS sitemap coverage] Sitemap index is missing main, image or forum child file");return expected;},
  sleep:async(ms)=>{assert.equal(ms,50);waits++;},
  delayMs:50,maxAttempts:4,
 });
 assert.equal(result,expected);assert.equal(count,3);assert.equal(waits,2);
});
test("actual broken root remains a hard failure after a finite deployment grace",async()=>{
 let calls=0,waits=0;
 await assert.rejects(verifyAfterDeployment({
  check:async()=>{calls++;throw Error("Sitemap index is missing main, image or forum child file");},
  sleep:async()=>{waits++;},maxAttempts:4,delayMs:0,
 }),/missing main, image or forum/);
 assert.equal(calls,4);assert.equal(waits,3);
});
test("unrelated 404, broken robots and invalid XML never get a retry or pass",async()=>{
 for(const problem of ["Sitemap or robots HTTP 404","Missing localized crawlable catalog landing","Image sitemap references a page absent"]){
  let calls=0,waits=0;
  await assert.rejects(verifyAfterDeployment({
   check:async()=>{calls++;throw Error(problem)},
   sleep:async()=>{waits++;},maxAttempts:4,delayMs:0
  }),new RegExp(problem.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.equal(calls,1);assert.equal(waits,0);
 }
});
test("retry budget cannot become unbounded",async()=>{
 await assert.rejects(verifyAfterDeployment({maxAttempts:7}),/Invalid sitemap verification attempt limit/);
});
