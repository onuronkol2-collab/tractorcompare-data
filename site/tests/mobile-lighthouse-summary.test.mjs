import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeLighthouse,collectImageOptimizationCandidates,collectStaticResourceCandidates,interpretCrux,markdownReport,FIELD_THRESHOLDS,ROUTE_URLS,validateLiveLighthouseResult,repeatedHomeMedian} from "../scripts/mobile-lighthouse-summary.mjs";

const sample={
  finalUrl:"https://tractorvs.com/tr/",
  categories:{
    performance:{score:0.78},
    accessibility:{score:0.95,auditRefs:[{id:"color-contrast",weight:1}]},
    "best-practices":{score:1},
    seo:{score:0.92,auditRefs:[{id:"is-crawlable",weight:1}]},
  },
  audits:{
    "largest-contentful-paint":{numericValue:3400},
    "cumulative-layout-shift":{numericValue:0.06},
    "total-blocking-time":{numericValue:180},
    "first-contentful-paint":{numericValue:1200},
    "color-contrast":{id:"color-contrast",score:0.4,title:"Contrast",details:{items:[]}},
    "unused-javascript":{id:"unused-javascript",score:0.3,title:"Unused JavaScript",details:{type:"opportunity",overallSavingsMs:250}},
    "is-crawlable":{id:"is-crawlable",score:0,title:"Links are crawlable",description:"Missing href on visible anchors."},
  },
};
test("Lighthouse report is explicitly synthetic, retains field INP as unknown",()=>{
 const report=analyzeLighthouse(sample,"home");
 assert.equal(report.mode,"synthetic_lab_mobile");
 assert.equal(report.real_user_inp_measured,false);
 assert.equal(report.scores.performance,78);
 assert.equal(report.vitals["largest-contentful-paint"],3400);
 assert.equal(report.vitals["cumulative-layout-shift"],0.06);
 assert.equal(report.issues[0].id,"unused-javascript");
 assert.equal(report.accessibilityFindings[0].id,"color-contrast");
 assert.equal(report.scores.seo,92);
 assert.equal(report.seoFindings[0].id,"is-crawlable");
 assert.throws(()=>analyzeLighthouse(sample,"attacker"),/Unrecognized/);
 assert.throws(()=>analyzeLighthouse({...sample,finalUrl:"https://malicious.example"},"home"),/Unexpected Lighthouse redirect/);
});
test("CrUX field metrics are only reported when Google actually returns enough data",()=>{
 assert.deepEqual(interpretCrux({}),{available:false,reason:"insufficient_real_user_sample_or_no_field_data"});
 const field=interpretCrux({loadingExperience:{metrics:{
  LARGEST_CONTENTFUL_PAINT_MS:{percentile:2400},
  CUMULATIVE_LAYOUT_SHIFT_SCORE:{percentile:11},
  INTERACTION_TO_NEXT_PAINT:{percentile:190},
 }}});
 assert.equal(field.available,true);
 assert.equal(field.scope,"URL");
 assert.equal(field.values.lcp_ms,2400);
 assert.equal(field.values.cls,0.11);
 assert.equal(field.values.inp_ms,190);
 assert.equal(field.threshold_pass.cls,false);
 assert.equal(field.threshold_pass.inp_ms,true);
 const origin=interpretCrux({originLoadingExperience:{metrics:{LARGEST_CONTENTFUL_PAINT_MS:{percentile:2800}}}});
 assert.equal(origin.scope,"origin_only");
 assert.equal(origin.values.cls,null);
 assert.equal(origin.threshold_pass.lcp_ms,false);
 assert.equal(FIELD_THRESHOLDS.inp_ms,200);
});
test("CI markdown labels CrUX data absence as unavailable, never 0 or a passing INP score",()=>{
 const lab=analyzeLighthouse(sample,"home");
 const report=markdownReport([lab],{});
 assert.match(report,/simulated mobile lab visits/);
 assert.match(report,/TBT is \*\*not\*\* INP/);
 assert.match(report,/Unavailable/);
 assert.match(report,/N\/A is never a pass or zero/);
 assert.doesNotMatch(report,/INP p75 \| 0 /);
});


test("the sampled templates include the whole public experience and each added route is supported",()=>{
 const routes=["home","catalog","model","compare","advisor","articles","glossary",
   "selection","review","forum","en-home","zh-home","de-model","ja-guide"];
 const text=readFileSync(new URL("../scripts/mobile-lighthouse-summary.mjs",import.meta.url),"utf8");
 for(const route of routes)assert.ok(text.includes('"'+route+'"'),route);
 const normal=analyzeLighthouse({...sample,categories:{...sample.categories,seo:{score:1,auditRefs:[]}}},"forum");
 assert.equal(normal.scores.seo,100);
 assert.deepEqual(normal.seoFindings,[]);
 const markdown=markdownReport([normal],{});
 assert.match(markdown,/scored 100\/100 in this run/);
 const fail=markdownReport([analyzeLighthouse(sample,"advisor")],{});
 assert.match(fail,/is-crawlable: Links are crawlable/);
 assert.match(fail,/\*\*advisor\*\*: 92\/100/);
});


