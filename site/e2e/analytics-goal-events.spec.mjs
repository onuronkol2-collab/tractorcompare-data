import {test, expect} from "@playwright/test";

// No real analytics provider is contacted by these isolated browser tests.
test.beforeEach(async ({page})=>{
  await page.route("**/*",(route)=>{
    const host=new URL(route.request().url()).hostname;
    if (["localhost","127.0.0.1"].includes(host)) return route.continue();
    return route.abort();
  });
});

const queuedEvents=async(page)=>page.evaluate(()=>
  (window.dataLayer||[])
    .map(entry=>Array.from(entry))
    .filter(entry=>entry[0]==="event")
    .map(entry=>entry[1]));

test("explicit acceptance queues one compare goal and second consent click does not duplicate",async({page})=>{
  await page.goto("/tr/compare/",{waitUntil:"domcontentloaded"});
  await expect(page.locator("#tractorvs-analytics-banner")).toBeVisible();
  expect(await queuedEvents(page)).toEqual([]);
  await page.locator("#tractorvs-analytics-accept").click();
  expect(await queuedEvents(page)).toEqual(["tractor_compare_view"]);
  await page.locator("#tractorvs-analytics-settings").click();
  await page.locator("#tractorvs-analytics-accept").click();
  expect(await queuedEvents(page)).toEqual(["tractor_compare_view"]);
});

test("rejection emits no advisor goals and does not load third-party analytics",async({page})=>{
  await page.goto("/tr/farm-advisor/",{waitUntil:"domcontentloaded"});
  await page.locator("#tractorvs-analytics-reject").click();
  expect(await queuedEvents(page)).toEqual([]);
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(0);
  await page.reload({waitUntil:"domcontentloaded"});
  expect(await queuedEvents(page)).toEqual([]);
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(0);
});

test("approved advisor view is measurable without form values or model identifiers",async({page})=>{
  await page.goto("/tr/farm-advisor/",{waitUntil:"domcontentloaded"});
  await page.locator("#tractorvs-analytics-accept").click();
  expect(await queuedEvents(page)).toEqual(["tractor_advisor_view"]);
  const eventArgs=await page.evaluate(()=>(window.dataLayer||[])
    .map(entry=>Array.from(entry)).find(entry=>entry[0]==="event"));
  expect(eventArgs).toEqual(["event","tractor_advisor_view"]);
});
