import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyLiveBrowserReport} from "../scripts/verify-live-browser-report.mjs";
const project="chromium";
const spec=(title,skip=false)=>({title,tests:[{projectName:project,status:skip?"skipped":"expected",expectedStatus:skip?"skipped":"passed",results:[{status:skip?"skipped":"passed"}]}]});
const report=(pre=false)=>{
 const specs=Array.from({length:pre?11:43},(_,i)=>spec("passing case "+i));
 for(const lang of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"])specs.push(spec("live farm tools "+lang+" calculation and local shortlist"));
 if(pre){
  for(const lang of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"])
   for(const name of ["language switch retains","research sidebar filters","shared technical view remains"])specs.push(spec("live "+lang+" "+name,true));
  specs.push(spec("live mobile comparison announces loading, recovers from a failed request and preserves citations",true),spec("live different-entry view and empty catalogue reset survive real user interactions",true));
 }
 return {stats:{expected:pre?21:53,skipped:pre?32:0,unexpected:0,flaky:0,duration:1234},errors:[],suites:[{specs}]};
};
test("complete per-browser production and explicit baseline evidence accepted",()=>{
 assert.equal(verifyLiveBrowserReport(report(),project).passed,53);
 assert.equal(verifyLiveBrowserReport(report(true),project,true).skipped,32);
});
test("production skip, flaky, missing, wrong browser and retried tests fail closed",()=>{
 assert.throws(()=>verifyLiveBrowserReport(report(true),project),/skipped/);
 for(const mutate of [r=>r.stats.flaky=1,r=>r.suites[0].specs.pop(),r=>r.suites[0].specs[0].tests[0].projectName="firefox",r=>r.suites[0].specs[0].tests[0].results.push({status:"passed"}),r=>r.errors.push({message:"error"})]){
  const r=report();mutate(r);assert.throws(()=>verifyLiveBrowserReport(r,project));
 }
 const r=report(true);r.suites[0].specs[21].title="unapproved skip";assert.throws(()=>verifyLiveBrowserReport(r,project,true),/Unexpected skipped/);
});
test("live workflow has bounded parallelism, all four projects, common gate, evidence and stable aggregate",()=>{
 const w=readFileSync(new URL("../../.github/workflows/tractorvs-compare-live-browser-qa.yml",import.meta.url),"utf8");
 assert.match(w,/max-parallel: 2/);
 assert.match(w,/fail-fast: false/);
 for(const p of ["chromium","firefox","webkit","mobile-chromium"])assert.ok(w.includes("- project: "+p));
 assert.match(w,/needs: release-readiness/);
 assert.match(w,/production-browser:\n/);
 assert.match(w,/needs: \[release-readiness, live-browser-projects\]/);
 assert.match(w,/verify-live-browser-report\.mjs/);
 assert.match(w,/TRACTORVS_EXACT_SNAPSHOT: "true"/);
 assert.equal((w.match(/TRACTORVS_EXACT_SNAPSHOT: "true"/g)||[]).length,2);
 assert.match(w,/test "\$MATRIX_RESULT" = success/);
 assert.doesNotMatch(w,/continue-on-error:/);
 assert.match(w,/\n        env:\n          PLAYWRIGHT_JSON_OUTPUT_FILE: \$\{\{ runner\.temp \}\}/);
 assert.doesNotMatch(w,/\n      PLAYWRIGHT_JSON_OUTPUT_FILE:/);
});
