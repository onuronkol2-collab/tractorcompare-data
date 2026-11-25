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
  assert.match(liveQa, /if: github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/);
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
