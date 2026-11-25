import {test,expect} from "@playwright/test";
// Inert CI: inject only browser-local fixture markup. Run the actual bundled script.
const fixture=`<section class="catalog-section"><div class="container"><label for="tractor-search">Find tractor</label><input id="tractor-search" type="search" maxlength="100"><span id="catalog-visible-count" data-count-template="{visible}/{total}" role="status"></span><button id="catalog-search-clear" hidden>Clear</button><div id="catalog-facet-panel" hidden><button id="catalog-reset-facets">Reset</button><select id="catalog-facet-brand"><option value="">All</option><option>QA Brand</option></select><select id="catalog-facet-power"><option value="">All</option><option value="up50">50</option></select><select id="catalog-facet-year"><option value="">All</option><option value="recent">2020</option></select><select id="catalog-facet-market"><option value="">All</option><option value="TR">TR</option></select><select id="catalog-facet-sort"><option value="brand">Default</option><option value="powerAsc">Power</option></select></div><div id="tractor-card-grid"><article class="tractor-card" data-search="qa brand alpha" data-brand="QA Brand" data-power="40" data-year="2020" data-name="QA Alpha"><a class="tractor-card-main" href="/tr/tractors/">QA Alpha</a></article><article class="tractor-card" data-search="qa brand beta" data-brand="QA Brand" data-power="70" data-year="2019" data-name="QA Beta"><a class="tractor-card-main" href="/tr/tractors/">QA Beta</a></article></div><p id="catalog-no-results" role="status" hidden>No results</p><button type="button" class="catalog-empty-reset" id="catalog-empty-reset" hidden>Reset filters</button></div></section>`;
test("catalogue rejects stale facets, recovers from no results and keeps published links",async({page})=>{
  await page.route(url=>url.pathname==="/tr/tractors/",async route=>{
    const response=await route.fetch();
    let html=await response.text();
    if(!html.includes('id="tractor-search"'))html=html.replace("</body>",fixture+"</body>");
    await route.fulfill({response,body:html});
  });
  await page.goto("/tr/tractors/?q=zzzz-qa-no-model-zzz&brand=nonexistent-qa-brand&power=invalid&year=invalid&sort=invalid&market=invalid",{waitUntil:"load"});
  const banner=page.locator("#tractorvs-analytics-banner");
  await expect(banner).toBeVisible();
  await page.locator("#tractorvs-analytics-reject").click();
  await expect(banner).toBeHidden();
  await expect.poll(()=>new URL(page.url()).searchParams.has("brand")).toBe(false);
  for(const param of ["power","year","sort","market"])expect(new URL(page.url()).searchParams.has(param)).toBe(false);
  const cards=page.locator(".tractor-card");
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(page.locator(".tractor-card:visible")).toHaveCount(0);
  await expect(page.locator("#catalog-no-results")).toBeVisible();
  const reset=page.locator("#catalog-empty-reset");
  await expect(reset).toBeVisible();
  await reset.click();
  await expect(reset).toBeHidden();
  await expect(page.locator("#catalog-no-results")).toBeHidden();
  await expect(page.locator("#tractor-search")).toBeFocused();
  await expect(page.locator("#tractor-search")).toHaveValue("");
  await expect.poll(()=>new URL(page.url()).searchParams.has("q")).toBe(false);
  await expect(page.locator(".tractor-card:visible")).toHaveCount(await cards.count());
  await expect(page.locator(".tractor-card-main[href]").first()).toBeVisible();
});
