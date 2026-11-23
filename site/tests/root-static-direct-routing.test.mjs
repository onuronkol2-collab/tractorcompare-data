import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path, import.meta.url),"utf8");
const parsed=(path)=>JSON.parse(read(path));
const rootConfig=JSON.parse(readFileSync(new URL("../../wrangler.jsonc",import.meta.url),"utf8"));
const siteConfig=parsed("wrangler.jsonc");

test("Cloudflare serves generated English canonical root as a static asset",()=>{
  const routes=rootConfig.assets.run_worker_first;
  assert.deepEqual(routes,siteConfig.assets.run_worker_first,
    "Cloudflare root/site configurations must have identical Worker-first routes");
  assert.equal(rootConfig.assets.directory,"./site/dist");
  assert.equal(siteConfig.assets.directory,"./dist");
  assert.equal(rootConfig.assets.binding,"ASSETS");
  assert.equal(siteConfig.assets.binding,"ASSETS");
  assert.ok(!routes.includes("/")&&!routes.includes("/*")&&!routes.includes("*"));
  assert.match(read("src/pages/index.astro"),/<HomeExperience/);
  // All dynamic/rights-sensitive routes continue to use existing Worker code.
  for(const route of [
    "/language/*","/api/visitor-country","/sitemap.xml","/images/tractors/*",
    "/yandex_6bf433db24ce4bb4.html",
    "/yandex_dd55c1f59fb67af2.html",
    "/navera11c61023793bf35184978b1fed89d2e.html"
  ]) assert.ok(routes.includes(route),"Required dynamic/proof/photo route missing: "+route);
});

test("release gate rejects future accidental Worker-first canonical root regression",()=>{
  const gate=read("scripts/production-release-gate.mjs");
  assert.match(gate,/Canonical root must use static asset-first routing/);
  assert.match(gate,/run_worker_first\?\.includes\("\/"\)/);
  const worker=read("worker/index.js");
  assert.match(worker,/return env\.ASSETS\.fetch\(request\)/,
    "Fallback remains intact for Worker invocation tests and unknown paths");
});
