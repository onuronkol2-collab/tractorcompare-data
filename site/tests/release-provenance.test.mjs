import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifiedReleaseSha,hasReleaseSha } from "../src/lib/release-provenance.mjs";

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
  assert.match(layout, /verifiedReleaseSha\(process\.env\.WORKERS_CI_COMMIT_SHA\)/);
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

test("rendered release identity is unique, exact, and fail closed",()=>{
  const sha="a".repeat(40);
  const valid='<html><head><meta name="tractorvs-release-sha" content="'+sha+'"></head></html>';
  assert.equal(hasReleaseSha(valid,sha),true);
  assert.equal(hasReleaseSha(valid.replace('>', '/>'),sha),true);
  assert.equal(hasReleaseSha(valid, "b".repeat(40)),false);
  assert.equal(hasReleaseSha(valid+valid,sha),false);
  assert.equal(hasReleaseSha('<meta name="tractorvs-release-sha" content="'+sha.slice(0,39)+'">',sha),false);
  assert.equal(hasReleaseSha('<meta name="tractorvs-release-sha" content="invalid">',sha),false);
  assert.equal(hasReleaseSha(null,sha),false);
});

test("Cloudflare main postflight blocks missing, stale or mismatched build metadata",()=>{
  assert.match(releaseGate,/env\.WORKERS_CI!=="1"\|\|env\.WORKERS_CI_BRANCH!=="main"/);
  assert.match(releaseGate,/verifyCloudflareBuildSha\(env\)/);
  assert.match(releaseGate,/hasReleaseSha\(html,sha\)/);
  for(const path of ["index.html","tr/index.html","tr/compare/index.html","tr/tractors/index.html"]){
    assert.ok(releaseGate.includes('"'+path+'"'),path);
  }
});
