import {test,expect} from "@playwright/test";
test("unmatched brand query suggests a targeted recovery without changing other filters",async({page})=>{
 await page.goto("/tr/brands/");
 const cards=page.locator("[data-directory-brand]");
 if(!await cards.count()){test.skip(true,"Populated catalogue acceptance required");return;}
 const input=page.locator("[data-directory-query]");
 const total=await cards.count();
 await input.fill("zz-no-brand-900002");
 const empty=page.locator("[data-directory-empty]");
 await expect(empty).toBeVisible();
 await expect(empty.locator('[data-directory-relax="query"]')).toBeVisible();
 await expect(empty.locator('[data-directory-relax="market"]')).toBeHidden();
 await empty.locator('[data-directory-relax="query"]').click();
 await expect(input).toHaveValue("");
 await expect(input).toBeFocused();
 await expect(page.locator("[data-directory-brand]:visible")).toHaveCount(total);
});
test("methodology concise summary retains full details",async({page})=>{
 await page.goto("/tr/methodology/");
 await expect(page.locator(".method-in-brief li")).toHaveCount(3);
 await expect(page.locator(".method-section")).toHaveCount(6);
});
