import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async({page})=>{
 await page.route("**/*",route=>{
  const host=new URL(route.request().url()).hostname;
  return ["127.0.0.1","localhost"].includes(host)?route.continue():route.abort();
 });
});
test("ten brands, six sourced counts, four explicitly missing: no false 2026 numbers",async({page})=>{
 const r=await page.goto("/tr/guides/2026-2027-traktor-guvenilirlik/",{waitUntil:"domcontentloaded"});
 expect(r?.status()).toBe(200);
 await expect(page.locator("html")).toHaveAttribute("lang","tr");
 await expect(page.locator("main#main")).toHaveCount(1);
 await expect(page.locator("main main")).toHaveCount(0);
 await expect(page.locator("h1")).toHaveCount(1);
 await expect(page.locator("h1")).toContainText("2026–2027 Traktör Arıza Araştırması");
 await expect(page.locator(".research-article table")).toHaveCount(1);
 await expect(page.locator(".research-article tbody tr")).toHaveCount(10);
 await expect(page.locator(".research-article tbody tr:has-text('Doğrulanmış oran yok')")).toHaveCount(4);
 await expect(page.getByRole("region",{name:/2026–2027 için güncel doğrulama durumu/})).toHaveAttribute("tabindex","0");
 await expect(page.locator(".research-article img")).toHaveCount(10);
 for(const img of await page.locator(".research-article img").all()){
  await expect(img).toHaveAttribute("alt",/.{30,}/);
  await expect(img).toHaveAttribute("src",/^(?:\/images\/tractors\/|https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/)/);
 }
 await expect(page.locator(".research-article")).toContainText("2026–2027 yılına ait şikâyet oranları değildir");
 const res=await new AxeBuilder({page}).include(".research-shell")
 .withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
 expect(res.violations.filter(v=>["serious","critical"].includes(v.impact))).toEqual([]);
});
test("only Turkish forum shows the research feature",async({page})=>{
 await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toBeVisible();
 await page.goto("/forum/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('a[href="/tr/guides/2026-2027-traktor-guvenilirlik/"]')).toHaveCount(0);
});