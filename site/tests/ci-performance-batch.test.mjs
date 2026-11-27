import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {buildConcurrency} from "../scripts/build-performance-policy.mjs";
import {auditAllBuiltHtml} from "../scripts/audit-all-built-html.mjs";
import {auditBuiltImageAlts} from "../scripts/verify-sitewide-image-alts.mjs";
import {auditBuiltSeoTitles} from "../scripts/verify-sitewide-seo-titles.mjs";
import {auditBuiltMetaDescriptions} from "../scripts/verify-sitewide-meta-descriptions.mjs";
import {auditBuiltSocialMetadata} from "../scripts/verify-sitewide-social-metadata.mjs";
import {planBrowserFiles} from "../scripts/browser-duration-planner.mjs";

test("bounded renderer configuration has a serial safe default",()=>{
 assert.equal(buildConcurrency(undefined),1);assert.equal(buildConcurrency("2"),2);
 for(const x of ["0","5","2.5","NaN","-1"," 2"])assert.throws(()=>buildConcurrency(x),/1–4/);
});
test("one-pass audit yields exact independent report shapes and defects",()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-audit-parity-"));
 try{
  writeFileSync(join(dir,"index.html"),'<html><head><title>Model</title><link rel="canonical" href="https://tractorvs.com/"><meta name="description" content="Description"><meta property="og:title" content="Model"></head><body><img src="a"><img src="b" alt=""></body></html>');
  assert.deepEqual(auditAllBuiltHtml(dir),{imageAlt:auditBuiltImageAlts(dir),social:auditBuiltSocialMetadata(dir),titleAudit:auditBuiltSeoTitles(dir),metaAudit:auditBuiltMetaDescriptions(dir)});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("duration planner balances whole files and falls back for bad history",()=>{
 const files=["e2e/a.spec.mjs","e2e/b.spec.mjs","e2e/c.spec.mjs","e2e/d.spec.mjs"];
 const history=Array.from({length:3},()=>({project:"webkit",successful:true,files:files.slice(0,3).map((file,i)=>({file,ms:[10000,6000,4000][i]}))}));
 const plan=planBrowserFiles({files,history,project:"webkit"});
 assert.equal(plan.mode,"weighted-shadow");assert.deepEqual(plan.groups.flatMap(g=>g.files).sort(),files);
 assert.equal(planBrowserFiles({files,history:[],project:"webkit"}).mode,"standard-sharding");
 assert.throws(()=>planBrowserFiles({files:[files[0],files[0]],history,project:"webkit"}),/inventory/);
});

import {analyzeCiHistory} from "../scripts/ci-run-timing.mjs";
test("queue metrics do not fabricate absent runner timestamps or count cancelled runs as successes",()=>{
 const created="2026-11-27T10:00:00Z",start="2026-11-27T10:00:10Z",end="2026-11-27T10:01:00Z";
 const x=analyzeCiHistory([{id:1,status:"completed",conclusion:"success",created_at:created,run_started_at:start,updated_at:end,jobs:[{started_at:start,completed_at:end}]},{id:2,status:"completed",conclusion:"cancelled",created_at:created,run_started_at:start,updated_at:end}]);
 assert.equal(x.successful,1);assert.equal(x.wall.medianMs,60000);assert.equal(x.runs[0].jobQueueMs,null);assert.equal(x.runs[0].runnerMs,50000);
});
