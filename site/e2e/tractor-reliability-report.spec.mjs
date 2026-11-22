import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async({page})=>{
 await page.route("**/*",route=>{
  const host=new URL(route.request().url()).hostname;
  return ["127.0.0.1","localhost"].includes(host)?route.continue():route.abort();
 });
});

test("2026-27 tractor report shows ten independently sourced models without invented per-100 rates",async({page})=>{
 const r=await page.goto("/tr/guides/2026-2027-traktor-guvenilirlik/",{waitUntil:"domcontentloaded"});
 expect(r?.status()).toBe(200);
 await expect(page.locator("html")).toHaveAttribute("lang","tr");
 await expect(page.locator("main#main")).toHaveCount(1);
 await expect(page.locator("main main")).toHaveCount(0);
 await expect(page.locator("h1")).toHaveCount(1);
 await expect(page.locator("h1")).toContainText("2026–2027 Traktör Arıza Araştırması");
 await expect(page.locator(".research-article table")).toHaveCount(1);
 await expect(page.locator(".research-article tbody tr")).toHaveCount(10);
 await expect(page.locator(".research-article tbody tr:has-text('Veri açıklanmadı')")).toHaveCount(10);
 const grid=page.locator(".research-model-grid");
 await expect(grid.locator(".research-model-card")).toHaveCount(10);
 await expect(grid.locator("img")).toHaveCount(10);
 for(const img of await grid.locator("img").all()){
  await expect(img).toHaveAttribute("alt",/.{30,}/);
  await expect(img).toHaveAttribute("src",/^(?:\/images\/tractors\/|https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/)/);
 }
 await expect(page.locator(".research-article")).not.toContainText("Reader Insights");
 await expect(page.getByRole("region",{name:/10 traktör markasının teknik saha kanıtları/})).toHaveAttribute("tabindex","0");
 const a11y=await new AxeBuilder({page}).include(".research-shell")
  .withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
 expect(a11y.violations.filter(v=>["serious","critical"].includes(v.impact))).toEqual([]);
});

test("original Turkish forum has report feature; no fake translated English page",async({page})=>{
 await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toBeVisible();
 await page.goto("/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toHaveCount(0);
});