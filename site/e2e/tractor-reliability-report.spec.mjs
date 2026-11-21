import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Only inspect the locally built, inert static pages. No production or external tracking calls.
test.beforeEach(async ({page})=>{
 await page.route("**/*",route=>{
  const host=new URL(route.request().url()).hostname;
  return ["localhost","127.0.0.1"].includes(host)?route.continue():route.abort();
 });
});

test("research report renders as one semantic, source-linked Turkish article",async({page})=>{
 const response=await page.goto("/tr/guides/2026-2027-traktor-guvenilirlik/",{waitUntil:"domcontentloaded"});
 expect(response?.status()).toBe(200);
 await expect(page.locator("html")).toHaveAttribute("lang","tr");
 await expect(page.locator("main#main")).toHaveCount(1);
 await expect(page.locator("main main")).toHaveCount(0);
 await expect(page.locator("h1")).toHaveCount(1);
 await expect(page.locator("h1")).toContainText("2026–2027 Traktör Güvenilirlik Araştırması");
 await expect(page.locator(".research-article table")).toHaveCount(1);
 const tableRegion=page.getByRole("region",{name:/19 model için yayın dönemi/});
 await expect(tableRegion).toHaveAttribute("tabindex","0");
 await expect(page.locator(".research-article tbody tr")).toHaveCount(19);
 await expect(page.locator(".research-article figure.research-photo")).toHaveCount(2);
 for(const image of await page.locator(".research-article figure.research-photo img").all()){
   await expect(image).toHaveAttribute("alt",/.{30,}/);
   await image.scrollIntoViewIfNeeded();
   await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBeTruthy();
 }
 await expect(page.getByRole("navigation",{name:"Araştırmada hızlı gezinme"})).toBeVisible();
 expect(await page.locator(".research-article h3").count()).toBeGreaterThanOrEqual(19);
 expect(await page.locator('.research-article a[href^="https://www.profi"]').count()).toBeGreaterThanOrEqual(15);
 await expect(page.locator('.research-footer a[href="/tr/forum/"]')).toBeVisible();

 const results=await new AxeBuilder({page}).include(".research-shell")
  .withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
 expect(results.violations.filter(v=>["serious","critical"].includes(v.impact))).toEqual([]);
});

test("Turkish community links into the original full research; English is not mislabeled as translated",async({page})=>{
 await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toBeVisible();
 await page.goto("/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toHaveCount(0);
});
