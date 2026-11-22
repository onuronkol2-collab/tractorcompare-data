import {test,expect} from "@playwright/test";

test("narrow forum layouts avoid iOS text-field focus zoom and horizontal overflow",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/tr/forum/");
 const composer=page.locator("#forum-compose");
 await expect(composer.locator("[data-forum-auth-gate] > summary")).toBeVisible();
 await composer.locator("[data-forum-auth-gate] > summary").click();
 await expect(composer.locator("[data-forum-register]")).toBeVisible();
 // Include both email and password account options without real Auth requests.
 await composer.locator("[data-password-choice] summary").click();
 await expect(composer.locator("[data-forum-password] input[name=password]")).toBeVisible();
 const fields=await composer.locator('input:not([type="checkbox"]), select, textarea').evaluateAll(items=>
  items.filter(el=>el.getClientRects().length>0 && getComputedStyle(el).visibility!=="hidden")
  .map(el=>({name:el.getAttribute("name")||el.getAttribute("type"),
    font:parseFloat(getComputedStyle(el).fontSize),
    width:el.getBoundingClientRect().width}))
 );
 expect(fields.length).toBeGreaterThanOrEqual(2);
 for(const field of fields){
  expect(field.font,field.name).toBeGreaterThanOrEqual(16);
  expect(field.width,field.name).toBeGreaterThan(0);
 }
 const geometry=await page.evaluate(()=>({
  scroll:document.documentElement.scrollWidth,viewport:innerWidth
 }));
 expect(geometry.scroll).toBeLessThanOrEqual(geometry.viewport+2);
});

test("logged-in composer title, selects, and body stay >=16px on mobile",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
 await page.route("**/forum-test-api/**",route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith("/auth/v1/user"))return route.fulfill({json:{id}});
  if(path.endsWith("/auth/v1/settings"))
   return route.fulfill({json:{external:{google:false,github:false}}});
  if(path.includes("/tc_member_profiles")||path.includes("/tc_member_scores"))
   return route.fulfill({json:[]});
  return route.fulfill({json:[]});
 });
 await page.goto("/tr/forum/#access_token=mobile-readability-fixture&refresh_token=mobile-refresh-fixture");
 const post=page.locator("#forum-compose [data-forum-post]");
 await expect(post).toBeVisible();
 const fields=await post.locator("input:not([type=checkbox]), select, textarea").evaluateAll(items=>
  items.filter(el=>el.getClientRects().length>0)
  .map(el=>({name:el.getAttribute("name"),
    font:parseFloat(getComputedStyle(el).fontSize)}))
 );
 expect(fields.some(x=>x.name==="title")).toBe(true);
 expect(fields.some(x=>x.name==="body")).toBe(true);
 expect(fields.some(x=>x.name==="category")).toBe(true);
 for(const field of fields)expect(field.font,field.name).toBeGreaterThanOrEqual(16);
});
