import {test,expect} from "@playwright/test";
for(const locale of ["en","tr"]){
 const prefix=locale==="tr"?"/tr":"";
 test("methodology stable anchors and correction guidance: "+locale,async({page})=>{
  await page.goto(prefix+"/methodology/");
  const nav=page.locator(".method-toc");
  await expect(nav.locator("a")).toHaveCount(6);
  for(const a of await nav.locator("a").all()){
   const id=(await a.getAttribute("href")).slice(1);
   await expect(page.locator("#"+id)).toHaveCount(1);
  }
  await nav.locator('a[href="#corrections"]').click();
  await expect(page).toHaveURL(/#corrections$/);
  await expect(page.locator(".method-correction li")).toHaveCount(4);
  await expect(page.locator(".method-correction a")).toHaveAttribute("href","https://github.com/onuronkol2-collab/tractorcompare-data/issues");
  for(const [i,path] of ["/tractors/","/compare/","/articles/"].entries()){
   await expect(page.locator(".method-next a").nth(i)).toHaveAttribute("href",prefix+path);
  }
 });
}
for(const locale of ["tr","de","ja"]){
 test("forum research links: "+locale,async({page})=>{
  await page.goto("/"+locale+"/forum/");
  const links=page.locator(".forum-side-research nav a");
  await expect(links).toHaveCount(3);
  const help=page.locator(".forum-side-research .forum-question-help");
  await expect(help.locator("a")).toHaveAttribute("href","#forum-compose");
  await expect(help.locator("summary")).toBeVisible();
  for(const [i,path] of ["/tractors/","/compare/","/guides/choosing-a-tractor/"].entries()){
   await expect(links.nth(i)).toHaveAttribute("href","/"+locale+path);
  }
 });
}
