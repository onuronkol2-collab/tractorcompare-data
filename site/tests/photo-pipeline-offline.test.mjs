import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";

test("real research scripts share one offline Commons brand scan and include newly published model",{
  timeout:90000
},()=>{
  const tmp=mkdtempSync(join(tmpdir(),"tractorvs-photo-joined-"));
  const scripts=fileURLToPath(new URL("../scripts/",import.meta.url));
  const preloader=fileURLToPath(new URL("./fixtures/photo-offline-fetch.mjs",import.meta.url));
  const folder=join(tmp,"photo-discovery-report");
  try{
    mkdirSync(folder,{recursive:true});
    writeFileSync(join(folder,"archived-tractor-models.json"),JSON.stringify([
      {brand:"Zetor",model:"MAJOR"},
      {brand:"Kubota",model:"M5-112"}
    ]));
    const env={...process.env,TRACTORVS_URL:"https://tractorvs.com",
      TRACTOR_IMAGE_REPORT_DIR:folder};
    for(const [script,args] of [
      ["batch-photo-discovery.mjs",["--inventory-only"]],
      ["archive-brand-photo-discovery.mjs",[]],
      ["batch-photo-discovery.mjs",[]]
    ]){
      const run=spawnSync(process.execPath,["--import",preloader,join(scripts,script),...args],{
        cwd:tmp,env,timeout:30000,encoding:"utf8"
      });
      assert.equal(run.status,0,script+" failed: "+
        (run.stderr||"").slice(-1000)+"\n"+(run.stdout||"").slice(-700));
    }
    const preflight=JSON.parse(readFileSync(join(folder,"published-model-inventory.json"),"utf8"));
    const archived=JSON.parse(readFileSync(join(folder,"archived-image-candidates.json"),"utf8"));
    const publicCandidates=JSON.parse(readFileSync(join(folder,"public-image-candidates.json"),"utf8"));
    const report=JSON.parse(readFileSync(join(folder,"report.json"),"utf8"));
    assert.equal(preflight.length,3);
    assert.equal(archived.modelCount,2,"historical count must not be rewritten");
    assert.equal(publicCandidates.modelCount,3,"newly published Zetor PROXIMA must be included");
    assert.equal(report.runStatus,"complete");
    assert.equal(report.publicModelPages,3);
    assert.equal(report.modelSearches,3);
    assert.equal(report.models.length,3);
    const proxima=report.models.find(x=>x.brand==="Zetor"&&x.model==="PROXIMA");
    assert.ok(proxima,"new current model absent in archive must still be researched");
    assert.equal(proxima.candidates.length,1);
    assert.equal(proxima.candidates[0].reviewStatus,"human_review_required");
    assert.match(report.note,/NOT exhaustive/);
    assert.ok(report.models.every(x=>!x.error && x.status==="published"));
  }finally{rmSync(tmp,{recursive:true,force:true});}
});
