import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// Astro copies public assets as-is. The source file is the editorial decision to publish.
export function verifyCrawlerGuide(sourcePath, builtPath) {
  const published = existsSync(sourcePath);
  assert.equal(existsSync(builtPath), published, published
    ? "Declared llms.txt is missing from the build"
    : "Stale llms.txt in the build without a published source");
  if (!published) return;

  const guide = readFileSync(builtPath, "utf8");
  assert.ok(guide === readFileSync(sourcePath, "utf8"), "Built llms.txt differs from its source");
  for (const required of [
    "TractorVS — tractor specifications",
    "optional navigation aid",
    "article index have ten language versions",
    "four other long technical articles currently have English and Turkish text only",
    "https://tractorvs.com/methodology/",
    "https://tractorvs.com/sitemap-index.xml",
    "https://tractorvs.com/articles/",
    "https://tractorvs.com/tr/articles/",
    "https://tractorvs.com/guides/choosing-a-tractor/",
    "https://tractorvs.com/reviews/basak-2075-bk/",
  ]) {
    assert.ok(guide.includes(required), `Missing from llms.txt: ${required}`);
  }
  assert.doesNotMatch(guide, /draft\/tractor|AggregateRating|Guaranteed AI ranking/i);
}
