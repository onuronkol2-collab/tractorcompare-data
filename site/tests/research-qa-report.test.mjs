import test from "node:test";
import assert from "node:assert/strict";
import {verifyResearchReport} from "../scripts/verify-research-qa-report.mjs";

function fixture() {
  const langs = ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
  const projects = ["chromium","firefox","webkit","mobile-chromium"];
  return {errors: [], stats: {expected:40, skipped:0, unexpected:0, flaky:0},
    suites:[{suites:[{specs:langs.map(lang=>({
      title:"live "+lang+" licensed tractor research, technical navigation, advisor and source library",
      tests:projects.map(projectName=>({projectName,status:"expected",expectedStatus:"passed",results:[{status:"passed"}]}))
    }))}]}]};
}
test("requires actual passes for all 10 locales and 4 browsers",()=>{
  assert.deepEqual(verifyResearchReport(fixture()),{required:40,passed:40,executed:40,skipped:0,flaky:0});
});
test("rejects the former all-skipped green report and empty report",()=>{
  const r=fixture(); r.stats={expected:0,skipped:40,unexpected:0,flaky:0};
  assert.throws(()=>verifyResearchReport(r));
  assert.throws(()=>verifyResearchReport({}));
});
test("rejects missing or duplicated journeys even with apparently green totals",()=>{
  const missing=fixture(); missing.suites[0].suites[0].specs.pop(); missing.stats.expected=36;
  assert.throws(()=>verifyResearchReport(missing));
  const duplicate=fixture(); const rows=duplicate.suites[0].suites[0].specs;
  rows[9]=structuredClone(rows[0]);
  assert.throws(()=>verifyResearchReport(duplicate),/duplicate/);
});
test("rejects skipped, failed, expected-failure, flaky, and retried journeys",()=>{
  for(const status of ["skipped","unexpected","flaky"]) {
    const r=fixture(); r.suites[0].suites[0].specs[0].tests[0].status=status;
    assert.throws(()=>verifyResearchReport(r));
  }
  const r=fixture();r.suites[0].suites[0].specs[0].tests[0].expectedStatus="failed";
  assert.throws(()=>verifyResearchReport(r));
  const retry=fixture();retry.suites[0].suites[0].specs[0].tests[0].results.unshift({status:"failed"});
  assert.throws(()=>verifyResearchReport(retry));
});
test("rejects global errors and inconsistent report totals",()=>{
  const r=fixture();r.errors.push({message:"runner error"});
  assert.throws(()=>verifyResearchReport(r));
  const totals=fixture();totals.stats.expected=41;
  assert.throws(()=>verifyResearchReport(totals));
});
