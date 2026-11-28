import {test,expect} from "@playwright/test";
for(const lang of ["tr","de","ja"]){
 test("editorial subject paths preserve genuine reading languages: "+lang,async({page})=>{
  await page.goto("/"+lang+"/articles/");
  const nav=page.locator(".editorial-intent");
  await expect(nav.locator("a")).toHaveCount(5);
  await expect(nav.locator("a").first()).toHaveAttribute("href","/"+lang+"/guides/choosing-a-tractor/");
  for(const a of await nav.locator("a").all()){
   const href=await a.getAttribute("href");
   await expect(page.locator(".editorial-grid h3 a").filter({hasText:await a.locator("strong").innerText()})).toHaveAttribute("href",href);
   expect((await a.boundingBox())?.height??0).toBeGreaterThanOrEqual(44);
  }
  if(lang!=="tr")await expect(nav.locator("a[hreflang=en] small")).toHaveCount(4);
 });
 test("forum helpful question guidance is optional: "+lang,async({page})=>{
  await page.goto("/"+lang+"/forum/");
  const help=page.locator(".forum-question-help");
  await expect(help.locator("summary")).toBeVisible();
  await help.locator("summary").click();
  await expect(help).toHaveAttribute("open","");
  await expect(help.locator("li")).toHaveCount(3);
  await expect(help.locator("a")).toHaveAttribute("href","#forum-compose");
  await expect(page.locator("#forum-compose")).toHaveCount(1);
 });
}
