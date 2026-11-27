import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fingerprintBuild,compareBuildFingerprints} from "../scripts/build-output-fingerprint.mjs";
import {resourceSnapshot} from "../scripts/build-resource-profile.mjs";
test("fingerprint detects changed bytes, missing and additional outputs without reusing content",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-fingerprint-"));
 try{
  writeFileSync(join(dir,"index.html"),"abc");
  mkdirSync(join(dir,"tr"));writeFileSync(join(dir,"tr","index.html"),"def");
  const first=await fingerprintBuild(dir);
  assert.equal(first.files,2);assert.equal(first.bytes,6);
  assert.equal(compareBuildFingerprints(first,await fingerprintBuild(dir)).identical,true);
  writeFileSync(join(dir,"index.html"),"xyz");rmSync(join(dir,"tr"),{recursive:true});writeFileSync(join(dir,"robots.txt"),"noindex");
  const diff=compareBuildFingerprints(first,await fingerprintBuild(dir));
  assert.deepEqual(diff,{identical:false,missing:["tr/index.html"],extra:["robots.txt"],changed:["index.html"]});
  symlinkSync(join(dir,"index.html"),join(dir,"alias.html"));
  await assert.rejects(fingerprintBuild(dir),/symlinks/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("resource snapshot has explicit units and process-local accounting",()=>{
 const fake={resourceUsage:()=>({userCPUTime:12,systemCPUTime:4,maxRSS:1024}),memoryUsage:()=>({rss:2048,heapUsed:512})};
 assert.deepEqual(resourceSnapshot(fake),{cpuUserUs:12,cpuSystemUs:4,peakRssKiB:1024,rssBytes:2048,heapUsedBytes:512});
});
