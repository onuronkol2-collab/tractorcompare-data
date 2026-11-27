import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifiedReleaseSha, hasReleaseSha } from "../src/lib/release-provenance.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const layout = source("../src/layouts/SiteLayout.astro");
const liveQa = source("../../.github/workflows/tractorvs-compare-live-browser-qa.yml");
const releaseGate = source("../scripts/production-release-gate.mjs");

test("only an exact public Git commit SHA is eligible for build metadata", () => {
  const sha = "a".repeat(40);
  assert.equal(verifiedReleaseSha(sha), sha);
  assert.equal(verifiedReleaseSha("  " + "F".repeat(40) + "  "), "f".repeat(40));
  for (const value of [null, undefined, "", "f".repeat(39), "f".repeat(41),
    "G".repeat(40), "<script>alert(1)</script>", sha + "\nnoindex",
    "sb_publishable_never_disclose", 10, {}]) {
    assert.equal(verifiedReleaseSha(value), null, String(value));
  }
});

test("shared Astro layout emits build-time provenance with no URL, SEO or tracker changes", () => {
  assert.match(layout, /verifiedReleaseSha\(import\.meta\.env\.WORKERS_CI_COMMIT_SHA\)/);
  assert.match(layout, /\{releaseSha && <meta name="tractorvs-release-sha" content=\{releaseSha\} \/>\}/);
  assert.match(layout, /<link rel="canonical" href=\{canonicalUrl\}/);
  assert.match(layout, /hreflang=\{alternate\.locale\}/);
  assert.doesNotMatch(layout, /<meta name="tractorvs-release-sha" content="(?:[a-f0-9]{40})"/);
});

