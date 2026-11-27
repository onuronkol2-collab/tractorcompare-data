import test from "node:test";
import assert from "node:assert/strict";
import {compactBrowserEvidence,mergeBrowserEvidence,normalizeBrowserFile} from "../scripts/browser-duration-evidence.mjs";
import {planBrowserFiles} from "../scripts/browser-duration-planner.mjs";
const meta={runId:11,attempt:1,headSha:"a".repeat(40),project:"webkit",shard:"1/2"};
const report=(id,file="a.spec.mjs")=>({errors:[],stats:{expected:1,unexpected:0,flaky:0,skipped:0},suites:[{specs:[{id,file,tests:[{projectName:"webkit",status:"expected",expectedStatus:"passed",results:[{duration:500,status:"passed"}]}]}]}]});
test("same-run shards combine whole-file timing without duplicating tests",()=>{
 const a=compactBrowserEvidence(report("id1"),meta),b=compactBrowserEvidence(report("id2"),{...meta,shard:"2/2"});
 const result=mergeBrowserEvidence([a,b]);
 assert.deepEqual(result.files,[{file:"e2e/a.spec.mjs",ms:1000,passed:2,skipped:0}]);
 assert.throws(()=>mergeBrowserEvidence([a]),/Incomplete/);
 assert.throws(()=>mergeBrowserEvidence([a,{...b,attempt:2}]),/Mixed/);
 assert.throws(()=>mergeBrowserEvidence([a,{...b,cases:a.cases}]),/Duplicate/);
});
test("bad paths, inconsistent counts, wrong project and flakes cannot become good history",()=>{
 for(const f of ["../x.spec.mjs","/etc/a.spec.mjs","site/e2e/../x.spec.mjs"])assert.throws(()=>normalizeBrowserFile(f),/Invalid/);
 const bad=report("id1");bad.stats.expected=2;assert.throws(()=>compactBrowserEvidence(bad,meta),/Incomplete/);
 assert.throws(()=>compactBrowserEvidence(report("id1"),{...meta,project:"firefox"}),/Invalid/);
 const flaky=report("id1");flaky.stats.expected=0;flaky.stats.flaky=1;flaky.suites[0].specs[0].tests[0].status="flaky";
 assert.equal(compactBrowserEvidence(flaky,meta).successful,false);
});
test("duplicate run histories cannot artificially increase sample count",()=>{
 const file="e2e/a.spec.mjs",row={runId:11,project:"webkit",successful:true,files:[{file,ms:500}]};
 assert.equal(planBrowserFiles({files:[file],history:[row,row,row],project:"webkit",shards:1}).mode,"standard-sharding");
});
