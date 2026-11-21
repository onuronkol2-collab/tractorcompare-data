import { test, expect } from "@playwright/test";

// The public catalogue can be empty in offline CI builds. Inject only a
// deterministic public-model fixture in the test response before client
// hydration, so the actual browser ranking and explanatory DOM are exercised.
test("advisor shows five transparent recommendations and links to comparison", async ({ page }) => {
  await page.route("**/tr/farm-advisor/", async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const models = Array.from({ length: 7 }, (_, i) => ({
      tractor_id: "advisor-fixture-" + i,
      slug: "advisor-fixture-" + i,
      brand_name: "Test Brand",
      model_name: "Model " + (i + 1),
      variant: null,
      market: "Turkey",
      model_year: 2026,
      horsepower: 50 + i,
      facts: [{
        kind: "pto",value: "540 / 540E",unit: "rpm",
        provenance: "manufacturer",
        sourceUrl: "https://www.basaktraktor.com.tr/technical-specifications",
      }],
    }));
    const fixture = JSON.stringify({ published: models, lang: "tr" }).replace(/</g, "\\u003c");
    const pattern = /(<script\b[^>]*\bid="advisor-data"[^>]*>)[\s\S]*?(<\/script>)/;
    if (!pattern.test(source)) throw new Error("Advisor data was not serialized as expected");
    await route.fulfill({ response, body: source.replace(pattern, (_match, open, close) => open + fixture + close) });
  });

  const response = await page.goto("/tr/farm-advisor/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await page.locator('input[name="implements"][value="mower"]').check();
  await page.locator("#farm-advisor-form button[type=submit]").click();

  const results = page.locator("#advisor-results");
  await expect(results).toBeVisible();
  const cards = results.locator(".advisor-result-card");
  await expect(cards).toHaveCount(5);
  await expect(cards.first().locator(".advisor-card-reasons")).toContainText("Bu model neden listede?");
  await expect(cards.first().locator(".advisor-card-reasons")).toContainText("Kayıtlı motor gücü");
  await expect(cards.first().locator(".advisor-card-reasons")).toContainText("Katalogdaki pazar bilgisi");
  await expect(cards.first().locator(".advisor-card-evidence")).toContainText("Kayıtlı PTO devirleri");
  await expect(cards.first().locator(".advisor-card-evidence a")).toHaveAttribute("href", "https://www.basaktraktor.com.tr/technical-specifications");
  await expect(cards.first().locator(".advisor-view-model")).toHaveAttribute("href", /^\/tr\/tractors\//);
  await expect(cards.first().locator(".advisor-compare-model")).toHaveAttribute("href", /\/tr\/compare\/\?left=advisor-fixture-/);
});
