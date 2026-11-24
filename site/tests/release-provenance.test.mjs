import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifiedReleaseSha } from "../src/lib/release-provenance.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const layout = source("../src/layouts/SiteLayout.astro");
const liveQa = source("../../.github/workflows/tractorvs-compare-live-browser-qa.yml");

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

test("live push QA waits for its exact deployed SHA on both public pages", () => {
  assert.match(liveQa, /if: github\.event_name == 'push'/);
  assert.match(liveQa, /grep -Fq "name=\\\"tractorvs-release-sha\\\" content=\\\"\$\{GITHUB_SHA\}\\\"" \/tmp\/tractorvs-compare-live\.html/);
  assert.match(liveQa, /grep -Fq "name=\\\"tractorvs-release-sha\\\" content=\\\"\$\{GITHUB_SHA\}\\\"" \/tmp\/tractorvs-catalog-live\.html/);
  assert.match(liveQa, /if github\.event_name == 'push'|github\.event_name == 'push'/);
  assert.match(liveQa, /No live test result|Do not claim that the new release passed live QA/);
});
