import {test,expect} from "@playwright/test";
for(const locale of ["tr","de","ja"]){
 test("reading location follows native fragment and return: "+locale,async({page})=>{
  await page.goto("/"+locale+"/guides/choosing-a-tractor/");
  const nav=page.locator("[data-reading-contents]");
  const first=nav.locator("a").first();
  const href=await first.getAttribute("href");
  await first.click();
  await expect(first).toHaveAttribute("aria-current","location");
  expect(new URL(page.url()).hash).toBe(href);
  const back=page.locator("[data-reading-return]").first();
  await back.click();
  await expect(page.locator("#article-contents-heading")).toBeFocused();
  await expect(nav.locator('[aria-current="location"]')).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe("#article-contents-heading");
  await page.goBack();
  await expect(first).toHaveAttribute("aria-current","location");
 });
}
test("methodology preserves deep links and return navigation",async({page})=>{
 await page.goto("/tr/methodology/#source-evidence");
 await expect(page.locator('.method-toc a[href="#source-evidence"]')).toHaveAttribute("aria-current","location");
 await page.locator("[data-reading-return]").click();
 await expect(page.locator("#method-toc-heading")).toBeFocused();
 await expect(page.locator(".method-toc [aria-current]")).toHaveCount(0);
});
