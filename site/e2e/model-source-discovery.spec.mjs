import {test,expect} from "@playwright/test";
test("model source discovery preserves evidence and offers exact source kinds",async({page})=>{
 await page.goto("/tr/tractors/");
 const links=page.locator(".tractor-card-main");
 const urls=await links.evaluateAll(items=>[...new Set(items.map(a=>a.href))].slice(0,12));
 test.setTimeout(90000);
 let found=false;
 for(const url of urls){
  await page.goto(url);
  const section=page.locator(".model-sources");
  const controls=section.locator("[data-source-discovery]");
  if(!await controls.isVisible())continue;
  found=true;
  const rows=section.locator("[data-source-kind]");
  const total=await rows.count();
  for(const kind of ["manufacturer","independent"]){
   await controls.locator('input[value="'+kind+'"]').check();
   const expected=await section.locator('[data-source-kind="'+kind+'"]').count();
   expect(expected).toBeGreaterThan(0);
   await expect(section.locator("[data-source-kind]:visible")).toHaveCount(expected);
   await expect(section.locator('[data-source-kind="'+kind+'"]:visible')).toHaveCount(expected);
  }
  await controls.locator('input[value="all"]').check();
  await expect(section.locator("[data-source-kind]:visible")).toHaveCount(total);
  await expect(section.locator(".model-source-method")).toHaveAttribute("href","/tr/methodology/");
  break;
 }
 test.skip(!found,"No mixed-source fixture found in sampled catalogue; populated acceptance required");
});