test("image performance candidates are first-party, query-free and never double-count Lighthouse audits",()=>{
 const first="https://tractorvs.com/images/tractors/belarus-80-1-nikolai-960.jpg";
 const lhr={audits:{
  "modern-image-formats":{details:{items:[
   {url:first+"?v=stale",wastedBytes:180000},
   {url:"https://other.example/images/tractors/copy.jpg",wastedBytes:900000},
   {url:"https://tractorvs.com/internal/secret.json",wastedBytes:900000},
  ]}},
  "uses-responsive-images":{details:{items:[
   {url:first,wastedBytes:270000},
   {url:"https://tractorvs.com/images/tractors/unknown.jpg",wastedBytes:-1},
  ]}},
 }};
 const items=collectImageOptimizationCandidates(lhr);
 assert.equal(items.length,1);
 assert.equal(items[0].url,first,"do not retain query tokens or emit off-site images");
 assert.equal(items[0].estimatedMaxWasteBytes,270000,"overlapping audit estimates cannot add up");
 assert.deepEqual(items[0].flags,["modern-image-formats","uses-responsive-images"]);
 const report=analyzeLighthouse({...sample,audits:{...sample.audits,...lhr.audits}},"model");
 assert.deepEqual(report.imageCandidates,items);
 const md=markdownReport([report,report],{});
 assert.match(md,/First-party image optimization candidates/);
 assert.match(md,/laboratory estimates only/);
 assert.match(md,/belarus-80-1-nikolai-960\.jpg/);
 assert.match(md,/264 KiB/);
 assert.doesNotMatch(md,/stale|other\.example|internal\/secret/);
 assert.doesNotMatch(md,/527 KiB/);
});

test("no image itemization never implies photos are already optimized",()=>{
 assert.deepEqual(collectImageOptimizationCandidates({audits:{}}),[]);
 const md=markdownReport([analyzeLighthouse(sample,"home")],{});
 assert.match(md,/does not prove all photographs are optimally sized/);
});

test("weekly mobile route inventory includes all ten localized home pages and keeps prior templates",()=>{
 const paths=["/","/tr/","/zh/","/hi/","/pt-br/","/fr/","/de/","/ru/","/ja/","/es/"];
 for(const path of paths)assert.ok(Object.values(ROUTE_URLS).includes("https://tractorvs.com"+path),path);
 assert.equal(Object.keys(ROUTE_URLS).length,23);
 for(const route of ["home","home-repeat-2","home-repeat-3"])assert.equal(ROUTE_URLS[route],"https://tractorvs.com/tr/");
 const workflow=readFileSync(new URL("../../.github/workflows/mobile-performance-audit.yml",import.meta.url),"utf8");
 assert.match(workflow,/import \{ ROUTE_URLS \}/);
 assert.match(workflow,/done < \/tmp\/tractorvs-lighthouse\/routes\.txt/);
});
test("live audits reject wrong same-origin paths, runtime errors and incomplete data",()=>{
 assert.doesNotThrow(()=>validateLiveLighthouseResult(sample,"home"));
 assert.throws(()=>validateLiveLighthouseResult(sample,"catalog"),/Unexpected Lighthouse final URL/);
 assert.throws(()=>validateLiveLighthouseResult({...sample,runtimeError:{code:"NO_FCP"}},"home"),/runtime failure/);
 assert.throws(()=>validateLiveLighthouseResult({...sample,categories:{...sample.categories,performance:{score:null}}},"home"),/Missing or invalid Lighthouse score/);
 assert.throws(()=>validateLiveLighthouseResult({...sample,audits:{...sample.audits,"total-blocking-time":{numericValue:null}}},"home"),/Missing or invalid Lighthouse lab metric/);
});
test("three TR lab visits preserve individual results and report their median instead of cherry-picking",()=>{
 const reports=["home","home-repeat-2","home-repeat-3"].map((route,i)=>analyzeLighthouse({
  ...sample,categories:{...sample.categories,performance:{score:[.66,1,.98][i]}},
  audits:{...sample.audits,"largest-contentful-paint":{numericValue:[2649,1417,2027][i]}}
 },route));
 assert.equal(repeatedHomeMedian(reports).performance,98);
 assert.equal(repeatedHomeMedian(reports).lcp,2027);
 assert.equal(repeatedHomeMedian(reports.slice(0,2)),null);
 const md=markdownReport(reports,{home:{available:false,reason:"PageSpeed_http_429"}});
 assert.match(md,/median of three separate simulated visits: performance 98/);
 assert.match(md,/PageSpeed_http_429/);
 assert.match(md,/\| home \| 66 /);
});
test("catalog hot path keeps source-visible SSR while avoiding repeated DOM scans and writes",()=>{
 const src=readFileSync(new URL("../src/components/TractorCatalog.astro",import.meta.url),"utf8");
 assert.match(src,/const labelsById = new Map<string, HTMLElement>/);
 assert.match(src,/querySelectorAll<HTMLElement>\("\[data-price-for\]"\)/);
 assert.match(src,/label: labelsById.get\(model.id\)/);
 assert.doesNotMatch(src,/CSS.escape\(model.id\)/);
 assert.match(src,/label.textContent !== next/);
 assert.match(src,/visibleCount.textContent!==countText/);
 assert.match(src,/if\(routeChanged\) history.replaceState/);
 assert.match(src,/if\(routeChanged\)window.dispatchEvent/);
 assert.match(src,/if \(card.hidden !== !match\) card.hidden = !match/);
});

