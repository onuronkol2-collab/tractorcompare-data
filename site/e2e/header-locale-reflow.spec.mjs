import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test(`Portuguese language controls fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await page.goto("/pt-br/");
    const toggle = page.locator(".locale-menu > summary");
    await toggle.click();
    const trigger = await toggle.boundingBox();
    const panel = await page.locator(".locale-options").boundingBox();
    expect(trigger.height).toBeGreaterThanOrEqual(44);
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(width + 1);
    const signup = await page.locator(".header-signup").boundingBox();
    expect(signup.x + signup.width).toBeLessThanOrEqual(width + 1);
    await expect(page.locator(".locale-options a")).toHaveCount(10);
  });
}
