import {test,expect} from "@playwright/test";

test("OTP email request always targets the actual forum callback, not Supabase's localhost default",async({page})=>{
 let observed="";
 await page.route("**/forum-test-api/auth/v1/settings",route=>route.fulfill({json:{external:{google:false,github:false}}}));
 await page.route("**/forum-test-api/auth/v1/otp?**",async route=>{
  const request=new URL(route.request().url());
  observed=request.searchParams.get("redirect_to")||"";
  return route.fulfill({json:{}});
 });
 await page.goto("/tr/forum/");
 await page.locator("[data-forum-email] input[name=email]").fill("example@example.test");
 await page.locator("[data-forum-email] button[type=submit]").click();
 await expect(page.locator("[data-mail-step]")).toBeVisible();
 expect(observed).toBe("http://127.0.0.1:4173/tr/forum/");
 expect(observed).not.toContain("localhost:3000");
});

test("password signup includes correct redirect_to and displays confirmation instead of faking a signed-in session",async({page})=>{
 let observed="";
 await page.route("**/forum-test-api/auth/v1/settings",route=>route.fulfill({json:{external:{google:false,github:false}}}));
 await page.route("**/forum-test-api/auth/v1/signup?**",async route=>{
  const request=new URL(route.request().url());
  observed=request.searchParams.get("redirect_to")||"";
  return route.fulfill({json:{user:{id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"},session:null}});
 });
 await page.goto("/tr/forum/");
 await page.locator("[data-password-choice] summary").click();
 await page.locator("[data-forum-password] input[name=email]").fill("example@example.test");
 await page.locator("[data-forum-password] input[name=password]").fill("a-very-long-secure-test-password");
 await page.locator('[data-forum-password] button[value=signup]').click();
 await expect(page.locator("[data-forum-status]")).toContainText("Yeni hesabını doğrulamak için e-postanı kontrol et.");
 expect(observed).toBe("http://127.0.0.1:4173/tr/forum/");
 await expect(page.locator("[data-forum-post]")).toBeHidden();
});

test("Supabase unavailable settings does not send members to raw JSON provider error page",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>route.fulfill({status:401,json:{message:"Unavailable"}}));
 await page.goto("/tr/forum/");
 await expect(page.locator("[data-oauth-unavailable]")).toBeVisible();
 await expect(page.locator('[data-forum-oauth="google"]')).toBeDisabled();
 await expect(page.locator('[data-forum-oauth="github"]')).toBeDisabled();
 await expect(page.locator("[data-forum-email]")).toBeVisible();
});
