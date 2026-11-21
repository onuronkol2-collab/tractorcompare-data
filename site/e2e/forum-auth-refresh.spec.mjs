import { test, expect } from "@playwright/test";

test("a temporary session expiry restores the forum editor",async({page})=>{
 let userChecks=0;
 let renewals=0;
 await page.route("**/forum-test-api/auth/v1/user",route=>{
  userChecks++;
  if(userChecks===1)return route.fulfill({status:401,json:{message:"expired"}});
  return route.fulfill({json:{id:"forum-fixture-user"}});
 });
 await page.route("**/forum-test-api/auth/v1/token?grant_type=refresh_token",route=>{
  renewals++;
  return route.fulfill({json:{access_token:"fixture-new-access",refresh_token:"fixture-new-refresh"}});
 });
 await page.route("**/forum-test-api/auth/v1/logout",route=>route.fulfill({status:204}));
 await page.goto("/tr/forum/#access_token=fixture-old-access&refresh_token=fixture-old-refresh");
 const section=page.locator("#forum-compose");
 await expect(section.locator("[data-forum-post]")).toBeVisible();
 await expect(page).not.toHaveURL(/access_token|refresh_token/);
 expect(renewals).toBe(1);
 await page.reload();
 await expect(section.locator("[data-forum-post]")).toBeVisible();
 expect(renewals).toBe(1);
 await section.locator("[data-forum-logout]").click();
 await expect(section.locator("[data-forum-auth-gate] > summary")).toBeVisible();
 await expect(section.locator("[data-forum-register]")).toBeHidden();
 await page.reload();
 await expect(section.locator("[data-forum-auth-gate] > summary")).toBeVisible();
 await expect(section.locator("[data-forum-register]")).toBeHidden();
});
