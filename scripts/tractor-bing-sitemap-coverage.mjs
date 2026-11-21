/**
 * Public, read-only TractorVS sitemap coverage guard for Bing/Yandex and GSC.
 *
 * A sitemap INDEX's <loc> entries are CHILD SITEMAP FILES, not model pages.
 * Image sitemap page URLs also appear in the main sitemap, so combining the
 * visible counts is NOT a count of distinct pages or search-engine indexing.
 * This script never submits/resubmits URLs or contacts a paid provider.
 */
import {appendFileSync, mkdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {ORIGIN, parseIndex, parsePageSitemap} from "./tractor-search-discovery.mjs";

export const SITEMAPS = Object.freeze({
  index: ORIGIN + "/sitemap-index.xml",
  image: ORIGIN + "/image-sitemap.xml",
  forum: ORIGIN + "/forum-sitemap.xml",
});
const ROBOTS_URL = ORIGIN + "/robots.txt";
const REQUIRED_CATALOG_LOCALES = ["", "tr/", "zh/", "hi/", "pt-br/", "fr/", "de/", "ru/", "ja/", "es/"];

function fail(message) {throw Error("[TractorVS sitemap coverage] " + message);}

async function liveText(url, fetchFn) {
  if (!url.startsWith(ORIGIN + "/")) fail("Unexpected external URL");
  const res = await fetchFn(url, {
    method: "GET", redirect: "error", signal: AbortSignal.timeout(20_000),
  });
  if (res.status !== 200) fail("Sitemap or robots HTTP " + res.status + " at " + url);
  if ((res.headers.get("x-robots-tag") || "").toLowerCase().includes("noindex"))
    fail("Site map response is noindex: " + url);
  const text = await res.text();
  if (text.length > 6_000_000) fail("Unexpectedly large sitemap response: " + url);
  return text;
}

function optionalPageSitemap(xml, label) {
  // A site with no approved forum topics may validly have an empty forum XML.
  if (!/<urlset(?:\s|>)/.test(xml)) fail("Invalid " + label + " XML sitemap root");
  if (!/<url>/.test(xml)) return new Map();
  return parsePageSitemap(xml);
}

export function evaluateBingSitemapCoverage({
  robots, index, children, image, forum, minimumMainUrls = 1000,
  minimumModelUrls = 1000,
}) {
  if (typeof robots !== "string" || /^Disallow:\s*\/\s*$/mi.test(robots))
    fail("robots.txt blocks crawlers or is absent");
  for (const url of Object.values(SITEMAPS))
    if (!robots.includes("Sitemap: " + url))
      fail("robots.txt does not advertise " + url);

  const childUrls = parseIndex(index);
  if (!children || !Array.isArray(children) || children.length !== childUrls.length)
    fail("Sitemap index child count is different from fetched child files");
  const main = new Map();
  for (let i = 0; i < childUrls.length; i++) {
    if (children[i]?.url !== childUrls[i]) fail("Child sitemap URL mismatch");
    const pages = parsePageSitemap(children[i].xml);
    for (const [url, lastmod] of pages) {
      if (main.has(url)) fail("Duplicate page across child sitemaps");
      main.set(url, lastmod);
    }
  }
  if (main.size < minimumMainUrls)
    fail("Live main sitemap has unexpectedly few PAGE URLs: " + main.size);

  const modelUrlPattern = /^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?tractors\/[^/]+\/$/;
  const modelPages = [...main.keys()].filter(url => modelUrlPattern.test(new URL(url).pathname));
  if (modelPages.length < minimumModelUrls)
    fail("Published model URLs fell below safe coverage floor");
  for (const locale of REQUIRED_CATALOG_LOCALES) {
    const url = ORIGIN + "/" + locale + "tractors/";
    if (!main.has(url)) fail("Missing localized crawlable catalog landing: " + url);
    if (!modelPages.some(page => new URL(page).pathname.startsWith("/" + locale + "tractors/")))
      fail("Missing localized model detail URLs for " + (locale || "en"));
  }

  const imagePages = optionalPageSitemap(image, "image");
  const forumPages = optionalPageSitemap(forum, "forum");
  // Every image page is already a canonical site page. An orphan image page
  // is a real sitemap discrepancy; image entries are NOT unique extra pages.
  for (const url of imagePages.keys())
    if (!main.has(url)) fail("Image sitemap references a page absent from main sitemap: " + url);
  const union = new Set([...main.keys(), ...forumPages.keys()]);
  return {
    child_sitemap_files: childUrls.length,
    main_page_urls: main.size,
    localized_model_page_urls: modelPages.length,
    catalog_locales: REQUIRED_CATALOG_LOCALES.length,
    image_sitemap_page_entries: imagePages.size,
    image_pages_already_in_main: imagePages.size,
    forum_sitemap_page_urls: forumPages.size,
    forum_pages_already_in_main: [...forumPages.keys()].filter(url => main.has(url)).length,
    distinct_page_urls_across_main_and_forum: union.size,
    found_in_bing_dashboard: "requires_first_party_bing_webmaster_report",
    indexed_in_bing: "unknown_without_url_inspection",
    indexed_in_google: "unknown_without_search_console",
  };
}

export async function checkBingSitemapCoverage({fetchFn = fetch, minimumMainUrls = 1000, minimumModelUrls = 1000} = {}) {
  const [robots, index, image, forum] = await Promise.all([
    liveText(ROBOTS_URL, fetchFn),
    liveText(SITEMAPS.index, fetchFn),
    liveText(SITEMAPS.image, fetchFn),
    liveText(SITEMAPS.forum, fetchFn),
  ]);
  const childUrls = parseIndex(index);
  const children = await Promise.all(childUrls.map(async url => ({
    url, xml: await liveText(url, fetchFn),
  })));
  return evaluateBingSitemapCoverage({
    robots, index, children, image, forum, minimumMainUrls, minimumModelUrls,
  });
}

export function bingCoverageMarkdown(report) {
  return [
    "## TractorVS Bing sitemap coverage — LIVE XML, not Bing indexing",
    "",
    "| Measured signal | Value |",
    "| --- | ---: |",
    "| Sitemap index child FILES (not pages) | " + report.child_sitemap_files + " |",
    "| Canonical HTML PAGE URLs in main child sitemaps | " + report.main_page_urls + " |",
    "| Model detail PAGE URLs across 10 languages | " + report.localized_model_page_urls + " |",
    "| Image sitemap page references (already in main) | " + report.image_sitemap_page_entries + " |",
    "| Forum-only and other forum sitemap references | " + report.forum_sitemap_page_urls + " |",
    "| Distinct PAGE URLs (main + forum, deduplicated) | " + report.distinct_page_urls_across_main_and_forum + " |",
    "",
    "Image sitemap references overlap with the main sitemap and must not be added to a unique-page total.",
    "Bing Webmaster Tools submission/processing and indexing are **separate facts**. The index's child-file count cannot be interpreted as the number of pages Bing discovered.",
    "Actual Bing indexing requires Bing Webmaster URL Inspection; a valid sitemap and IndexNow receipt are NOT proof of indexing.",
    "",
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = await checkBingSitemapCoverage();
    const path = resolve(".seo-discovery/bing-sitemap-coverage.json");
    mkdirSync(dirname(path), {recursive: true});
    writeFileSync(path, JSON.stringify({as_of: new Date().toISOString(), ...report}, null, 2) + "\n", "utf8");
    console.log("TRACTORVS_BING_SITEMAP_COVERAGE " + JSON.stringify(report));
    const markdown = bingCoverageMarkdown(report);
    console.log(markdown);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n");
  } catch (error) {
    console.error("TRACTORVS_BING_SITEMAP_COVERAGE_ERROR " + String(error?.message || error).slice(0, 500));
    process.exitCode = 1;
  }
}
