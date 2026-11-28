import {test,expect} from "@playwright/test";
for(const locale of ["en","tr","de","ja"]){
 const prefix=locale==="en"?"":"/"+locale;
 test("selection guide research checklist progress: "+locale,async({page})=>{
  await page.goto(prefix+"/guides/choosing-a-tractor/");
  const root=page.locator("[data-guide-research]");
  await expect(root).toBeVisible();
  const entry=page.locator("[data-guide-research-entry] a");
  await expect(entry).toBeVisible();
  await entry.click();
  expect(new URL(page.url()).hash).toBe("#guide-research-heading");
  await expect(root.locator("h2")).toBeInViewport();
  const checks=root.locator("[data-research-check]");
  const count=await checks.count();
  expect(count).toBeGreaterThan(1);
  await checks.first().check();
  await expect(root.locator("progress")).toHaveJSProperty("value",1);
  await expect(root.locator("progress")).toHaveJSProperty("max",count);
  await checks.last().check();
  await expect(root.locator("progress")).toHaveJSProperty("value",2);
  const href=await root.locator("li a").first().getAttribute("href");
  await expect(page.locator(href)).toHaveCount(1);
  await root.locator("li a").first().click();
  expect(new URL(page.url()).hash).toBe(href);
  await page.locator(href).locator("[data-guide-research-return] a").click();
  expect(new URL(page.url()).hash).toBe("#guide-research-question-1");
  await expect(root.locator("#guide-research-question-1")).toBeFocused();
  await expect(root.locator("progress")).toHaveJSProperty("value",2);
  await root.locator("[data-research-reset]").click();
  await expect(root.locator("progress")).toHaveJSProperty("value",0);
  await expect(root.locator("input:checked")).toHaveCount(0);
  await checks.first().check();
  await page.reload();
  await expect(root.locator("input:checked")).toHaveCount(0);
 });
}
test("catalogue provides localized link to brand directory if populated",async({page})=>{
 await page.goto("/tr/tractors/");
 const links=page.locator(".catalog-editorial-links");
 if(!await links.count()){test.skip(true,"Offline catalogue empty; populated acceptance required");return;}
 await expect(links.locator('a[href="/tr/brands/"]')).toHaveCount(1);
});
