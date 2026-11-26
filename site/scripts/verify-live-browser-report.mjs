import {readFileSync,appendFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
const projects=["chromium","firefox","webkit","mobile-chromium"];
// #739 calculator coverage: 53 cases per project, 21 run on PR and 32 intentionally
// deferred until release. A new test may raise coverage, never silently lower it.
export function verifyLiveBrowserReport(report,project,predeploy=false){
 if(!projects.includes(project)||typeof predeploy!=="boolean")throw Error("Invalid project scope");
 const stats=report?.stats;
 if(!stats||!Number.isInteger(stats.expected)||!Number.isInteger(stats.skipped)||
    stats.unexpected!==0||stats.flaky!==0||!Array.isArray(report.suites)||
    !Array.isArray(report.errors)||report.errors.length)throw Error("Incomplete, failed or flaky browser report");
 let passed=0,skipped=0;
 const seen=new Set();
 function visit(suite){
  for(const spec of suite.specs??[]){
   if(!Array.isArray(spec.tests)||spec.tests.length!==1||typeof spec.title!=="string")throw Error("Missing or duplicate test evidence");
   const test=spec.tests[0];
   if(test.projectName!==project||seen.has(spec.title))throw Error("Unexpected browser or duplicate test: "+spec.title);
   seen.add(spec.title);
   if(test.status==="skipped"){
    const known=/^live [a-z-]+ (language switch retains|research sidebar filters|shared technical view remains)/.test(spec.title)||
      spec.title==="live mobile comparison announces loading, recovers from a failed request and preserves citations"||
      spec.title==="live different-entry view and empty catalogue reset survive real user interactions";
    if(!predeploy||!known)throw Error("Unexpected skipped test: "+spec.title);
    skipped++;continue;
   }
   if(test.status!=="expected"||test.expectedStatus!=="passed"||!Array.isArray(test.results)||
      test.results.length!==1||test.results[0].status!=="passed")throw Error("Non-passing or retried test: "+spec.title);
   passed++;
  }
  for(const child of suite.suites??[])visit(child);
 }
 report.suites.forEach(visit);
 const farmLocales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 if(farmLocales.some(lang=>!seen.has("live farm tools "+lang+" calculation and local shortlist")))throw Error("Missing localized farm tool evidence");
 if(passed!==stats.expected||skipped!==stats.skipped||passed+skipped<53||
    (predeploy?(passed<21||skipped!==32):(passed<53||skipped!==0)))throw Error("Missing or inconsistent execution evidence");
 if(!Number.isFinite(stats.duration)||stats.duration<0)throw Error("Missing duration evidence");
 return {project,scope:predeploy?"predeployment":"production",passed,skipped,flaky:0,durationMs:stats.duration};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const flag=process.argv[4];
  if(!["true","false"].includes(flag))throw Error("Invalid predeployment flag");
  const result=verifyLiveBrowserReport(JSON.parse(readFileSync(process.argv[2],"utf8")),process.argv[3],flag==="true");
  console.log("TRACTORVS_LIVE_BROWSER_EVIDENCE "+JSON.stringify(result));
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
   "### "+result.project+" ("+result.scope+")\nPassed: "+result.passed+"; skipped: "+result.skipped+"; flaky: 0; duration: "+Math.round(result.durationMs/1000)+" s.\n");
 }catch(error){console.error("Live browser execution evidence rejected: "+error.message);process.exitCode=1;}
}
