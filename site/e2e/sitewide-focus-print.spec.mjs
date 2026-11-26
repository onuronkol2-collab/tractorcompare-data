import { test, expect } from "@playwright/test";

const locales=["tr","de","fr","es","pt-br","ru","zh","ja","hi","en"];
for(const locale of locales){
  test(`keyboard focus and localized typography: ${locale}`,async({page})=>{
    await page.setViewportSize({width:390,height:844});
    const root=locale==="en"?"/":`/${locale}/`;
    const response=await page.goto(root,{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    const toggle=page.locator(".locale-menu > summary");
    await toggle.click();
    await page.keyboard.press("Tab");
    const link=page.locator(".locale-options a").first();
    await expect(link).toBeFocused();
    expect(await link.evaluate(el=>getComputedStyle(el).outlineColor)).toBe("rgb(23, 92, 55)");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    if(["hi","ja","zh"].includes(locale))expect(await page.locator("main h1").evaluate(el=>getComputedStyle(el).letterSpacing)).toBe("normal");
  });
}

test("comparison print layout preserves table semantics and evidence at narrow width",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tr/compare/",{waitUntil:"domcontentloaded"});
  const table=page.locator(".tc-table");
  if(!(await table.count())){await expect(page.locator(".tc-empty")).toBeVisible();return;}
  await expect(page.locator("#tc-print")).toBeVisible();
  await expect(page.locator("#tc-rows")).toHaveAttribute("aria-busy","false");
  const rows=await table.locator("tbody tr").count();
  if(rows){
    await expect(page.locator("#tc-print")).toBeEnabled();
    await page.evaluate(()=>{window.print=()=>{document.body.dataset.printRequested="true";};});
    await page.locator("#tc-print").click();
    await expect(page.locator("body")).toHaveAttribute("data-print-requested","true");
  }else await expect(page.locator("#tc-print")).toBeDisabled();
  const sources=await table.locator("tbody a").count();
  await page.emulateMedia({media:"print"});
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator("#tc-print")).toBeHidden();
  await expect(table.locator("thead th")).toHaveCount(3);
  expect(await table.evaluate(el=>getComputedStyle(el).display)).toBe("table");
  expect(await table.locator("thead").evaluate(el=>getComputedStyle(el).display)).toBe("table-header-group");
  await expect(table.locator("tbody tr")).toHaveCount(rows);
  await expect(table.locator("tbody a")).toHaveCount(sources);
});
