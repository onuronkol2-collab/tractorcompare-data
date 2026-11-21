import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const yandexToken = "6bf433db24ce4bb4";
const naverToken = "535d563d03c60d4bdb37882e3454c53c2423a121";

test("Yandex verification HTML exactly matches the submitted filename and text", () => {
  const html = readFileSync(new URL(`../public/yandex_${yandexToken}.html`, import.meta.url), "utf8");
  assert.match(html, /<html>[\\s\\S]*<body>Verification: 6bf433db24ce4bb4<\\/body>[\\s\\S]*<\\/html>/);
});

test("Naver verification uses server-rendered meta in English homepage head only", () => {
  const layout = readFileSync(new URL("../src/layouts/SiteLayout.astro", import.meta.url), "utf8");
  assert.match(layout, /lang === "en" && plainPath === "\\/" && <meta name="naver-site-verification"/);
  assert.ok(layout.includes(`content="${naverToken}"`));
  assert.equal((layout.match(/name="naver-site-verification"/g) || []).length, 1);
});
