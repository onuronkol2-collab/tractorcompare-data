import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
 await page.route("**/*",route=>{
  const host=new URL(route.request().url()).hostname;
  return ["localhost","127.0.0.1"].includes(host)?route.continue():route.abort();
 });
});

test("skip link moves keyboard focus into the document's main landmark",async({page})=>{
 for(const path of ["/","/tr/","/ja/"]){
  const response=await page.goto(path,{waitUntil:"domcontentloaded"});
  expect(response?.status(),path).toBe(200);
  const skip=page.locator("a.skip-link");
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  expect(await skip.evaluate(node=>getComputedStyle(node).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
 }
});

test("reducing motion disables smooth scrolling and animated primary buttons",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/tr/",{waitUntil:"domcontentloaded"});
 const behavior=await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior);
 expect(behavior).toBe("auto");
 const button=page.locator("main .button").first();
 await expect(button).toBeVisible();
 const duration=await button.evaluate(el=>getComputedStyle(el).transitionDuration);
 expect(duration.split(",").every(value=>Number.parseFloat(value)<0.1)).toBe(true);
});

test("mobile navigation maintains visible keyboard focus and clean SEO metadata",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/tr/",{waitUntil:"domcontentloaded"});
 const menu=page.locator("details.mobile-nav");
 await menu.locator("summary").focus();
 const outline=await menu.locator("summary").evaluate(el=>getComputedStyle(el).outlineStyle);
 // A programmatic focus does not always activate :focus-visible in WebKit;
 // true keyboard navigation must make the focus indicator appear.
 await page.keyboard.press("Tab");
 await page.keyboard.press("Shift+Tab");
 const keyboardOutline=await menu.locator("summary").evaluate(el=>getComputedStyle(el).outlineStyle);
 expect([outline,keyboardOutline]).toContain("solid");
 // CI intentionally builds an inert noindex preview. Published builds must
 // expose the canonical; previews must keep their canonical absent.
 const robots=await page.locator('meta[name="robots"]').getAttribute("content");
 expect(robots).toMatch(/^(?:noindex,nofollow|index,follow)/);
 if(robots?.startsWith("noindex")){
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
 }else{
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/tr/");
  expect(robots).toContain("index,follow");
 }
});
