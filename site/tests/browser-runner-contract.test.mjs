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
