import { test, expect } from "@playwright/test";

test("an invalid refresh token offers a new email link and hides URL credentials",async({page})=>{
 let renewalAttempts=0;
 await page.route("**/forum-test-api/auth/v1/user",route=>
  route.fulfill({status:401,json:{message:"expired"}})
 );
 await page.route("**/forum-test-api/auth/v1/token?grant_type=refresh_token",route=>{
  renewalAttempts++;
  return route.fulfill({status:400,json:{message:"invalid token"}});
 });
 await page.goto("/tr/forum/#access_token=expired-fixture&refresh_token=invalid-fixture");
 const composer=page.locator("#forum-compose");
 await expect(composer.locator("[data-forum-status]")).toContainText("Yeni bir bağlantı iste");
 await expect(composer.locator("[data-forum-register]")).toBeVisible();
 await expect(composer.locator("[data-forum-email]")).toBeHidden();
 await expect(composer.locator("[data-forum-post]")).toBeHidden();
 await expect(page).not.toHaveURL(/access_token|refresh_token/);
 expect(renewalAttempts).toBe(1);
 await page.reload();
 // On a normal reload the reader-first forum must keep registration closed.
 await expect(composer.locator("[data-forum-auth-gate] > summary")).toBeVisible();
 await expect(composer.locator("[data-forum-register]")).toBeHidden();
 await composer.locator("[data-forum-auth-gate] > summary").click();
 await expect(composer.locator("[data-forum-register]")).toBeVisible();
 await expect(composer.locator("[data-forum-email]")).toBeHidden();
 await expect(composer.locator("[data-forum-post]")).toBeHidden();
 expect(renewalAttempts).toBe(1);
});
