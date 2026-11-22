import {test,expect} from "@playwright/test";

test("evidence library search keeps all published article links in SSR HTML and filters client-side",async({page})=>{
  const response=await page.goto("/tr/articles/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const cards=page.locator("[data-editorial-card]");
  const total=await cards.count();
  expect(total).toBeGreaterThan(0);
  const originalLinks=await page.locator("[data-editorial-card] h3 a[href]").count();
  await expect(page.locator("#editorial-query")).toBeVisible();
  await page.locator("#editorial-query").fill("unfindable-tractor-article-987654321");
  await expect(page.locator("#editorial-no-results")).toBeVisible();
  await expect(page.locator("[data-editorial-card]:visible")).toHaveCount(0);
  await page.locator("#editorial-clear").click();
  await expect(page.locator("#editorial-no-results")).toBeHidden();
  await expect(page.locator("[data-editorial-card]:visible")).toHaveCount(total);
  expect(await page.locator("[data-editorial-card] h3 a[href]").count()).toBe(originalLinks);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/tr/articles/");
});

test("tractor advisor offers three localized, keyboard-accessible research step links",async({page})=>{
  const response=await page.goto("/tr/farm-advisor/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const nav=page.locator(".advisor-step-jumps");
  await expect(nav).toBeVisible();
  await expect(nav.locator("a")).toHaveCount(3);
  for(const id of ["advisor-land-title","advisor-equipment-title","advisor-more-title"]){
    await expect(nav.locator('a[href="#'+id+'"]')).toBeVisible();
    await expect(page.locator("#"+id)).toHaveCount(1);
  }
  await nav.locator('a[href="#advisor-equipment-title"]').click();
  expect(new URL(page.url()).hash).toBe("#advisor-equipment-title");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/tr/farm-advisor/");
});

test("featured tractor cards use independent photo controls and real detail links, not shopping controls",async({page})=>{
  await page.goto("/tr/",{waitUntil:"domcontentloaded"});
  const cards=page.locator(".home-featured-card");
  test.skip((await cards.count())===0,"Offline catalogue fixtures are not guaranteed.");
  const first=cards.first();
  await expect(first.locator(".home-featured-main[href^='/tr/tractors/']")).toBeVisible();
  await expect(first.locator(".tractor-photo-gallery")).toBeVisible();
  expect(await first.locator(".home-featured-main .tractor-photo-button").count()).toBe(0);
  if(await first.locator(".tractor-photo-button").count()){
    await expect(first.locator(".tractor-photo-short-credit a")).toHaveAttribute("href",/^https:\/\//);
  } else {
    await expect(first.locator(".tractor-photo-placeholder")).toBeVisible();
  }
  expect(await first.textContent()).not.toMatch(/Satın al|Teklif al|Buy now|Checkout/i);
});

test("published model details provide technical category jumps sourced from actual sections",async({page})=>{
  await page.goto("/tr/tractors/",{waitUntil:"domcontentloaded"});
  const first=page.locator(".tractor-card-main[href^='/tr/tractors/']").first();
  test.skip((await first.count())===0,"Offline build contains no published tractor fixtures.");
  const href=await first.getAttribute("href");
  const response=await page.goto(href,{waitUntil:"domcontentloaded"});
  test.skip(response?.status()!==200,"Model page unavailable in offline build.");
  const nav=page.locator(".model-spec-toc");
  const sectionCount=await page.locator(".model-spec-group").count();
  if(sectionCount>1){
    await expect(nav).toBeVisible();
    await expect(nav.locator("a")).toHaveCount(sectionCount);
    const firstLink=nav.locator("a").first();
    const target=await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page.locator(target)).toBeVisible();
    expect(new URL(page.url()).hash).toBe(target);
  }else await expect(nav).toHaveCount(0);
});
