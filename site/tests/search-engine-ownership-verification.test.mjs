import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const yandexToken = "6bf433db24ce4bb4";
const naverToken = "535d563d03c60d4bdb37882e3454c53c2423a121";

test("Yandex ownership HTML contains the exact requested text and proper document structure", () => {
  const html = readFileSync(new URL(`../public/yandex_${yandexToken}.html`, import.meta.url), "utf8");
  assert.ok(html.includes("<html>") && html.includes("</html>"));
  assert.ok(html.includes(`<body>Verification: ${yandexToken}</body>`));
});

test("Yandex HTTPS property has its own exact proof file", () => {
  const httpsToken = "dd55c1f59fb67af2";
  const html = readFileSync(new URL(`../public/yandex_${httpsToken}.html`, import.meta.url), "utf8");
  assert.ok(html.includes("<html>") && html.includes("</html>"));
  assert.ok(html.includes(`<body>Verification: ${httpsToken}</body>`));
  assert.equal(html.match(/<body>/g)?.length, 1);
});

test("Naver verification file retains the exact uploaded text and the old meta tag is absent", () => {
  const filename = "navera11c61023793bf35184978b1fed89d2e.html";
  const content = readFileSync(new URL(`../public/${filename}`, import.meta.url), "utf8");
  assert.equal(content, `naver-site-verification: ${filename}`);
  const layout = readFileSync(new URL("../src/layouts/SiteLayout.astro", import.meta.url), "utf8");
  assert.ok(!layout.includes('name="naver-site-verification"'), "Old verification meta must be removed");
});
