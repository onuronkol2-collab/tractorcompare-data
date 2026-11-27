import {readFileSync,appendFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

const count=n=>Number.isSafeInteger(n)&&n>=0;
const duration=n=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
export function summarizeBrowserTiming(report){
  const stats=report?.stats;
  if(!stats||!["expected","unexpected","flaky","skipped"].every(k=>count(stats[k]))||!duration(stats.duration)||!Array.isArray(report.suites))throw Error("Invalid browser timing report");
  const cases=[];
  function visit(suite){
    for(const spec of suite.specs??[]){
      for(const test of spec.tests??[]){
        if(!Array.isArray(test.results))throw Error("Missing test attempts");
        const attempts=test.results;
        if(attempts.some(r=>!duration(r.duration)))throw Error("Invalid test duration");
        const totalMs=attempts.reduce((sum,r)=>sum+r.duration,0);
        cases.push({title:String(spec.title??""),file:String(spec.file??suite.file??""),project:String(test.projectName??""),totalMs,attempts:attempts.length,status:test.status});
      }
    }
    for(const child of suite.suites??[])visit(child);
  }
  report.suites.forEach(visit);
  if(cases.length!==stats.expected+stats.unexpected+stats.flaky+stats.skipped)throw Error("Inconsistent test counts");
  const sorted=cases.filter(c=>c.status!=="skipped").sort((a,b)=>b.totalMs-a.totalMs);
  return {wallMs:stats.duration,expected:stats.expected,unexpected:stats.unexpected,flaky:stats.flaky,skipped:stats.skipped,retries:cases.reduce((n,c)=>n+Math.max(0,c.attempts-1),0),top:sorted.slice(0,12)};
}
const safe=s=>String(s).replace(/[|\x00-\x1f\x7f<>]/g," ").slice(0,240);
export function timingMarkdown(summary,label){
  if(!/^[a-z0-9-]{1,60}$/.test(label))throw Error("Invalid timing label");
  const seconds=n=>(n/1000).toFixed(1);
  return ["### Browser timing: "+label,"",
    "Wall: "+seconds(summary.wallMs)+" s; expected: "+summary.expected+"; unexpected: "+summary.unexpected+"; flaky: "+summary.flaky+"; skipped: "+summary.skipped+"; retries: "+summary.retries+".","",
    "| Slow test (all attempts) | Seconds | Attempts |","|---|---:|---:|",
    ...summary.top.map(c=>"| "+safe(c.file+" — "+c.title)+" | "+seconds(c.totalMs)+" | "+c.attempts+" |"),"","Timing is diagnostic only; existing mandatory checks determine release eligibility.",""].join("\n");
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  try{
    const summary=summarizeBrowserTiming(JSON.parse(readFileSync(process.argv[2],"utf8")));
    const md=timingMarkdown(summary,process.argv[3]);
    if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+"\n");
    console.log(md);
  }catch(e){console.error("Browser timing evidence unavailable:",e.message);process.exitCode=1;}
}
