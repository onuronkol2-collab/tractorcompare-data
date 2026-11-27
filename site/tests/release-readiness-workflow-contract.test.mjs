import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=n=>readFileSync(new URL("../../.github/workflows/"+n+".yml",import.meta.url),"utf8");
test("trusted event main SHA, never historical PR payload or candidate code",()=>{
 const w=read("tractorvs-release-readiness");
 assert.ok(w.includes("github.ref == 'refs/heads/main' && ("));
 assert.ok(w.includes('ref: ${{ github.sha }}'));
 assert.doesNotMatch(w,/ref:\s*[^\n]*github\.event\.pull_request\.(base|head)\.sha/);
 assert.ok(w.includes("persist-credentials: false"));
 assert.ok(w.includes('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"'));
 assert.ok(w.indexOf("Verify trusted event checkout")<w.indexOf("Evaluate exact current SHA from trusted base"));
});
test("candidate snapshots trigger their own PR checks without enabling scheduled PR writes",()=>{
 for(const [name,path] of [["tractorvs-publication-autosync","site/src/data/public-catalog-sync.json"],["tractorvs-forum-publication-autosync","site/src/data/public-forum-sync.json"]]){
  const w=read(name),pr=w.split("  pull_request:\n")[1].split("  workflow_dispatch:")[0];
  assert.ok(pr.includes(path));assert.ok(pr.includes("scripts/tractorvs-publication-candidate.mjs"));
  assert.ok(w.includes("github.event_name != 'pull_request'"));
 }
 const w=read("tractorvs-sitemap-history"),pr=w.split("  pull_request:\n")[1].split("\nconcurrency:")[0];
 assert.ok(pr.includes("seo/sitemap-content-history.json"));
 assert.ok(!pr.includes("!site/src/data/sitemap-lastmod.json"));
 assert.ok(w.includes('git diff --exit-code HEAD -- seo/sitemap-content-history.json site/src/data/sitemap-lastmod.json'));
 assert.ok(w.split("  push:\n")[1].split("  pull_request:")[0].includes("!site/src/data/sitemap-lastmod.json"));
});
