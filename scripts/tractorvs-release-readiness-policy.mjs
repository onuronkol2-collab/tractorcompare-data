// Advisory first-stage gate. Never grants publication or merges by itself.
export const REPO = "onuronkol2-collab/tractorcompare-data";
export const CONTEXT = "TractorVS / verified release readiness";
export const REQUIRED = [
  ["Verify AGENTS and agent instructions","github-actions"],
  ["build","github-actions"],
  ["verify_production","github-actions"],
  ["browser-smoke","github-actions"],
  ["browser-projects (chromium, chromium, 1/1, chromium)","github-actions"],
  ["browser-projects (firefox, firefox, 1/1, firefox)","github-actions"],
  ["browser-projects (webkit, webkit, 1/2, webkit-shard-1)","github-actions"],
  ["browser-projects (webkit, webkit, 2/2, webkit-shard-2)","github-actions"],
  ["browser-projects (mobile-chromium, chromium, 1/1, mobile-chromium)","github-actions"],
  ["preview_reconcile","github-actions"],
  ["CodeQL","github-advanced-security"],
  ["Analyze (actions)","github-actions"],
  ["Analyze (python)","github-actions"],
  ["Analyze (javascript-typescript)","github-actions"],
  ["Workers Builds: tractorvs-site","cloudflare-workers-and-pages"],
];
export const validSha = sha => typeof sha === "string" && /^[0-9a-f]{40}$/.test(sha);
export function eligible(pr, files) {
  if (pr.state !== "open" || pr.draft || pr.base?.ref !== "main" ||
      pr.head?.repo?.full_name !== REPO || pr.base?.repo?.full_name !== REPO ||
      pr.user?.login !== "onuronkol2-collab" || !validSha(pr.head?.sha)) return false;
  // Deliberately narrow initial scope: application UI, not data, photos, auth,
  // moderation, infrastructure, workflows, legal or security approvals.
  if (/^(qa|research|photos|dependabot)\//i.test(pr.head.ref ?? "") ||
      /\b(qa only|research only|draft|security|privacy|auth|photo|licen[cs]e|forum|catalogue|catalog|migration|translation)\b/i.test(pr.title ?? "")) return false;
  if (!Array.isArray(files) || !files.some(f => /^site\/src\//.test(f.filename))) return false;
  return files.every(f => f.status !== "renamed" && f.status !== "removed" &&
    /^(site\/src\/(components|pages|layouts|styles|lib)\/|site\/(e2e|tests|docs)\/)/.test(f.filename) &&
    !/(auth|consent|analytic|security|privacy|photo|image|forum|supabase|catalog|translation|license|legal|moderation|release|sitemap|robots|canonical|indexnow|payment|secret|token)/i.test(f.filename));
}
// Exclude only this advisory workflow's own verified job from its inputs.
// A job name or GitHub Actions app slug alone is not proof of origin.
export const READINESS_WORKFLOW = ".github/workflows/tractorvs-release-readiness.yml";
export function readinessRunId(check) {
  if (check?.name !== "readiness" || check.app?.slug !== "github-actions" ||
      !Number.isSafeInteger(check.id) || typeof check.details_url !== "string") return null;
  const match = check.details_url.match(/^https:\/\/github\.com\/onuronkol2-collab\/tractorcompare-data\/actions\/runs\/([1-9][0-9]*)\/job\/([1-9][0-9]*)$/);
  if (!match || Number(match[2]) !== check.id) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}
export function isOwnAdvisoryCheck(check, sha, runs) {
  const id = readinessRunId(check);
  return id !== null && check.head_sha === sha && Array.isArray(runs) &&
    runs.some(run => run.id === id && run.path === READINESS_WORKFLOW &&
      run.repository?.full_name === REPO && run.head_repository?.full_name === REPO &&
      run.head_sha === sha && ["pull_request_target","workflow_run","check_run","workflow_dispatch"].includes(run.event));
}

export function evaluate({sha,checks,statuses,advisoryRuns=[]}) {
  if (!validSha(sha) || !Array.isArray(checks) || !Array.isArray(statuses)) return {state:"failure",reason:"invalid evidence"};
  if (checks.some(c=>c.head_sha!==sha)) return {state:"failure",reason:"wrong SHA in check list"};
  checks=checks.filter(c=>!isOwnAdvisoryCheck(c,sha,advisoryRuns));
  for (const [name,app] of REQUIRED) {
    const matches=checks.filter(c=>c.name===name && c.app?.slug===app && c.head_sha===sha);
    if (matches.length>1) return {state:"failure",reason:"ambiguous check: "+name};
    if (matches.length===1 && matches[0].status==="completed" && matches[0].conclusion!=="success")
      return {state:"failure",reason:"required check failed: "+name};
  }
  for (const c of checks) {
    if (c.head_sha!==sha) return {state:"failure",reason:"wrong SHA in check list"};
    if (c.status!=="completed") continue;
    if (c.conclusion==="success") continue;
    // Main-only ledger writer is intentionally skipped in a PR; its
    // independent preview_reconcile check above must actually pass.
    if (c.name==="build_and_reconcile" && c.app?.slug==="github-actions" && c.conclusion==="skipped") continue;
    return {state:"failure",reason:"non-success check: "+c.name};
  }
  const other=statuses.filter(s=>s.context!==CONTEXT);
  if (other.some(s=>["error","failure"].includes(s.state))) return {state:"failure",reason:"commit status failed"};
  if (other.some(s=>s.state!=="success") || checks.some(c=>c.status!=="completed")) return {state:"pending",reason:"checks running"};
  for (const [name,app] of REQUIRED) {
    if (!checks.some(c=>c.name===name && c.app?.slug===app && c.head_sha===sha && c.status==="completed" && c.conclusion==="success"))
      return {state:"pending",reason:"missing check: "+name};
  }
  return {state:"success",reason:"exact SHA checks passed; independent publication authorization required"};
}

 // Completion events may be absent, ambiguous, stale or foreign. Never infer
 // a PR from a branch name or accept a check's conclusion as release evidence.
export function completionCandidate(event) {
  const run=event?.workflow_run ?? event?.check_run;
  if(!run) return null;
  if(event.workflow_run && (run.event!=="pull_request" || run.head_repository?.full_name!==REPO)) return null;
  if(event.check_run && (run.app?.slug!=="cloudflare-workers-and-pages" || run.name!=="Workers Builds: tractorvs-site")) return null;
  if(!validSha(run.head_sha) || !Array.isArray(run.pull_requests) || run.pull_requests.length!==1) return null;
  const number=run.pull_requests[0]?.number;
  return Number.isSafeInteger(number)&&number>0?{number,sha:run.head_sha}:null;
}
