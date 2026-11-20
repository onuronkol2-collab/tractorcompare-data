// Conservative, repository-scoped research run ceiling. This limits the number of
// GitHub-dispatched research runs (not actual Gemini charges). Never infer currency spend.
export const TRUSTED_REPO = "onuronkol2-collab/tractorcompare-data";
export const WORKFLOW_NAME = "TractorVS controlled research batch";
export const DAILY_MAX_RUNS = 6;
export const MONTHLY_MAX_RUNS = 24;
export const ERROR_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const PER_PAGE = 100;

export function utcPeriod(now = new Date()) {
  const date = new Date(now);
  if (!Number.isFinite(date.getTime())) throw new Error("Valid date required.");
  const iso = date.toISOString();
  return { day: iso.slice(0, 10), month: iso.slice(0, 7), timestamp: date.getTime() };
}

// We use a stable read-only GitHub API. Never count PR unit-test runs as paid work.
export async function fetchResearchRuns({ githubToken, repo, fetchFn = fetch, now = new Date() }) {
  if (!githubToken || repo !== TRUSTED_REPO) throw new Error("Authorized GitHub repository/token required.");
  const period = utcPeriod(now);
  const params = new URLSearchParams({
    event: "workflow_dispatch",
    created: ">=" + period.month + "-01",
    per_page: String(PER_PAGE),
  });
  const response = await fetchFn("https://api.github.com/repos/" + repo +
    "/actions/runs?" + params.toString(), {
    headers: {
      Authorization: "Bearer " + githubToken,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status !== 200) throw new Error("Cannot verify GitHub run quota: HTTP " + response.status);
  const result = await response.json();
  if (!result || !Number.isSafeInteger(result.total_count) ||
      !Array.isArray(result.workflow_runs) || result.total_count < 0 ||
      result.total_count > PER_PAGE ||
      result.workflow_runs.length !== result.total_count) {
    // If there are more than 100 workflow_dispatch runs from other workflows
    // this month, stop instead of trusting an incomplete quota listing.
    throw new Error("GitHub monthly quota data incomplete: research disabled for safety.");
  }
  const runs = result.workflow_runs.filter((run) => run?.name === WORKFLOW_NAME).map((run) => ({
    id: Number(run.id),
    created_at: String(run.created_at ?? ""),
    status: String(run.status ?? ""),
    conclusion: run.conclusion == null ? null : String(run.conclusion),
  }));
  if (runs.some((run) => !Number.isSafeInteger(run.id) ||
      !Number.isFinite(Date.parse(run.created_at)) || Date.parse(run.created_at) > period.timestamp + 120_000)) {
    throw new Error("Untrustworthy GitHub run timestamps; stop safely.");
  }
  return runs.sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export function decideResearchQuota({ runs, now = new Date(), currentRunId = null, forExistingRun = false }) {
  if (!Array.isArray(runs)) throw new Error("Verified run listing is required.");
  const period = utcPeriod(now);
  const monthly = runs.filter((r) => r.created_at.startsWith(period.month + "-"));
  const daily = monthly.filter((r) => r.created_at.startsWith(period.day));
  const quotas = {
    daily: daily.length,
    monthly: monthly.length,
    daily_limit: DAILY_MAX_RUNS,
    monthly_limit: MONTHLY_MAX_RUNS,
  };
  const decision = (allowed, reason) => ({ allowed, reason, ...quotas });
  if (forExistingRun) {
    // The currently executing dispatch is already counted. Budget must
    // allow it, but no work is performed if a race already overshot a cap.
    if (!Number.isSafeInteger(Number(currentRunId)) ||
        !runs.some(r => r.id === Number(currentRunId))) {
      return decision(false, "current_dispatch_missing_from_verified_usage");
    }
    if (daily.length > DAILY_MAX_RUNS || monthly.length > MONTHLY_MAX_RUNS) {
      return decision(false, "quota_exceeded");
    }
  } else if (daily.length >= DAILY_MAX_RUNS || monthly.length >= MONTHLY_MAX_RUNS) {
    return decision(false, "quota_reached");
  }
  // No new job if another paid research run (other than self) is active.
  if (runs.some((r) => r.id !== Number(currentRunId) &&
    ["queued", "in_progress", "waiting", "pending", "requested"].includes(r.status))) {
    return decision(false, "another_research_run_active");
  }
  // Two most recent completed dispatches both failed -> wait six hours.
  // A provider/auth failure never creates an uncontrolled immediate retry loop.
  const completed = runs.filter(r => r.status === "completed").slice(0, 2);
  if (completed.length === 2 && completed.every(r => r.conclusion === "failure") &&
      period.timestamp - Date.parse(completed[0].created_at) < ERROR_COOLDOWN_MS) {
    return decision(false, "consecutive_failure_cooldown");
  }
  return decision(true, "within_conservative_run_quota");
}

export function assertTrustedScope(repo, ref) {
  if (repo !== TRUSTED_REPO || ref !== "refs/heads/main") {
    throw new Error("Automatic research only allowed in trusted repository main branch.");
  }
}
