// Advisory first-stage gate. Never grants publication or merges by itself.
export const REPO = "onuronkol2-collab/tractorcompare-data";
export const CONTEXT = "TractorVS / verified release readiness";
export const REQUIRED = [
  ["Verify AGENTS and agent instructions","github-actions"],
  ["build","github-actions"],
  ["verify_production","github-actions"],
  ["browser-smoke","github-actions"],
  ["browser-projects (chromium, chromium)","github-actions"],
  ["browser-projects (firefox, firefox)","github-actions"],
  ["browser-projects (webkit, webkit)","github-actions"],
  ["browser-projects (mobile-chromium, chromium)","github-actions"],
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
export function evaluate({sha,checks,statuses}) {
  if (!validSha(sha) || !Array.isArray(checks) || !Array.isArray(statuses)) return {state:"failure",reason:"invalid evidence"};
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
