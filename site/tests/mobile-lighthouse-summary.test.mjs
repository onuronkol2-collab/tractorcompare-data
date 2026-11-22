import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeLighthouse,collectImageOptimizationCandidates,interpretCrux,markdownReport,FIELD_THRESHOLDS} from "../scripts/mobile-lighthouse-summary.mjs";

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
