import {test,expect} from "@playwright/test";

const pixels=async(locator)=>locator.evaluate(node=>Number.parseFloat(getComputedStyle(node).fontSize));
const noOverflow=async(page)=>page.evaluate(()=>
 document.documentElement.scrollWidth<=window.innerWidth+2);

test("Turkish and English catalogue copy stays readable and canonical",async({page})=>{
 for(const [url,canonical] of [
  ["/tr/tractors/","https://tractorvs.com/tr/tractors/"],
  ["/tractors/","https://tractorvs.com/tractors/"]
 ]){
  const response=await page.goto(url,{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",canonical);
  expect(await pixels(page.locator(".catalog-intro"))).toBeGreaterThanOrEqual(16);
  const cards=page.locator(".tractor-card");
  if(await cards.count()){
   const first=cards.first();
   expect(await pixels(first.locator(".tractor-card-footer"))).toBeGreaterThanOrEqual(14);
   expect(await pixels(first.locator(".tractor-price-summary"))).toBeGreaterThanOrEqual(14);
   const filter=page.locator("#catalog-facet-panel");
   await expect(filter).toBeVisible();
   expect(await pixels(filter.locator("label").first())).toBeGreaterThanOrEqual(15);
  }
 }
});
test("narrow-screen catalogue and homepage avoid horizontal overflow",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const url of ["/tr/","/tr/tractors/"]){
  const response=await page.goto(url,{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  expect(await noOverflow(page)).toBe(true);
 }
 await page.goto("/tr/tractors/");
 expect(await pixels(page.locator(".catalog-intro"))).toBeGreaterThanOrEqual(16);
});


test("Turkish editorial hub exposes readable evidence-first cards and dates",async({page})=>{
 const response=await page.goto("/tr/articles/",{waitUntil:"domcontentloaded"});
 expect(response?.status()).toBe(200);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/tr/articles/");
 await expect(page.locator(".editorial-card").first()).toBeVisible();
 expect(await pixels(page.locator(".editorial-card > p:not(.editorial-kicker)").first())).toBeGreaterThanOrEqual(16);
 expect(await pixels(page.locator(".editorial-card-footer time").first())).toBeGreaterThanOrEqual(14);
 expect(await noOverflow(page)).toBe(true);
});

test("readability selectors support ten published language routes without changing the content index",async({page})=>{
 for(const locale of ["tr","de","fr","pt-br","ru","ja","zh","es","hi","en"]){
  const url=locale==="en"?"/articles/":"/"+locale+"/articles/";
  const response=await page.goto(url,{waitUntil:"domcontentloaded"});
  expect(response?.status(),url).toBe(200);
  await expect(page.locator("main h1"),url).toHaveCount(1);
  expect(await pixels(page.locator(".editorial-card-footer time").first()),url).toBeGreaterThanOrEqual(14);
  expect(await noOverflow(page),url).toBe(true);
 }
});
