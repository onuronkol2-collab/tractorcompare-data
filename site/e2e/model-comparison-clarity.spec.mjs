import {test,expect} from "@playwright/test";

for(const locale of ["tr","de","ja"]){
 test("comparison task hierarchy and mobile layout: "+locale,async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto("/"+locale+"/compare/");
  await expect(page.locator(".tc-hero h1")).toBeVisible();
  await expect(page.locator(".tc-hero-visual")).toBeHidden();
  const hero=await page.locator(".tc-hero").boundingBox();
  expect(hero?.height??999).toBeLessThan(500);
  // Empty offline catalogue is legitimate; populated comparison acceptance is separate.
  const picker=page.locator(".tc-picker");
  if(await picker.count()){
   await expect(picker).toBeVisible();
   const input=page.locator("#tc-left-search");
   if(await input.isVisible()){await input.focus();await expect(input).toBeFocused();}
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  expect(overflow).toBe(false);
 });
}

test("published model price change announces selected market without moving focus",async({page})=>{
 await page.goto("/tr/tractors/");
 const model=page.locator(".tractor-card-main").first();
 if(!await model.count()){test.skip(true,"No published model links in offline build");return;}
 const href=await model.getAttribute("href");
 expect(href).toBeTruthy();
 expect(new URL(href,page.url()).pathname).toMatch(/^\/tr\/tractors\/[^/]+\/$/);
 await page.route("**/api/visitor-country",route=>route.fulfill({json:{country:"TR"}}));
 await page.goto(href);
 const select=page.locator("[data-model-price-country]");
 await expect(select).toBeVisible();
 const options=await select.locator("option").evaluateAll(rows=>rows.map(x=>({value:x.value,label:x.textContent.trim()})));
 const current=await select.inputValue();
 const chosen=options.find(row=>row.value!==""&&row.value!==current);
 expect(chosen).toBeTruthy();
 await select.focus();
 await select.selectOption(chosen.value);
 await expect(page.locator(".model-market-sr-status")).toContainText(chosen.label);
 await expect(select).toBeFocused();
 const hasPrice=await page.locator("[data-model-price-source]").isVisible();
 const recovery=page.locator("[data-model-price-recovery]");
 if(hasPrice)await expect(recovery).toBeHidden();
 else {
  await expect(recovery).toBeVisible();
  await expect(recovery.locator("a")).toHaveAttribute("href","/tr/guides/farm-cost-calculator/");
 }
 const sourceLinks=page.locator(".model-sources-list a");
 for(const link of await sourceLinks.all()){
  expect((await link.boundingBox())?.height??0).toBeGreaterThanOrEqual(44);
 }
});
