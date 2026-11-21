import test from "node:test";
import assert from "node:assert/strict";
import {analyzeLighthouse,interpretCrux,markdownReport,FIELD_THRESHOLDS} from "../scripts/mobile-lighthouse-summary.mjs";

const sample={
  finalUrl:"https://tractorvs.com/tr/",
  categories:{
    performance:{score:0.78},
    accessibility:{score:0.95,auditRefs:[{id:"color-contrast",weight:1}]},
    "best-practices":{score:1},
    seo:{score:0.98},
  },
  audits:{
    "largest-contentful-paint":{numericValue:3400},
    "cumulative-layout-shift":{numericValue:0.06},
    "total-blocking-time":{numericValue:180},
    "first-contentful-paint":{numericValue:1200},
    "color-contrast":{id:"color-contrast",score:0.4,title:"Contrast",details:{items:[]}},
    "unused-javascript":{id:"unused-javascript",score:0.3,title:"Unused JavaScript",details:{type:"opportunity",overallSavingsMs:250}},
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
