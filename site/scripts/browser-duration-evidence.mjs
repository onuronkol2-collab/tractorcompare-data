import {readFileSync,writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
import {validFile,planBrowserFiles} from "./browser-duration-planner.mjs";
const projects=new Set(["chromium","firefox","webkit","mobile-chromium"]);
const sha=s=>typeof s==="string"&&/^[a-f0-9]{40}$/.test(s);
const pos=n=>Number.isSafeInteger(n)&&n>0;
const duration=n=>Number.isFinite(n)&&n>=0;
const identity=s=>typeof s==="string"&&/^[a-zA-Z0-9_-]{1,200}$/.test(s);

export function normalizeBrowserFile(value){
 if(typeof value!=="string")throw Error("Missing test file");
 let file=value.replaceAll("\\","/");
 if(file.startsWith("site/e2e/"))file=file.slice(5);
 else if(!file.startsWith("e2e/"))file="e2e/"+file;
 if(!validFile(file))throw Error("Invalid test path");
 return file;
}
export function compactBrowserEvidence(report,meta){
 const {runId,attempt,headSha,project,shard}=meta;
 const m=/^([1-4])\/([1-4])$/.exec(shard);
 if(!pos(runId)||!pos(attempt)||!sha(headSha)||!projects.has(project)||!m||Number(m[1])>Number(m[2]))throw Error("Invalid evidence metadata");
 const stats=report?.stats;
 if(!stats||!["expected","unexpected","flaky","skipped"].every(k=>Number.isSafeInteger(stats[k])&&stats[k]>=0)||!Array.isArray(report.suites)||!Array.isArray(report.errors))throw Error("Invalid report");
 const cases=[],ids=new Set();
 function visit(suite){
  for(const spec of suite.specs??[]){
   const file=normalizeBrowserFile(spec.file??suite.file);
   for(const t of spec.tests??[]){
    if(t.projectName!==project||!identity(spec.id)||ids.has(spec.id)||!["expected","unexpected","flaky","skipped"].includes(t.status)||!Array.isArray(t.results)||t.results.some(v=>!duration(v.duration)))throw Error("Invalid or duplicate test evidence");
    ids.add(spec.id);
    const good=t.status==="expected"&&t.expectedStatus==="passed"&&t.results.length===1&&t.results[0].status==="passed";
    // Explicit baseline skips may be represented but never count as executed.
    const skipped=t.status==="skipped"&&t.results.every(r=>r.status==="skipped");
    cases.push({id:spec.id,file,ms:t.results.reduce((sum,v)=>sum+v.duration,0),status:good?"passed":skipped?"skipped":"other"});
   }
  }
  for(const child of suite.suites??[])visit(child);
 }
 report.suites.forEach(visit);
 if(!cases.length||cases.length!==stats.expected+stats.unexpected+stats.flaky+stats.skipped)throw Error("Incomplete evidence counts");
 const successful=report.errors.length===0&&stats.unexpected===0&&stats.flaky===0&&cases.every(c=>c.status!=="other")&&cases.filter(c=>c.status==="passed").length===stats.expected&&cases.filter(c=>c.status==="skipped").length===stats.skipped&&stats.expected>0;
 return {version:1,runId,attempt,headSha,project,index:Number(m[1]),total:Number(m[2]),successful,cases};
}
// Only a complete, same-run/attempt/SHA project contributes a historical sample.
// The caller must obtain reports and successful workflow metadata from trusted
// Actions; this is advisory data, not authorization or a release status.
export function mergeBrowserEvidence(parts){
 if(!Array.isArray(parts)||!parts.length||parts.length>4)throw Error("Invalid shard set");
 const p=parts[0],indices=new Set(),ids=new Set(),files=new Map();
 if(!p||p.version!==1||!pos(p.runId)||!pos(p.attempt)||!sha(p.headSha)||!projects.has(p.project)||!pos(p.total)||p.total>4||parts.length!==p.total)throw Error("Incomplete shard set");
 for(const part of parts){
  if(part.version!==1||part.runId!==p.runId||part.attempt!==p.attempt||part.headSha!==p.headSha||part.project!==p.project||part.total!==p.total||part.successful!==true||!pos(part.index)||part.index>p.total||indices.has(part.index)||!Array.isArray(part.cases)||!part.cases.length)throw Error("Mixed, duplicate or unsuccessful shard");
  indices.add(part.index);
  for(const c of part.cases){
   if(!identity(c.id)||ids.has(c.id)||!validFile(c.file)||!duration(c.ms)||!["passed","skipped"].includes(c.status))throw Error("Duplicate or invalid case");
   ids.add(c.id);
   const row=files.get(c.file)??{file:c.file,ms:0,passed:0,skipped:0};
   if(c.status==="passed"){row.ms+=c.ms;row.passed++;}else row.skipped++;
   files.set(c.file,row);
  }
 }
 return {runId:p.runId,attempt:p.attempt,headSha:p.headSha,project:p.project,successful:true,files:[...files.values()].filter(f=>f.passed>0).sort((a,b)=>a.file.localeCompare(b.file,"en"))};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const [mode,input,output]=process.argv.slice(2);
 if(mode==="compact"){
  const meta={runId:Number(process.env.GITHUB_RUN_ID),attempt:Number(process.env.GITHUB_RUN_ATTEMPT),headSha:process.env.GITHUB_SHA,project:process.env.BROWSER_PROJECT,shard:process.env.BROWSER_SHARD};
  const result=compactBrowserEvidence(JSON.parse(readFileSync(input,"utf8")),meta);
  writeFileSync(output,JSON.stringify(result,null,2)+"\n");
 }else if(mode==="plan"){
  // Local, explicitly supplied JSON manifest; never downloads or executes a report.
  const manifest=JSON.parse(readFileSync(input,"utf8"));
  const history=manifest.runs.map(mergeBrowserEvidence);
  const plan=planBrowserFiles({files:manifest.files.map(normalizeBrowserFile),project:manifest.project,shards:manifest.shards,history});
  console.log(JSON.stringify(plan,null,2));
 }else throw Error("Expected compact or plan mode");
}
