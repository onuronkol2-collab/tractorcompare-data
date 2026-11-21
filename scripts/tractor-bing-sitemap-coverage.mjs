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
  if (!childUrls.includes(SITEMAPS.image) || !childUrls.includes(SITEMAPS.forum) ||
      !childUrls.some(url => /^\/sitemap-[0-9]+\.xml$/.test(new URL(url).pathname)))
    fail("Sitemap index is missing main, image or forum child file");
  const main = new Map();
  for (let i = 0; i < childUrls.length; i++) {
    if (children[i]?.url !== childUrls[i]) fail("Child sitemap URL mismatch");
    // Image and forum sitemaps are linked by the master index, but excluded
    // from the ordinary HTML page tally to prevent double-counting.
    if (childUrls[i] === SITEMAPS.image) {
      if (children[i].xml !== image) fail("Image child differs from public image sitemap");
      continue;
    }
    if (childUrls[i] === SITEMAPS.forum) {
      if (children[i].xml !== forum) fail("Forum child differs from public forum sitemap");
      continue;
    }
    const pages = parsePageSitemap(children[i].xml);
    for (const [url, lastmod] of pages) {
      if (main.has(url)) fail("Duplicate page across HTML child sitemaps");
      main.set(url, lastmod);
    }
  }
  if (main.size < minimumMainUrls)
    fail("Live main sitemap has unexpectedly few PAGE URLs: " + main.size);

  const modelUrlPattern = /^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?tractors\/[^/]+\/$/;
  const modelPages = [...main.keys()].filter(url => modelUrlPattern.test(new URL(url).pathname));
  if (modelPages.length < minimumModelUrls)
    fail("Published model URLs fell below safe coverage floor");
  // Compare *identical published model slugs* in every locale, rather than
  // merely checking at least one model per language. A partial language
  // deployment otherwise passes the aggregate minimum of 1,000 pages.
  const modelsByLocale = new Map();
  for (const locale of REQUIRED_CATALOG_LOCALES) {
    const root = ORIGIN + "/" + locale + "tractors/";
    if (!main.has(root)) fail("Missing localized crawlable catalog landing: " + root);
    const slugs = new Set(modelPages.filter(page => page.startsWith(root))
      .map(page => page.slice(root.length)));
    if (!slugs.size) fail("Missing localized model detail URLs for " + (locale || "en"));
    modelsByLocale.set(locale || "en", slugs);
  }
  const english = modelsByLocale.get("en");
  for (const [locale, models] of modelsByLocale) {
    if (models.size !== english.size ||
        [...english].some(slug => !models.has(slug))) {
      fail("Localized model slug coverage mismatch: " + locale +
        " has " + models.size + " versus English " + english.size);
    }
  }

  const imagePages = optionalPageSitemap(image, "image");
  const forumPages = optionalPageSitemap(forum, "forum");
  const union = new Set([...main.keys(), ...forumPages.keys()]);
  // Approved forum images live on moderated forum pages excluded from Astro's
  // HTML sitemap. Do not reject them as orphans; require membership in EITHER
  // the published HTML map or the separately quality-gated forum sitemap.
  for (const url of imagePages.keys())
    if (!union.has(url))
      fail("Image sitemap references a page absent from approved HTML/forum sitemaps: " + url);
  const imagesInMain = [...imagePages.keys()].filter(url => main.has(url)).length;
  const imagesInForumOnly = [...imagePages.keys()].filter(url =>
    forumPages.has(url) && !main.has(url)).length;
  return {
    child_sitemap_files: childUrls.length,
    main_page_urls: main.size,
    localized_model_page_urls: modelPages.length,
    catalog_locales: REQUIRED_CATALOG_LOCALES.length,
    models_per_locale: english.size,
    exact_model_slug_parity: true,
    image_sitemap_page_entries: imagePages.size,
    image_pages_already_in_main: imagesInMain,
    image_pages_in_approved_forum_only: imagesInForumOnly,
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

/**
 * A main push can arrive before Cloudflare publishes the new static bundle.
 * Retry ONLY the known old-index signal; never bypass live coverage gates,
 * write a search-engine notification, or treat an unrelated 404 as success.
 * Scheduled checks fail immediately. Tests inject check/sleep, so no network.
 */
export async function verifyAfterDeployment({
  check = () => checkBingSitemapCoverage(),
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  maxAttempts = 6,
  delayMs = 30_000,
  onRetry = () => {},
} = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 6)
    throw Error("Invalid sitemap verification attempt limit");
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await check(); }
    catch (error) {
      const knownDeploymentRace = String(error?.message || error)
        .includes("Sitemap index is missing main, image or forum child file");
      if (!knownDeploymentRace || attempt === maxAttempts) throw error;
      onRetry(attempt, maxAttempts, error);
      await sleep(delayMs);
    }
  }
  throw Error("Unreachable sitemap verification state");
}

export function bingCoverageMarkdown(report) {
  return [
    "## TractorVS Google/Bing unified sitemap coverage — LIVE XML, not indexing",
    "",
    "| Measured signal | Value |",
    "| --- | ---: |",
    "| Sitemap index child FILES (not pages) | " + report.child_sitemap_files + " |",
    "| Canonical HTML PAGE URLs in main child sitemaps | " + report.main_page_urls + " |",
    "| Model detail PAGE URLs across 10 languages | " + report.localized_model_page_urls + " |",
    "| Exact model slug parity across all 10 languages | " + report.exact_model_slug_parity + " |",
    "| Models per locale | " + report.models_per_locale + " |",
    "| Image sitemap page references | " + report.image_sitemap_page_entries + " |",
    "| Image page references already in main HTML | " + report.image_pages_already_in_main + " |",
    "| Image pages on approved forum only | " + report.image_pages_in_approved_forum_only + " |",
    "| Forum-only and other forum sitemap references | " + report.forum_sitemap_page_urls + " |",
    "| Distinct PAGE URLs (main + forum, deduplicated) | " + report.distinct_page_urls_across_main_and_forum + " |",
    "",
    "Image sitemap references must resolve to an approved HTML page OR a moderated forum page, and must never be added twice to a unique-page total.",
    "Bing Webmaster Tools submission/processing and indexing are **separate facts**. The index's child-file count cannot be interpreted as the number of pages Bing discovered.",
    "Actual Bing indexing requires Bing Webmaster URL Inspection; a valid sitemap and IndexNow receipt are NOT proof of indexing.",
    "",
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = process.env.GITHUB_EVENT_NAME === "push"
      ? await verifyAfterDeployment({
          onRetry: (attempt, max, error) => console.warn(
            "TRACTORVS_SITEMAP_DEPLOY_GRACE " + attempt + "/" + max +
            ": awaiting Cloudflare publish; will never bypass verification: " + String(error.message)
          ),
        })
      : await checkBingSitemapCoverage();
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