test("live push QA requires coherent verified release provenance on both public pages", () => {
  const readiness = source("../scripts/live-release-readiness.mjs");
  assert.match(liveQa, /if: github\.event_name != 'pull_request'\s+env:\s+GITHUB_TOKEN:/);
  assert.match(liveQa, /TRACTORVS_EXACT_SNAPSHOT: "true"/g);
  assert.match(liveQa, /node site\/scripts\/live-release-readiness\.mjs "\$GITHUB_SHA" \/tr\/compare\/ \/tr\/tractors\//);
  assert.match(readiness, /releaseFromHtml\(await res\.text\(\)\)/);
  assert.match(readiness, /common&&common!==observed/);
  assert.match(readiness, /observed!==expected&&!await acceptDescendant\(expected,observed\)/);
  assert.match(readiness, /merge_base_commit\?\.sha===sha/);
  assert.match(readiness, /DEPLOYMENT_PENDING: requested release not visible; no content assertions performed/);
  assert.ok(liveQa.indexOf("node site/scripts/live-release-readiness.mjs") < liveQa.indexOf("npx playwright test"));
  assert.match(liveQa,/TRACTORVS_REQUIRE_WORKERS_BUILD: "true"/);
  assert.match(liveQa,/needs: \[release-readiness, live-browser-projects\]/);
});

test("trusted main sitemap completion supersedes only obsolete production QA", () => {
  assert.match(liveQa, /workflow_run:\s+workflows: \["TractorVS evidence-based sitemap lastmod ledger"\]\s+types: \[completed\]\s+branches: \[main\]/);
  const trusted = "github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_branch == 'main' && github.event.workflow_run.head_repository.full_name == github.repository && github.event.workflow_run.event != 'pull_request' && github.event.workflow_run.head_sha != github.sha";
  const ledger = "github.event_name == 'workflow_run' && " + trusted;
  const production = "github.event_name == 'push' || (" + ledger + ")";
  const gate = liveQa.split("  release-readiness:\n")[1].split("    runs-on:")[0];
  const aggregate = liveQa.split("  production-browser:\n")[1].split("    runs-on:")[0];
  const concurrency = liveQa.split("\nconcurrency:")[1].split("\njobs:")[0];
  const group = concurrency.split("cancel-in-progress:")[0];
  // Check the guarded ledger disjunct in both jobs and the production group;
  // formatting or explanatory comments are not eligibility conditions.
  for (const section of [gate, aggregate, group]) {
    assert.ok(section.includes("|| (" + ledger + ")"));
    assert.doesNotMatch(section, /github\.event_name != 'workflow_run'/);
  }
  assert.ok(aggregate.includes("always() && ("));
  assert.ok(group.includes("&& 'production-push-main'"));
  assert.ok(concurrency.includes("cancel-in-progress: $" + "{{ " + production + " }}"));
  assert.doesNotMatch(concurrency.split("cancel-in-progress:")[1], /check_run|issue_comment/);
  assert.match(liveQa, /permissions:\s+contents: read\s+checks: read/);
  assert.doesNotMatch(liveQa, /actions\/download-artifact|permissions:\s+write-all/);
  assert.equal((liveQa.match(/TRACTORVS_EXACT_SNAPSHOT: "true"/g) || []).length, 2, "Both exact snapshot guards must survive");
  assert.match(liveQa, /max-parallel: 2/);
  assert.match(liveQa, /test "\$RELEASE_RESULT" = success\s+test "\$MATRIX_RESULT" = success/);
});

test("production SHA comparison requires exactly one real, matching static meta tag", () => {
  const sha = "a".repeat(40);
  const valid = '<head><meta name="tractorvs-release-sha" content="' + sha + '"/></head>';
  assert.equal(hasReleaseSha(valid, sha), true);
  assert.equal(hasReleaseSha(valid.replace("/>", ">"), sha), true);
  assert.equal(hasReleaseSha(valid, "b".repeat(40)), false);
  assert.equal(hasReleaseSha(valid + valid, sha), false);
  assert.equal(hasReleaseSha(valid.replace(sha, sha.slice(0, -1)), sha), false);
  assert.equal(hasReleaseSha('<meta name="tractorvs-release-sha" content="invalid">', sha), false);
  assert.equal(hasReleaseSha(null, sha), false);
  assert.equal(hasReleaseSha(valid, null), false);
});

test("Workers production postflight verifies fixed HTML paths and fails closed", () => {
  assert.match(releaseGate, /verifyCloudflareReleaseIdentity\(env\)/);
  assert.match(releaseGate, /env\.WORKERS_CI!=="1"/);
  assert.match(releaseGate, /env\.WORKERS_CI_BRANCH==="main"/);
  assert.match(releaseGate, /verifiedReleaseSha\(env\.WORKERS_CI_COMMIT_SHA\)/);
  assert.match(releaseGate, /hasReleaseSha\(html,sha\)/);
  assert.match(releaseGate, /insist\(hasReleaseSha\(html,sha\)/);
  assert.doesNotMatch(releaseGate, /function verifyCloudflareReleaseIdentity\([^)]*dir/);
  const declared = releaseGate.match(/const pages=\[([\s\S]*?)\];/);
  assert.ok(declared, "Production page manifest is missing");
  const files = JSON.parse("[" + declared[1] + "]");
  const locales = ["en", "tr", "zh", "hi", "pt-br", "fr", "de", "ru", "ja", "es"];
  const expected = locales.flatMap((locale) => {
    const prefix = locale === "en" ? "" : locale + "/";
    return [prefix + "index.html", prefix + "tractors/index.html", prefix + "compare/index.html"];
  });
  assert.equal(files.length, 30, "No localized template can be omitted");
  assert.equal(new Set(files).size, 30, "No duplicate path can hide a missing locale");
  assert.deepEqual([...files].sort(), expected.sort());
  assert.ok(files.every((file) => !file.startsWith("/") && !file.includes("..")));
  assert.match(releaseGate, /join\(projectRoot,"dist",filename\)/);
  assert.match(releaseGate, /hasReleaseSha\(html,sha\)/);
});
