import {test,expect} from "@playwright/test";

test("optional analytics notice is compact, transparent and never implies approval",async({page})=>{
 await page.setViewportSize({width:1280,height:800});
 await page.goto("/tr/forum/");
 const card=page.locator("#tractorvs-analytics-banner");
 await expect(card).toBeVisible();
 await expect(card.locator("#tractorvs-analytics-title")).toHaveText("İsteğe bağlı site analizi");
 await expect(card.locator("#tractorvs-analytics-summary")).toContainText("Microsoft Clarity");
 await expect(card.locator("#tractorvs-analytics-summary")).toContainText("Cloudflare");
 await expect(card.locator(".tractorvs-analytics-link")).toHaveAttribute("href","/tr/privacy/");
 await expect(card.locator("#tractorvs-clarity-description")).toBeHidden();
 const geometry=await card.evaluate(el=>({width:el.getBoundingClientRect().width,
   height:el.getBoundingClientRect().height,right:el.getBoundingClientRect().right,
   viewport:window.innerWidth}));
 expect(geometry.width).toBeLessThanOrEqual(472);
 expect(geometry.height).toBeLessThanOrEqual(320);
 expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
 await card.locator(".tractorvs-analytics-more summary").click();
 await expect(card.locator("#tractorvs-analytics-description")).toBeVisible();
 await expect(card.locator("#tractorvs-clarity-description")).toBeVisible();
 await expect(card.locator("#tractorvs-cloudflare-description")).toBeVisible();
 await card.locator("#tractorvs-analytics-reject").click();
 await expect(card).toBeHidden();
 expect(await page.evaluate(()=>localStorage.getItem("tractorvs_analytics_choice_v3"))).toBe("rejected");
 for(const selector of ["script[data-tractorvs-ga4]","script[data-tractorvs-clarity]","script[data-tractorvs-cloudflare]"])
  await expect(page.locator(selector)).toHaveCount(0);
});
test("mobile consent card remains inside viewport and keeps 44px action targets",async({page})=>{
 await page.setViewportSize({width:360,height:740});
 await page.goto("/tr/forum/");
 const card=page.locator("#tractorvs-analytics-banner");
 await expect(card).toBeVisible();
 const geometry=await card.evaluate(el=>{
  const r=el.getBoundingClientRect();
  const buttons=[...el.querySelectorAll(".tractorvs-analytics-actions button")].map(b=>b.getBoundingClientRect());
  return {left:r.left,right:r.right,height:r.height,viewport:innerWidth,vh:innerHeight,
   buttonHeights:buttons.map(b=>b.height),
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(geometry.left).toBeGreaterThanOrEqual(-1);
 expect(geometry.right).toBeLessThanOrEqual(geometry.viewport+1);
 expect(geometry.height).toBeLessThanOrEqual(geometry.vh*.75+2);
 expect(geometry.overflow).toBeLessThanOrEqual(2);
 expect(geometry.buttonHeights.every(x=>x>=44)).toBe(true);
 await card.locator(".tractorvs-analytics-more summary").click();
 await expect(card.locator("#tractorvs-cloudflare-description")).toBeVisible();
 await card.locator("#tractorvs-analytics-reject").click();
 await expect(card).toBeHidden();
});
test("localized compact copy shows on other forum languages",async({page})=>{
 for(const path of ["/forum/","/de/forum/","/fr/forum/","/ja/forum/"]){
  await page.goto(path);
  const card=page.locator("#tractorvs-analytics-banner");
  await expect(card).toBeVisible();
  await expect(card.locator("#tractorvs-analytics-summary")).toContainText("Google Analytics");
  await expect(card.locator("#tractorvs-analytics-summary")).toContainText("Microsoft Clarity");
  await expect(card.locator("#tractorvs-analytics-summary")).toContainText("Cloudflare");
  await expect(card.locator("details summary")).toBeVisible();
  await expect(card.locator("#tractorvs-analytics-reject")).toBeVisible();
 }
});
