import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("browser dependency installation uses a pinned LTS runner and retains all required gates",()=>{
  const source=readFileSync(new URL("../../.github/workflows/playwright-accessibility.yml",import.meta.url),"utf8");
  const matrix=source.slice(source.indexOf("  browser-projects:"),source.indexOf("  browser-smoke:"));
  assert.match(matrix,/^    runs-on: ubuntu-24\.04$/m);
  assert.doesNotMatch(matrix,/^    runs-on: ubuntu-latest$/m);
  assert.match(matrix,/fail-fast: false/);
  for(const [project,engine] of [["chromium","chromium"],["firefox","firefox"],["webkit","webkit"],["mobile-chromium","chromium"]]){
    assert.ok(matrix.includes("- project: "+project+"\n            engine: "+engine),project);
  }
  assert.match(matrix,/playwright install --with-deps "\$BROWSER_ENGINE"/);
  assert.match(matrix,/playwright test --config site\/playwright\.config\.mjs --project="\$BROWSER_PROJECT"/);
  assert.doesNotMatch(matrix,/continue-on-error:|--allow-unauthenticated|--ignore-missing/);
  assert.match(source,/needs: browser-projects/);
  assert.match(source,/test "\$MATRIX_RESULT" = success/);
});

// Check that all logical projects have exactly one complete shard partition.
test("browser matrix retains a complete partition and unique diagnostic names",()=>{
  const source=readFileSync(new URL("../../.github/workflows/playwright-accessibility.yml",import.meta.url),"utf8");
  const entries=[...source.matchAll(/- project: ([\w-]+)\n +engine: ([\w-]+)\n +shard: '(\d+)\/(\d+)'\n +evidence: ([\w-]+)/g)];
  const groups=new Map();const artifacts=new Set();
  for(const [,project,engine,index,total,evidence] of entries){
    const group=groups.get(project)||{engine,total:Number(total),indices:[]};
    assert.equal(group.engine,engine);assert.equal(group.total,Number(total));
    group.indices.push(Number(index));groups.set(project,group);
    assert.ok(!artifacts.has(evidence));artifacts.add(evidence);
  }
  assert.deepEqual([...groups.keys()].sort(),["chromium","firefox","mobile-chromium","webkit"]);
  assert.equal(groups.get("webkit").total,2);
  for(const {total,indices} of groups.values())assert.deepEqual(indices.sort((a,b)=>a-b),Array.from({length:total},(_,i)=>i+1));
  assert.ok(source.includes('--shard="$BROWSER_SHARD"'));
  assert.ok(source.includes('tractorvs-browser-smoke-artifacts-${{ matrix.evidence }}'));
  assert.match(source,/test "\$MATRIX_RESULT" = success/);
});

test("cache summary shell commands use YAML block scalars",()=>{
 for(const file of ["playwright-accessibility.yml","tractorvs-production-release-check.yml"]){
  const source=readFileSync(new URL("../../.github/workflows/"+file,import.meta.url),"utf8");
  assert.match(source,/run: \|\n\s+printf 'npm download cache hit: %s\\n'/);
  assert.doesNotMatch(source,/run: printf[^\n]*cache hit:/);
 }
});
