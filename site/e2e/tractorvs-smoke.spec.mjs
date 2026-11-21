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
    help: violation.help,
  }));
  await testInfo.attach("axe-violations", {
    body: Buffer.from(JSON.stringify(summary, null, 2)),
    contentType: "application/json",
  });
  console.log("TractorVS axe findings: " + JSON.stringify(summary));
  const critical = report.violations.filter((violation) => violation.impact === "critical");
  expect(critical, "Critical axe violations are a build blocker; other severities are reported for remediation.").toEqual([]);
});
