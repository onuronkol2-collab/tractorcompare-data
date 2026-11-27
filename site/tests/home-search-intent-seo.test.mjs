import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(siteRoot, path), "utf8");
const home = read("src/components/HomeExperience.astro");

function sourceMeta(path) {
  const page = read(path);
  const title = page.match(/seoTitle="([^"]+)"/)?.[1];
  const description = page.match(/seoDescription="([^"]+)"/)?.[1];
  assert.ok(title && description, `Explicit homepage SEO fields are required: ${path}`);
  assert.match(page, /<HomeExperience/);
  return { title, description };
}

test("English and Turkish homepage metadata describes real search, compare and advisor features", () => {
  const en = sourceMeta("src/pages/index.astro");
  const tr = sourceMeta("src/pages/tr/index.astro");
  for (const {title,description} of [en,tr]) {
    assert.ok(title.includes("TractorVS"), "Brand is retained");
    assert.ok(title.length <= 65, "Homepage title remains readable in results");
    assert.ok(description.length >= 95 && description.length <= 160,
      "Homepage description is informative without padding or truncation");
    assert.doesNotMatch(description, /\b(?:best|guarantee|guaranteed|en iyi|garanti)\b/i,
      "No unsupported promotion or rankings");
  }
  assert.match(en.title, /Tractor Specifications.*Model Comparisons/);
  assert.match(en.description, /brand and model.*compare.*selection assistant/i);
  assert.match(tr.title, /Traktör Karşılaştırma.*Teknik Özellikler/);
  assert.match(tr.description, /marka ve modele.*karşılaştırın.*seçim asistanıyla/i);
  assert.notEqual(en.title, tr.title);
  assert.match(home, /const catalogUrl = localizedPath/);
  assert.match(home, /const compareUrl = localizedPath/);
  assert.match(home, /const advisorUrl = localizedPath/);
  assert.match(home, /<SiteLayout lang=\{lang\} title=\{seoTitle\} description=\{seoDescription\} structuredData=\{homeSchema\}>/);
  assert.match(home, /description:seoDescription/);
});


test("shared homepage organization declares a stable, scalable first-party logo", () => {
  assert.match(home, /"@type":"Organization","@id":siteUrl\+"#organization"/);
  assert.match(home, /logo:new URL\("\/images\/tractorvs-organization-logo\.svg",siteUrl\)\.toString\(\)/);
  const logo = read("public/images/tractorvs-organization-logo.svg");
  const existingIcon = read("public/favicon.svg");
  assert.match(logo, /width="128" height="128" viewBox="0 0 64 64"/);
  assert.equal(logo.replace('width="128" height="128" ', ""), existingIcon,
    "Organization logo is the existing brand mark, not a tractor photograph");
});
