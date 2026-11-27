// Pure fail-closed policy for the protected candidate release path.
export const REPO="onuronkol2-collab/tractorcompare-data";
export const INDEPENDENT_CONTEXT="TractorVS / independent publication evidence";
export const OLD_CONTEXT="TractorVS / verified release readiness";
const actions=15368,cf=85455,security=57789;
const wf=n=>".github/workflows/"+n+".yml";
const A=(name,path,event="pull_request")=>({name,appId:actions,path,event});
const common=[
 A("Verify AGENTS and agent instructions",wf("golden-rule-integrity")),
 A("build",wf("site-build")),
 A("verify_production",wf("tractorvs-production-release-check")),
 A("browser-smoke",wf("playwright-accessibility")),
 ...["chromium, chromium","firefox, firefox","webkit, webkit","mobile-chromium, chromium"].map(n=>A("browser-projects ("+n+")",wf("playwright-accessibility"))),
 A("tests",wf("tractorvs-sitemap-history")),
 A("preview_reconcile",wf("tractorvs-sitemap-history")),
 ...["actions","python","javascript-typescript"].map(n=>A("Analyze ("+n+")","dynamic/github-code-scanning/codeql","dynamic")),
 {name:"CodeQL",appId:security},{name:"Workers Builds: tractorvs-site",appId:cf}
];
export function requiredCandidateChecks(kind){
 if(!["catalog","forum","sitemap"].includes(kind))throw Error("Invalid candidate category");
 return [...common,...(kind==="catalog"?[A("tests",wf("tractorvs-publication-autosync"))]:kind==="forum"?[A("validate",wf("tractorvs-forum-publication-autosync"))]:[])];
}
const assert=(x,msg)=>{if(!x)throw Error(msg);};
export function assertProtectedReleaseRule(rule){
 assert(rule?.id===28247144&&rule.target==="branch"&&rule.source===REPO&&rule.enforcement==="active","Secure release ruleset is not active");
 assert(rule.bypass_actors?.length===0&&rule.conditions?.ref_name?.exclude?.length===0&&rule.conditions?.ref_name?.include?.length===1&&rule.conditions.ref_name.include[0]==="~DEFAULT_BRANCH","Unexpected branch targeting or bypass");
 const rules=rule.rules??[],status=rules.find(x=>x.type==="required_status_checks")?.parameters;
 assert(["deletion","non_fast_forward","pull_request"].every(k=>rules.some(r=>r.type===k))&&status?.strict_required_status_checks_policy===true&&status.do_not_enforce_on_create===false&&status.required_status_checks?.some(x=>x.context==="Verify AGENTS and agent instructions"&&x.integration_id===actions),"Required protection missing");
 return true;
}
const shaOk=x=>typeof x==="string"&&/^[a-f0-9]{40}$/.test(x);
export function actionRunId(c){
 const m=typeof c?.details_url==="string"&&c.details_url.match(/^https:\/\/github\.com\/onuronkol2-collab\/tractorcompare-data\/actions\/runs\/([1-9][0-9]*)\/job\/([1-9][0-9]*)$/);
 return m&&Number(m[2])===c.id&&Number.isSafeInteger(Number(m[1]))?Number(m[1]):null;
}
function runFor(c,runs){return runs.find(r=>r.id===actionRunId(c));}
function verifiedRun(c,runs,sha,path,event){
 const r=runFor(c,runs);return Boolean(r&&r.path===path&&r.event===event&&r.repository?.full_name===REPO&&r.head_repository?.full_name===REPO&&r.head_sha===sha);
}
const skips=[
 A("build_and_reconcile",wf("tractorvs-sitemap-history")),
 A("protected_candidate",wf("tractorvs-sitemap-history")),
 A("sync_public_only",wf("tractorvs-publication-autosync")),
 A("protected_candidate",wf("tractorvs-publication-autosync")),
 A("sync",wf("tractorvs-forum-publication-autosync")),
 A("protected_candidate",wf("tractorvs-forum-publication-autosync"))
];
export function trustedStatusRun(s,runs,base,path){
 if(s?.creator?.login!=="github-actions[bot]")return false;
 const m=typeof s.target_url==="string"&&s.target_url.match(/^https:\/\/github\.com\/onuronkol2-collab\/tractorcompare-data\/actions\/runs\/([1-9][0-9]*)$/);
 if(!m)return false;
 return runs.some(r=>r.id===Number(m[1])&&r.path===path&&r.repository?.full_name===REPO&&r.head_sha===base&&["pull_request_target","workflow_dispatch","workflow_run","check_run"].includes(r.event)&&r.status==="completed"&&r.conclusion==="success");
}
export function evaluateCandidateChecks({kind,sha,base,checks,statuses,runs,now=Date.now()}){
 if(!shaOk(sha)||!shaOk(base)||!Array.isArray(checks)||!Array.isArray(statuses)||!Array.isArray(runs)||checks.some(c=>c.head_sha!==sha))return {state:"failure",reason:"Invalid exact-head evidence"};
 const req=requiredCandidateChecks(kind);
 const matches=(c,r)=>c.name===r.name&&c.app?.id===r.appId&&(!r.path||verifiedRun(c,runs,sha,r.path,r.event));
 for(const r of req){
  const found=checks.filter(c=>matches(c,r));
  if(found.length!==1)return {state:found.length?"failure":"pending",reason:"Missing or ambiguous "+r.name};
  if(found[0].status!=="completed")return {state:"pending",reason:"Running "+r.name};
  if(found[0].conclusion!=="success")return {state:"failure",reason:"Required check not successful: "+r.name};
 }
 for(const c of checks){
  if(c.status!=="completed")return {state:"pending",reason:"Other check running"};
  if(c.conclusion==="success")continue;
  if(c.conclusion==="skipped"&&skips.some(r=>matches(c,r)))continue;
  return {state:"failure",reason:"Unexpected non-success check: "+c.name};
 }
 const latest=[...new Map(statuses.slice().reverse().map(s=>[s.context,s])).values()];
 for(const s of latest){
  if(s.context===OLD_CONTEXT&&s.state==="failure"&&s.description==="Outside initial automated UI scope; separate release review required"&&trustedStatusRun(s,runs,base,wf("tractorvs-release-readiness")))continue;
  if(s.state!=="success")return {state:s.state==="pending"?"pending":"failure",reason:"Non-success commit status"};
 }
 const evidence=latest.find(s=>s.context===INDEPENDENT_CONTEXT);
 if(!evidence||!trustedStatusRun(evidence,runs,base,wf("tractorvs-publication-independent-evidence")))return {state:"pending",reason:"Independent trusted evidence missing"};
 const at=Date.parse(evidence.updated_at??evidence.created_at);
 if(!Number.isFinite(at)||at>now+1000||now-at>20*60*1000)return {state:"failure",reason:"Independent evidence expired"};
 return {state:"success",reason:"Exact category checks and independent evidence verified; no merge authorization implied"};
}
