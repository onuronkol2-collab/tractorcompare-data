import test from "node:test";
import assert from "node:assert/strict";
import {summarizeBrowserTiming,timingMarkdown} from "../scripts/browser-timing-summary.mjs";
const report=()=>({stats:{duration:5000,expected:1,unexpected:0,flaky:1,skipped:1},suites:[{file:"e2e/demo.spec.mjs",specs:[{title:"normal",tests:[{status:"expected",results:[{duration:100}]}]},{title:"retry | <x>",tests:[{status:"flaky",results:[{duration:200},{duration:300}]}]},{title:"not run",tests:[{status:"skipped",results:[{duration:0}]}]}]}]});
test("timing retains retries and skipped counts, sorts slow cases and escapes output",()=>{
 const s=summarizeBrowserTiming(report());assert.equal(s.retries,1);assert.equal(s.skipped,1);assert.equal(s.top[0].totalMs,500);assert.equal(s.top.length,2);
 const md=timingMarkdown(s,"webkit-shard-1");assert.ok(md.includes("0.5"));assert.ok(!md.includes("<x>"));
});
test("reject incomplete counts, invalid durations and invalid labels",()=>{
 const bad=report();bad.stats.expected=2;assert.throws(()=>summarizeBrowserTiming(bad),/Inconsistent/);
 const badDuration=report();badDuration.suites[0].specs[0].tests[0].results[0].duration=-1;assert.throws(()=>summarizeBrowserTiming(badDuration),/duration/);
 assert.throws(()=>timingMarkdown(summarizeBrowserTiming(report()),"bad\nlabel"),/label/);
});
