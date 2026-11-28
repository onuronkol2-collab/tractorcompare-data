import { test, expect } from "@playwright/test";
const locales = ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const localized = (locale, path) => locale === "en" ? path : "/" + locale + path;

for (const locale of locales) {
  test("decision centre routes and controls: " + locale, async ({ page }, info) => {
    test.skip(info.project.name !== "chromium" && !["tr","de","ja"].includes(locale), "Other locales covered on Chromium");
    await page.goto(localized(locale, "/"), { waitUntil: "domcontentloaded" });
    const method = page.locator(".home-source-method");
    await expect(method).toBeVisible();
    await expect(method).toHaveAttribute("href","#data");
    await expect(page.locator("#data")).toHaveCount(1);
    await expect(page.locator(".home-evidence-panel a")).toHaveAttribute("href",locale==="tr"?"/tr/methodology/":"/methodology/");
    await expect(page.locator(".home-find input[name=q]")).toBeVisible();
    await expect(page.locator(".home-find")).toHaveAttribute("action",localized(locale,"/tractors/"));
    const actions = page.locator(".home-task-panel .home-action-card");
    await expect(actions).toHaveCount(4);
    const expected = ["/tractors/","/compare/","/farm-advisor/","/guides/farm-cost-calculator/"];
    for (const [i,destination] of expected.entries()) {
      await expect(actions.nth(i)).toHaveAttribute("href",localized(locale,destination));
      await expect(actions.nth(i)).toBeVisible();
    }
    await expect(page.locator(".home-community a")).toHaveAttribute("href",localized(locale,"/forum/"));
    const size = await method.boundingBox();
    expect(size?.height ?? 0).toBeGreaterThanOrEqual(44);
    // Empty offline catalogue is valid; verify every rendered conditional link.
    const power = page.locator(".home-power-option");
    for (const link of await power.all()) {
      const href = await link.getAttribute("href");
      expect(href?.split("?")[0]).toBe(localized(locale,"/tractors/"));
      expect(["up50","p51","p101","over150"]).toContain(new URL(href,"https://example.invalid").searchParams.get("power"));
      await expect(link).toHaveAttribute("rel","nofollow");
    }
    const featured = page.locator(".home-featured-card");
    for (const card of await featured.all()) {
      const link = card.locator(".home-featured-compare");
      const href = await link.getAttribute("href");
      expect(href?.split("?")[0]).toBe(localized(locale,"/compare/"));
      expect(new URL(href,"https://example.invalid").searchParams.get("left")).toBeTruthy();
      await expect(link).toHaveAttribute("rel","nofollow");
    }
    await method.focus();
    await expect(method).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#data$/);
  });
}
