import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({page})=>{
 await page.route("**/*",route=>{
  const url=new URL(route.request().url());
  return ["127.0.0.1","localhost"].includes(url.hostname)
   ?route.continue():route.abort();
 });
});

test("original technical glossary and public forum have no serious color-contrast violations",async ({page,browserName,isMobile})=>{
 test.skip(browserName!=="chromium"||isMobile,"targeted contrast checked on desktop Chromium");
 for(const path of ["/guides/tractor-technical-terms/","/tr/guides/tractor-technical-terms/","/tr/forum/"]){
  const response=await page.goto(path,{waitUntil:"domcontentloaded"});
  expect(response?.status(),path+" HTTP").toBe(200);
  const axe=await new AxeBuilder({page}).withRules(["color-contrast"]).analyze();
  const significant=axe.violations.filter(v=>["serious","critical"].includes(v.impact));
  expect(significant.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)})),path+" contrast").toEqual([]);
 }
});

test("forum publication link is a real safe URL even when visually hidden",async ({page,browserName,isMobile})=>{
 test.skip(browserName!=="chromium"||isMobile,"publication fallback checked on desktop Chromium");
 await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
 const link=page.locator("[data-forum-publication-link]");
 if(await link.count()){
  await expect(link).toHaveAttribute("href","/tr/forum/");
  await expect(link).toBeHidden();
 }
});
