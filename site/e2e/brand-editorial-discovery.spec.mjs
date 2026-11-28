import {test,expect} from "@playwright/test";
test("editorial search jump and reset preserve actual article links",async({page})=>{
 await page.goto("/tr/articles/");
 const jump=page.locator("[data-editorial-search-jump]");
 await expect(jump).toBeVisible();
 await jump.click();
 const input=page.locator("#editorial-query");
 await expect(input).toBeFocused();
 const cards=page.locator("[data-editorial-card]");
 const count=await cards.count();
 expect(count).toBeGreaterThan(0);
 const shortcuts=page.locator("[data-editorial-intent]");
 await expect(shortcuts).toBeVisible();
 await input.fill("zz-no-article-900001");
 await expect(page.locator("#editorial-no-results")).toBeVisible();
 await expect(shortcuts).toBeHidden();
 await expect(page.locator("[data-editorial-card]:visible")).toHaveCount(0);
 await page.locator("#editorial-reset").click();
 await expect(page.locator("[data-editorial-card]:visible")).toHaveCount(count);
 await expect(input).toBeFocused();
 await expect(shortcuts).toBeVisible();
});
test("brand directory filters intersect and reset with published rows when present",async({page})=>{
 await page.goto("/tr/brands/");
 const cards=page.locator("[data-directory-brand]");
 if(await cards.count()===0){test.skip(true,"Offline build may have no configured public catalogue; populated live acceptance required");return;}
 const market=page.locator("[data-directory-market]");
 const source=page.locator("[data-directory-sources]");
 const total=await cards.count();
 const values=await market.locator("option").evaluateAll(rows=>rows.map(x=>x.value).filter(Boolean));
 if(values.length){
  await market.selectOption(values[0]);
  for(const card of await page.locator("[data-directory-brand]:visible").all()){
   expect(JSON.parse(await card.getAttribute("data-markets"))).toContain(values[0]);
  }
 }
 await source.check();
 for(const card of await page.locator("[data-directory-brand]:visible").all()){
  expect(Number(await card.getAttribute("data-source-count"))).toBeGreaterThan(0);
  if(values.length)expect(JSON.parse(await card.getAttribute("data-source-markets"))).toContain(values[0]);
 }
 await page.locator("[data-directory-query]").fill("zz-no-brand-900001");
 await expect(page.locator("[data-directory-empty]")).toBeVisible();
 await page.locator("[data-directory-clear]").click();
 await expect(page.locator("[data-directory-brand]:visible")).toHaveCount(total);
 await expect(source).not.toBeChecked();
 await expect(market).toHaveValue("");
 await expect(page.locator("[data-directory-query]")).toBeFocused();
});

test("reading language narrowing does not leave contradictory unfiltered shortcuts",async({page})=>{
 await page.goto("/de/articles/");
 const shortcuts=page.locator("[data-editorial-intent]");
 await expect(shortcuts).toBeVisible();
 await page.locator('input[name="editorial-reading-language"][value="local"]').check();
 await expect(shortcuts).toBeHidden();
 await expect(page.locator('[data-editorial-card][data-reading-language="other"]:visible')).toHaveCount(0);
 await expect(page.locator('[data-editorial-card][data-reading-language="local"]:visible')).toHaveCount(2);
 await page.locator('input[name="editorial-reading-language"][value="all"]').check();
 await expect(shortcuts).toBeVisible();
});
