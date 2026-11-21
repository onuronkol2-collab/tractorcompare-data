import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import worker from "../worker/index.js";

const proofs = [
  ["6bf433db24ce4bb4", "https://tractorvs.com/yandex_6bf433db24ce4bb4.html"],
  ["dd55c1f59fb67af2", "https://tractorvs.com/yandex_dd55c1f59fb67af2.html"],
];

test("both Worker configurations route exact Yandex HTML proof URLs first, with no global HTML routing change", () => {
  for (const path of ["../../wrangler.jsonc", "../wrangler.jsonc"]) {
    const config = JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
    assert.equal(config.assets.html_handling, undefined);
    for (const [token] of proofs)
      assert.ok(config.assets.run_worker_first.includes(`/yandex_${token}.html`), path);
  }
});

for (const [token, url] of proofs) {
  test(`Yandex proof ${token} serves uploaded HTML at the exact URL with HTTP 200 and no redirect`, async () => {
    const html = readFileSync(new URL(`../public/yandex_${token}.html`, import.meta.url), "utf8");
    const env = {ASSETS: {fetch: async (req) => {
      assert.equal(new URL(req.url).pathname, `/yandex_${token}`);
      assert.equal(req.method, "GET");
      return new Response(html, {status:200});
    }}};
    const result = await worker.fetch(new Request(url), env);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("Location"), null);
    assert.match(result.headers.get("Content-Type"), /text\/html/i);
    assert.equal(await result.text(), html);
    const head = await worker.fetch(new Request(url, {method:"HEAD"}), env);
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    const post = await worker.fetch(new Request(url, {method:"POST"}), env);
    assert.equal(post.status, 405);
  });
}

test("Naver HTML verification responds with exact uploaded text at unchanged URL", async () => {
  const filename = "navera11c61023793bf35184978b1fed89d2e.html";
  const url = `https://tractorvs.com/${filename}`;
  const originalContent = readFileSync(new URL(`../public/${filename}`, import.meta.url), "utf8");
  const env = {ASSETS: {fetch: async (req) => {
    assert.equal(new URL(req.url).pathname, `/${filename.slice(0, -".html".length)}`);
    assert.equal(req.method, "GET");
    return new Response(originalContent, {status:200});
  }}};
  const cfgs = ["../../wrangler.jsonc", "../wrangler.jsonc"];
  for (const path of cfgs) {
    const cfg = JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
    assert.ok(cfg.assets.run_worker_first.includes(`/${filename}`), path);
    assert.equal(cfg.assets.html_handling, undefined);
  }
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Location"), null);
  assert.equal(await response.text(), originalContent);
  const head = await worker.fetch(new Request(url, {method:"HEAD"}), env);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const disallowed = await worker.fetch(new Request(url, {method:"POST"}), env);
  assert.equal(disallowed.status, 405);
  const missing = await worker.fetch(new Request(url), {ASSETS:{fetch:async()=>new Response("missing",{status:404})}});
  assert.equal(missing.status, 503);
});

test("Yandex proof responds fail-closed when Cloudflare static asset is missing", async () => {
  const env={ASSETS:{fetch:async ()=>new Response("missing", {status:404})}};
  const result=await worker.fetch(new Request(proofs[1][1]), env);
  assert.equal(result.status, 503);
  assert.notEqual(result.status, 200);
});
