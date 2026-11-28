import {test,expect} from "@playwright/test";

test("homepage search offers a catalogue recovery route for unmatched queries",async({page})=>{
  await page.goto("/tr/",{waitUntil:"domcontentloaded"});
  const input=page.locator("#home-model-query");
  await input.fill("zz-no-such-model-90000001");
  const recovery=page.locator("#home-search-empty");
  await expect(recovery).toBeVisible();
  await expect(recovery.locator("a")).toHaveAttribute("href","/tr/tractors/");
  await expect(input).toHaveAttribute("aria-expanded","false");
  await input.press("Escape");
  await expect(recovery).toBeHidden();
  await expect(input).toHaveValue("zz-no-such-model-90000001");
  await input.fill("zz-no-such-model-90000002");
  await recovery.locator("a").focus();
  await expect(recovery.locator("a")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(input).toBeFocused();
  await expect(recovery).toBeHidden();
  await expect(input).toHaveValue("zz-no-such-model-90000002");
  await input.fill("zz-no-such-model-90000003");
  await recovery.locator("[data-home-edit-search]").click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("zz-no-such-model-90000003");
  await expect(recovery).toBeHidden();
  expect(await input.evaluate(el=>[el.selectionStart,el.selectionEnd])).toEqual([0,"zz-no-such-model-90000003".length]);
});

test("homepage search shows all-results option when more than six records match",async({page})=>{
  // Controlled, synthetic fixture in the offline browser only; never published catalogue data.
  await page.route("**/tr/",async route=>{
    const response=await route.fetch();
    const text=await response.text();
    const fixture=Array.from({length:8},(_,i)=>({brand:"FixtureBrand",model:"Model "+i,variant:"Cab; Stage V",market:"Europe",engine:"Alpha",year:2025,horsepower:100,specs:12,url:"/tr/tractors/fixture-"+i+"/"}));
    const html=text.replace(/(<script\b[^>]*\bid=["']home-suggestions-data["'][^>]*>)[\s\S]*?(<\/script>)/,(_,open,close)=>open+JSON.stringify(fixture)+close);
    await route.fulfill({response,body:html});
  });
  await page.goto("/tr/",{waitUntil:"domcontentloaded"});
  const input=page.locator("#home-model-query");
  await input.fill("FixtureBrand Europe");
  const options=page.locator("#home-search-results [role=option]");
  await expect(options).toHaveCount(7);
  await expect(options.first()).toContainText("Cab; Stage V");
  await expect(options.first().locator(".home-search-option-variant")).toContainText("Avrupa (Europe)");
  await expect(options.first().locator(".home-search-option-variant")).toContainText("Cab; Stage V");
  await expect(options.first().locator(".home-search-option-facts")).toContainText("100 HP");
  const all=options.last();
  const href=await all.getAttribute("href");
  expect(new URL(href).pathname).toBe("/tr/tractors/");
  expect(new URL(href).searchParams.get("q")).toBe("FixtureBrand Europe");
  await input.press("ArrowUp");
  await expect(input).toHaveAttribute("aria-activedescendant","home-search-option-6");
});
