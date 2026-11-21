import { test, expect } from "@playwright/test";

// Browser tests use the GitHub CI offline static build. All external provider
// requests are blocked so these tests do not track actual people or test runs.
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const target = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(target.hostname)) return route.continue();
    return route.abort();
  });
});

const scriptSelector = {
  ga: "script[data-tractorvs-ga4]",
  clarity: "script[data-tractorvs-clarity]",
  cloudflare: "script[data-tractorvs-cloudflare]",
};

async function assertProviderScripts(page, count) {
  for (const selector of Object.values(scriptSelector)) {
    await expect(page.locator(selector)).toHaveCount(count);
  }
}

test("all three analytics vendors are gated by explicit approval and can be revoked", async ({ page }) => {
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#tractorvs-analytics-banner")).toBeVisible();
  await assertProviderScripts(page, 0);

  await page.locator("#tractorvs-analytics-accept").click();
  await assertProviderScripts(page, 1);
  await expect(page.locator(scriptSelector.cloudflare)).toHaveAttribute(
    "src", "https://static.cloudflareinsights.com/beacon.min.js"
  );
  await expect(page.locator(scriptSelector.cloudflare)).toHaveAttribute(
    "data-cf-beacon", /3797c345a61a40c180b72ef3a95a23eb/
  );

  await page.locator("#tractorvs-analytics-settings").click();
  await expect(page.locator("#tractorvs-analytics-banner")).toBeVisible();
  await page.locator("#tractorvs-analytics-reject").click();
  await assertProviderScripts(page, 0);
  await expect(page.locator("#tractorvs-analytics-banner")).toBeHidden();
  await page.reload({ waitUntil: "domcontentloaded" });
  await assertProviderScripts(page, 0);
  expect(await page.evaluate(() =>
    window.localStorage.getItem("tractorvs_analytics_choice_v3")
  )).toBe("rejected");
});

test("old GA4 or Clarity approval does not silently permit Cloudflare RUM", async ({ page }) => {
  for (const previous of ["tractorvs_analytics_choice_v1", "tractorvs_analytics_choice_v2"]) {
    await page.goto("/tr/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.localStorage.clear());
    await page.evaluate((key) => window.localStorage.setItem(key, "accepted"), previous);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#tractorvs-analytics-banner")).toBeVisible();
    await assertProviderScripts(page, 0);
  }
});

test("previous rejection remains effective after consent version upgrade", async ({ page }) => {
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.setItem("tractorvs_analytics_choice_v2", "rejected"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#tractorvs-analytics-banner")).toBeHidden();
  await assertProviderScripts(page, 0);
});