test("compare's client-side model state is accepted only after loading the exact requested document",()=>{
 const expected=ROUTE_URLS.compare;
 const left="0b53e944-0ccd-4fbd-84e8-f49ffde1a2ae",right="66781999-258a-4baa-a52b-9a4f79c8b708";
 const query="?left="+left+"&right="+right;
 const report={...sample,requestedUrl:expected,mainDocumentUrl:expected,finalDisplayedUrl:expected+query};
 assert.doesNotThrow(()=>validateLiveLighthouseResult(report,"compare"));
 assert.doesNotThrow(()=>validateLiveLighthouseResult({...report,finalDisplayedUrl:expected+"?right="+right+"&left="+left},"compare"));
 for(const url of [
   expected+"?left="+left,expected+"?left="+left+"&right="+left,
   expected+query+"&left="+left,expected+query+"&utm_source=test",
   expected+query+"#anchor",expected+"?left=wrong&right="+right,
   "https://tractorvs.com/compare/"+query,"https://example.org/tr/compare/"+query
 ])assert.throws(()=>validateLiveLighthouseResult({...report,finalDisplayedUrl:url},"compare"),/Unexpected Lighthouse final URL/,url);
 assert.throws(()=>validateLiveLighthouseResult({...report,mainDocumentUrl:expected+query},"compare"),/Unexpected Lighthouse final URL/);
 assert.throws(()=>validateLiveLighthouseResult({...report,mainDocumentUrl:undefined},"compare"),/Unexpected Lighthouse final URL/);
 assert.throws(()=>validateLiveLighthouseResult({...report,requestedUrl:ROUTE_URLS.home},"compare"),/Unexpected Lighthouse final URL/);
 assert.throws(()=>validateLiveLighthouseResult({...sample,finalDisplayedUrl:ROUTE_URLS.home+query},"home"),/Unexpected Lighthouse final URL/);
});


test("static CSS and JS opportunities identify exact first-party files without adding overlapping estimates",()=>{
 const css="https://tractorvs.com/_astro/SiteLayout.abc123.css",js="https://tractorvs.com/_astro/search.def456.js";
 const audits={
  "render-blocking-resources":{details:{items:[{url:css+"?v=private-token",wastedMs:300},
   {url:"https://other.example/_astro/other.css",wastedMs:9000},
   {url:"https://tractorvs.com/api/private.js",wastedMs:9000}]}},
  "unused-css-rules":{details:{items:[{url:css,wastedBytes:8192,wastedMs:100},{url:css,wastedBytes:4096,wastedMs:150}]}},
  "unused-javascript":{details:{items:[{url:js,wastedBytes:16384,wastedMs:80},{url:js,wastedBytes:-1},{url:"not a URL",wastedBytes:3000}]}}
 };
 const items=collectStaticResourceCandidates({audits});
 assert.deepEqual(items,[
  {url:css,estimatedMaxWasteBytes:8192,estimatedMaxWasteMs:300,flags:["render-blocking-resources","unused-css-rules"]},
  {url:js,estimatedMaxWasteBytes:16384,estimatedMaxWasteMs:80,flags:["unused-javascript"]}
 ]);
 const reports=["home","advisor"].map(route=>analyzeLighthouse({...sample,audits:{...sample.audits,...audits}},route));
 assert.deepEqual(reports[0].resourceCandidates,items);
 const md=markdownReport(reports,{});
 assert.match(md,/First-party static CSS\/JS resource opportunities/);
 assert.match(md,/SiteLayout\.abc123\.css \| home, advisor \| render-blocking-resources, unused-css-rules \| 300 ms \| 8 KiB/);
 assert.doesNotMatch(md,/private-token|other\.example|api\/private|600 ms/);
 assert.deepEqual(collectStaticResourceCandidates({audits:{}}),[]);
 assert.match(markdownReport([analyzeLighthouse(sample,"home")],{}),/does not prove all resources are optimal/);
});
