import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const blockedAnalytics = /(?:google-analytics\.com|googletagmanager\.com|clarity\.ms|cloudflareinsights\.com)/i;

// Restrict browser networking to the local build. In particular no analytics
// events must be sent to GA4 / Clarity when testing consent acceptance.
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname)) {
      return route.continue();
    }
    return route.abort();
  });
});

test("Turkish and English home pages render and offer language navigation", async ({ page }) => {
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("header .brand-lockup")).toBeVisible();
  await expect(page.locator(".locale-menu")).toHaveCount(1);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", /^(en|en-US)$/);
  await expect(page.locator("main#main")).toHaveCount(1);
});

test("catalogue, comparison and forum routes expose a main landmark", async ({ page }) => {
  for (const path of ["/tr/tractors/", "/tr/compare/", "/tr/forum/"]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "HTTP route " + path).toBe(200);
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.locator("title")).not.toBeEmpty();
  }
});

test("ten localized home pages are reachable and declare their language", async ({ page }) => {
  const locales = [
    ["/", "en"], ["/tr/", "tr"], ["/de/", "de"], ["/fr/", "fr"],
    ["/es/", "es"], ["/ru/", "ru"], ["/hi/", "hi"], ["/ja/", "ja"],
    ["/zh/", "zh-Hans"], ["/pt-br/", "pt-BR"],
  ];
  for (const [path, lang] of locales) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "Locale HTTP status: " + path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
  }
});

test("mobile navigation reaches tractor comparison from the menu", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only navigation interaction");
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  const menu = page.locator("details.mobile-nav");
  await menu.locator("summary").click();
  const compareLink = menu.locator('a[href="/tr/compare/"]');
  await expect(compareLink).toBeVisible();
  await compareLink.click();
  await expect(page).toHaveURL(/\/tr\/compare\/$/);
});


test("catalogue remains crawlable while price hydration covers only source-priced models", async ({ page }) => {
  await page.goto("/tr/tractors/", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".tractor-card");
  const count = await cards.count();
  test.skip(count === 0, "Only run this regression against a configured published catalogue.");
  const data = JSON.parse(await page.locator("#catalog-price-payload").textContent() || "{}");
  expect(data.models.length).toBeLessThan(count);
  const links = await page.locator(".tractor-card-main[href^='/tr/tractors/']").count();
  expect(links).toBe(count);
  await page.locator("#tractor-search").fill("tractor-model-that-does-not-exist-99999");
  await expect(page.locator("#catalog-no-results")).toBeVisible();
  await page.locator("#tractor-search").fill("");
  await expect(page.locator("#catalog-no-results")).toBeHidden();
});

test("published ISEKI TXGS24 power summary links its exact approved source in Turkish and Chinese", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Source/translation UX is checked on Chromium desktop and mobile.");
  for(const [path,lang] of [
    ["/tr/tractors/iseki-txgs24-1d67a7d0/","tr"],
    ["/zh/tractors/iseki-txgs24-1d67a7d0/","zh-Hans"],
  ]){
    const response=await page.goto(path,{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",lang);
    const power=page.locator('.model-summary-grid [data-claim="power"]');
    await expect(power.locator("strong")).toContainText("23 HP");
    const link=power.locator("a.model-summary-power-source");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href","https://www.iseki.co.uk/wp-content/uploads/2021/02/Iseki-TXGS24-Range-WEB-2.pdf");
    await expect(link).toHaveAttribute("rel",/noopener noreferrer/);
    await expect(page.locator(".model-summary-provenance-note")).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content",/23 HP/);
  }
});

test("analytics tags are not requested without permission and remain absent after rejection", async ({ page }) => {
  const externalAnalyticsRequests = [];
  page.on("request", (request) => {
    if (blockedAnalytics.test(request.url())) externalAnalyticsRequests.push(request.url());
  });

  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  const banner = page.locator("#tractorvs-analytics-banner");
  await expect(banner).toBeVisible();
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(0);
  await expect(page.locator("script[data-tractorvs-clarity]")).toHaveCount(0);
  expect(externalAnalyticsRequests).toEqual([]);

  await page.locator("#tractorvs-analytics-reject").click();
  await expect(banner).toBeHidden();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(banner).toBeHidden();
  expect(externalAnalyticsRequests).toEqual([]);
});

test("accepted analytics can be withdrawn from footer preferences", async ({ page }) => {
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  await page.locator("#tractorvs-analytics-accept").click();
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(1);
  // All external requests are intercepted. We only verify local consent
  // behaviour; this is not a real GA4 or Clarity provider integration test.
  await page.locator("#tractorvs-analytics-settings").click();
  await expect(page.locator("#tractorvs-analytics-banner")).toBeVisible();
  await page.locator("#tractorvs-analytics-reject").click();
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(0);
});

test("axe-core first pass: no critical accessibility violations on the home page", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium", "Run axe in Chromium; functional coverage includes all browsers.");
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = report.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    targets: violation.nodes.map((node) => node.target),
    failingHtml: violation.nodes.map((node) => node.html.slice(0, 350)),
    help: violation.help,
  }));
  await testInfo.attach("axe-violations", {
    body: Buffer.from(JSON.stringify(summary, null, 2)),
    contentType: "application/json",
  });
  console.log("TractorVS axe findings: " + JSON.stringify(summary));
  const significant = report.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious");
  expect(significant, "Serious and critical accessibility violations block the quality check.").toEqual([]);
});
