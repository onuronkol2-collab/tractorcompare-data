import {test,expect} from "@playwright/test";

test("source-backed catalogue is an accessible filterable research grid, not an advert listing",async({page})=>{
  const response=await page.goto("/tr/tractors/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const cards=page.locator(".tractor-card");
  const total=await cards.count();
  test.skip(total===0,"Offline build intentionally lacks published catalogue fixtures.");
  const sidebar=page.locator("#catalog-facet-panel");
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator("#catalog-facet-brand")).toBeVisible();
  await expect(sidebar.locator("#catalog-facet-power")).toBeVisible();
  await expect(sidebar.locator("#catalog-facet-year")).toBeVisible();
  await expect(sidebar.locator("#catalog-facet-sort")).toBeVisible();
  const originalLinks=await page.locator(".tractor-card-main[href^='/tr/tractors/']").count();
  expect(originalLinks).toBe(total);
  const brand=await sidebar.locator("#catalog-facet-brand option").nth(1).getAttribute("value");
  expect(brand).toBeTruthy();
  await page.locator("#catalog-facet-brand").selectOption(brand);
  const visible=page.locator(".tractor-card:visible");
  expect(await visible.count()).toBeGreaterThan(0);
  const publishedBrands=await visible.evaluateAll(nodes=>nodes.map(node=>node.getAttribute("data-brand")));
  expect(publishedBrands.every(value=>value===brand)).toBe(true);
  expect(new URL(page.url()).searchParams.get("brand")).toBe(brand);
  await page.locator("#catalog-facet-sort").selectOption("powerAsc");
  expect(new URL(page.url()).searchParams.get("sort")).toBe("powerAsc");
  const sorted=await visible.evaluateAll(nodes=>nodes.map(n=>({
    order:Number(n.style.order),power:n.getAttribute("data-power")
  })).sort((a,b)=>a.order-b.order));
  const verified=sorted.filter(x=>x.power!==""&&Number.isFinite(Number(x.power))).map(x=>Number(x.power));
  expect(verified).toEqual([...verified].sort((a,b)=>a-b));
  await page.locator("#catalog-facet-year").selectOption("recent");
  expect(new URL(page.url()).searchParams.get("year")).toBe("recent");
  await page.locator("#catalog-reset-facets").click();
  await expect(visible).toHaveCount(total);
  expect(new URL(page.url()).searchParams.get("brand")).toBe(null);
  expect(new URL(page.url()).searchParams.get("sort")).toBe(null);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/tr/tractors/");
  expect(await page.locator(".tractor-card-main[href^='/tr/tractors/']").count()).toBe(total);
  expect(await page.locator(".tractor-card-grid").textContent()).not.toMatch(/Satın al|Buy now|Checkout|Teklif al/i);
});

test("shared-specification research view survives reload and language navigation",async({page})=>{
  await page.goto("/tr/compare/?view=shared",{waitUntil:"domcontentloaded"});
  const shared=page.locator("#tc-shared");
  test.skip((await shared.count())===0,"Offline build intentionally lacks published comparison pairs.");
  await expect(shared).toHaveAttribute("aria-pressed","true");
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(shared).toHaveAttribute("aria-pressed","true");
  await page.locator("#tc-all").click();
  expect(new URL(page.url()).searchParams.get("view")).toBe(null);
  await shared.click();
  expect(new URL(page.url()).searchParams.get("view")).toBe("shared");
  const before=new URL(page.url());
  await page.locator(".locale-menu > summary").click();
  await page.locator('[data-language-choice][data-language-code="en"]').click();
  await expect.poll(()=>new URL(page.url()).pathname).toBe("/compare/");
  const after=new URL(page.url());
  expect(after.searchParams.get("view")).toBe("shared");
  expect(after.searchParams.get("left")).toBe(before.searchParams.get("left"));
  expect(after.searchParams.get("right")).toBe(before.searchParams.get("right"));
  await expect(page.locator("#tc-shared")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/compare/");
});
