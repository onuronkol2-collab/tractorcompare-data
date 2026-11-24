import {test,expect} from "@playwright/test";

// Exercise real compiled analytics and advisor scripts in an isolated browser.
// Never transmit event hits to GA4/Clarity/Cloudflare from test traffic.
test.beforeEach(async({page})=>{
  await page.route("**/*",route=>{
    const host=new URL(route.request().url()).hostname;
    if(host==="localhost"||host==="127.0.0.1")return route.continue();
    return route.abort();
  });
});

const events=async page=>page.evaluate(()=>
  (window.dataLayer||[]).map(item=>Array.from(item))
    .filter(args=>args[0]==="event"));

async function simulatedCatalogSubmit(page){
  // The offline catalogue has no published cards; use a real native form
  // submit to verify the global listener without fabricating tractor IDs.
  await page.evaluate(()=>{
    let form=document.querySelector("#catalog-compare");
    if(!form){
      form=document.createElement("form");
      form.id="catalog-compare";
      document.body.appendChild(form);
    }
    form.addEventListener("submit",event=>event.preventDefault(),{once:true});
    form.requestSubmit();
  });
}

test("comparison launch is emitted only after approval and sends no form values",async({page})=>{
  await page.goto("/tr/compare/",{waitUntil:"domcontentloaded"});
  await expect(page.locator("#tractorvs-analytics-banner")).toBeVisible();
  await simulatedCatalogSubmit(page);
  expect(await events(page)).toEqual([]);
  await page.locator("#tractorvs-analytics-accept").click();
  expect(await events(page)).toEqual([["event","tractor_compare_view"]]);
  await simulatedCatalogSubmit(page);
  expect(await events(page)).toEqual([
    ["event","tractor_compare_view"],["event","tractor_compare_launch"]
  ]);
  await page.evaluate(()=>{
    const unrelated=document.createElement("form");
    unrelated.id="unrelated";
    unrelated.addEventListener("submit",event=>event.preventDefault());
    document.body.appendChild(unrelated);
    unrelated.requestSubmit();
  });
  expect((await events(page)).length).toBe(2);
});

test("advisor calculation emits exactly one event after visible valid result, not invalid input",async({page})=>{
  await page.goto("/tr/farm-advisor/",{waitUntil:"domcontentloaded"});
  await page.locator("#tractorvs-analytics-accept").click();
  expect(await events(page)).toEqual([["event","tractor_advisor_view"]]);
  await page.locator('input[name="implements"][value="mower"]').check();
  await page.locator("#farm-advisor-form button[type=submit]").click();
  await expect(page.locator("#advisor-results")).toBeVisible();
  expect(await events(page)).toEqual([
    ["event","tractor_advisor_view"],["event","tractor_advisor_calculated"]
  ]);
  await page.locator('#farm-advisor-form input[name="area"]').fill("0");
  await page.locator("#farm-advisor-form button[type=submit]").click();
  expect((await events(page)).length).toBe(2);
});

test("rejected consent never queues advisor conversion even when calculations succeed",async({page})=>{
  await page.goto("/tr/farm-advisor/",{waitUntil:"domcontentloaded"});
  await page.locator("#tractorvs-analytics-reject").click();
  await page.locator("#farm-advisor-form button[type=submit]").click();
  await expect(page.locator("#advisor-results")).toBeVisible();
  expect(await events(page)).toEqual([]);
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(0);
});
