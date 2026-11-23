import {test,expect} from "@playwright/test";

const noDocumentOverflow = async page => page.evaluate(() =>
  document.documentElement.scrollWidth <= innerWidth + 2);

for(const width of [320,390,768]){
  test(`catalogue filter controls retain a usable grid at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:800});
    const response=await page.goto("/tr/tractors/",{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    const panel=page.locator("#catalog-facet-panel");
    test.skip(!(await panel.isVisible()),"No published catalogue fixture in the inert local build.");
    const grid=page.locator(".catalog-facet-fields");
    const cols=await grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
    expect(cols).toBe(width===320?1:2);
    for(const control of ["#catalog-facet-brand","#catalog-facet-power","#catalog-facet-year","#catalog-facet-sort"]){
      const node=page.locator(control);
      await expect(node).toBeVisible();
      const metrics=await node.evaluate(el=>{const s=getComputedStyle(el);return {font:parseFloat(s.fontSize),height:el.getBoundingClientRect().height};});
      expect(metrics.font).toBeGreaterThanOrEqual(16);
      expect(metrics.height).toBeGreaterThanOrEqual(44);
    }
    const country=page.locator("#catalog-price-country");
    await expect(country).toBeVisible();
    expect(await country.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await noDocumentOverflow(page)).toBe(true);
  });
}
test("catalogue filter selection preserves canonical and visible published model links",async({page})=>{
  await page.setViewportSize({width:390,height:800});
  await page.goto("/tr/tractors/",{waitUntil:"domcontentloaded"});
  const panel=page.locator("#catalog-facet-panel");
  test.skip(!(await panel.isVisible()),"No published catalogue fixture in the inert local build.");
  const options=page.locator("#catalog-facet-brand option");
  test.skip((await options.count())<2,"No selectable published brands in the inert local build.");
  const before=await page.locator(".tractor-card-main[href]").count();
  const brand=await options.nth(1).getAttribute("value");
  await page.locator("#catalog-facet-brand").selectOption(brand);
  await expect(page.locator("#catalog-reset-facets")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("brand")).toBe(brand);
  await page.locator("#catalog-reset-facets").click();
  expect(new URL(page.url()).searchParams.get("brand")).toBe(null);
  expect(await page.locator(".tractor-card-main[href]").count()).toBe(before);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/tr/tractors/");
});
test("mobile comparison retains row/column semantics and legible source targets",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const response=await page.goto("/tr/compare/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const table=page.locator(".tc-table");
  test.skip(!(await table.count()),"No two published comparison fixtures in the inert local build.");
  await expect(table.locator("caption")).toHaveCount(1);
  await expect(table.locator('th[scope="col"]')).toHaveCount(3);
  const row=table.locator("tbody tr").first();
  await expect(row.locator('th[scope="row"]')).toHaveCount(1);
  await expect(row.locator("td")).toHaveCount(2);
  expect(await row.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(/\s+/).length)).toBe(2);
  expect(await noDocumentOverflow(page)).toBe(true);
  const sourceLink=table.locator(".tc-entry a").first();
  if(await sourceLink.count()){
    const dimensions=await sourceLink.evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),height:el.getBoundingClientRect().height}));
    expect(dimensions.font).toBeGreaterThanOrEqual(14);
    expect(dimensions.height).toBeGreaterThanOrEqual(36);
  }
});
