import {test,expect} from "@playwright/test";
const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
for(const lang of locales){
 test("agency-first task navigation and guide: "+lang,async({page})=>{
  const prefix=lang==="en"?"":"/"+lang;
  await page.setViewportSize({width:360,height:800});
  await page.goto(prefix+"/");
  const panel=page.locator(".home-task-panel");
  const actions=panel.locator(".home-action-card");
  await expect(actions).toHaveCount(4);
  for(const [i,path] of ["/tractors/","/compare/","/farm-advisor/","/guides/farm-cost-calculator/"].entries()){
   await expect(actions.nth(i)).toHaveAttribute("href",prefix+path);
   await expect(actions.nth(i)).toBeVisible();
  }
  const guide=panel.locator(".home-task-guide a");
  await expect(guide).toHaveAttribute("href",prefix+"/guides/choosing-a-tractor/");
  await expect(guide).toBeVisible();
  expect((await guide.boundingBox())?.height??0).toBeGreaterThanOrEqual(44);
  await guide.focus();
  await expect(guide).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 });
}
