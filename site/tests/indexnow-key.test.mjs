import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const key = "e4b1594b38e2465b9659c00b778571a5";

test("IndexNow key is served as a plain UTF-8 file at the site root", () => {
  const content = readFileSync(new URL(`../public/${key}.txt`, import.meta.url), "utf8");
  assert.equal(content, key, "Key file must contain exactly the IndexNow key with no HTML, BOM or whitespace");
});
