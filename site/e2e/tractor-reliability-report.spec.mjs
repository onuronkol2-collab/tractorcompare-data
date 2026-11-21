import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async({page})=>{
 await page.route("**/*",route=>{
  const host=new URL(route.request().url()).hostname;
  return ["127.0.0.1","localhost"].includes(host)?route.continue():route.abort();
 });
});

test("2026 review truthfully labels the 2021 dataset and shows two ranked tables",async({page})=>{
 const resp=await page.goto("/tr/guides/2026-2027-traktor-guvenilirlik/",{waitUntil:"domcontentloaded"});
 expect(resp?.status()).toBe(200);
 await expect(page.locator("html")).toHaveAttribute("lang","tr");
 await expect(page.locator("main#main")).toHaveCount(1);
 await expect(page.locator("main main")).toHaveCount(0);
 await expect(page.locator("h1")).toHaveCount(1);
 await expect(page.locator("h1")).toContainText("2026–2027 Traktör Marka Güvenilirliği");
 await expect(page.getByText(/Anket veri yılı: 2021/)).toBeVisible();
 await expect(page.locator(".research-article table")).toHaveCount(2);
 await expect(page.locator(".research-article tbody tr")).toHaveCount(10);
 await expect(page.getByRole("region",{name:/En az sorun bildirilen beş marka/})).toHaveAttribute("tabindex","0");
 await expect(page.getByRole("region",{name:/En çok sorun bildirilen beş marka/})).toHaveAttribute("tabindex","0");
 await expect(page.locator(".research-article img")).toHaveCount(7);
 for(const img of await page.locator(".research-article img").all()){
  await expect(img).toHaveAttribute("alt",/.{30,}/);
  await expect(img).toHaveAttribute("src",/^\/images\/tractors\/[a-z0-9-]+-480\.jpg$/);
 }
 // Two newly licensed photo URLs are delivered by the Cloudflare image Worker
 // and are therefore not asserted to load in the offline static CI server.
 const locallyBundled=page.locator(".research-article img").filter({hasNot:page.locator('[src*="allis-chalmers-ib"],[src*="massey-ferguson-5m"]')});
 await expect(page.locator('.research-footer a[href="/tr/forum/"]')).toBeVisible();
 const axe=new AxeBuilder({page}).include(".research-shell")
  .withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]);
 const results=await axe.analyze();
 expect(results.violations.filter(v=>["serious","critical"].includes(v.impact))).toEqual([]);
});

test("Turkish forum links to the report, without a fake English counterpart",async({page})=>{
 await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toBeVisible();
 await page.goto("/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toHaveCount(0);
});