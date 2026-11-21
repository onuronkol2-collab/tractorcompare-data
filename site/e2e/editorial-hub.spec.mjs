import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The preview is a local static build. Never fire third-party analytics.
test.beforeEach(async ({page})=>{
 await page.route("**/*",route=>{
  const url=new URL(route.request().url());
  return ["127.0.0.1","localhost"].includes(url.hostname)
   ?route.continue():route.abort();
 });
});

test("EN and TR article hubs expose real linked articles in server-rendered HTML",async ({page})=>{
 for(const [path,lang] of [["/articles/","en"],["/tr/articles/","tr"]]){
  const response=await page.goto(path,{waitUntil:"domcontentloaded"});
  expect(response?.status(),path).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang",lang);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".editorial-card")).toHaveCount(6);
  await expect(page.locator(".editorial-card h3 a")).toHaveCount(6);
  // JSON-LD is a script: Playwright toContainText reads rendered innerText,
  // which is empty for scripts even when the JSON is present in the HTML.
  const jsonld=await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonld).toContain("CollectionPage");
  expect(jsonld).toContain("ItemList");
  const expectedPrefix=lang==="tr"?"/tr":"";
  for(const link of await page.locator(".editorial-card h3 a").all()){
   const href=await link.getAttribute("href");
   expect(href).toMatch(new RegExp("^"+expectedPrefix+"/(?:guides|reviews)/"));
   expect(href).not.toContain("2026-2027-traktor-guvenilirlik");
  }
 }
});

test("article hub is reachable from mobile navigation",async ({page,isMobile})=>{
 test.skip(!isMobile,"mobile navigation only");
 await page.goto("/tr/articles/",{waitUntil:"domcontentloaded"});
 const menu=page.locator("details.mobile-nav");
 await menu.locator("summary").click();
 await expect(menu.locator('a[href="/tr/articles/"]')).toBeVisible();
});

test("article hub has no serious or critical axe-core findings",async ({page,browserName},testInfo)=>{
 test.skip(browserName!=="chromium","axe checked on desktop and mobile Chromium");
 for(const path of ["/articles/","/tr/articles/"]){
  await page.goto(path,{waitUntil:"domcontentloaded"});
  const report=await new AxeBuilder({page})
   .withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"])
   .analyze();
  const findings=report.violations.map(x=>({
   id:x.id,impact:x.impact,target:x.nodes.map(n=>n.target),help:x.help
  }));
  await testInfo.attach("editorial-axe-"+(path.startsWith("/tr")?"tr":"en"),{
   body:Buffer.from(JSON.stringify(findings,null,2)),contentType:"application/json"
  });
  const significant=report.violations.filter(x=>["serious","critical"].includes(x.impact));
  expect(significant,path+" has serious/critical accessibility violations").toEqual([]);
 }
});
