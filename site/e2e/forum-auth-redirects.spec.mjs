import {test,expect} from "@playwright/test";

test("password-first signup is prominently visible before forum topics, with a real confirmation field",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>route.fulfill({json:{external:{google:true,github:false}}}));
 await page.goto("/tr/forum/");
 const signup=page.locator("[data-forum-register]");
 await expect(signup).toBeVisible();
 await expect(signup.locator('input[name="password"]')).toHaveAttribute("autocomplete","new-password");
 await expect(signup.locator('input[name="confirm_password"]')).toBeVisible();
 await expect(page.locator("[data-forum-password]")).toBeHidden();
 await expect(page.locator("[data-forum-email]")).toBeHidden();
 const first=await page.evaluate(()=>Boolean(
  document.querySelector("#forum-compose")?.compareDocumentPosition(
  document.querySelector(".community-list"))&Node.DOCUMENT_POSITION_FOLLOWING));
 expect(first).toBe(true);
 await expect(page.locator('a[href="#forum-register-heading"]')).toBeVisible();
});

test("password signup preserves correct redirect_to, requires matching confirmation, never fakes a session",async({page})=>{
 let observed="",count=0;
 await page.route("**/forum-test-api/auth/v1/settings",route=>
  route.fulfill({json:{external:{google:false,github:false}}}));
 await page.route("**/forum-test-api/auth/v1/signup?**",async route=>{
  const u=new URL(route.request().url());
  observed=u.searchParams.get("redirect_to")||"";
  count++;
  expect(route.request().postDataJSON()).toEqual({
   email:"example@example.test",password:"a-very-long-secure-test-password"
  });
  return route.fulfill({json:{user:{id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"},session:null}});
 });
 await page.goto("/tr/forum/");
 const register=page.locator("[data-forum-register]");
 await register.locator('input[name="email"]').fill("example@example.test");
 await register.locator('input[name="password"]').fill("a-very-long-secure-test-password");
 await register.locator('input[name="confirm_password"]').fill("different-long-password");
 await register.locator("button[type=submit]").click();
 await expect(page.locator("[data-forum-status]")).toContainText("eşleşmiyor");
 expect(count).toBe(0);
 await register.locator('input[name="confirm_password"]').fill("a-very-long-secure-test-password");
 await register.locator("button[type=submit]").click();
 await expect(page.locator("[data-signup-confirm]")).toBeVisible();
 await expect(page.locator("[data-forum-status]")).toContainText("Şifren oluşturuldu");
 await expect(page.locator("[data-forum-post]")).toBeHidden();
 expect(observed).toBe("http://127.0.0.1:4173/tr/forum/");
 expect(observed).not.toContain("localhost:3000");
 expect(count).toBe(1);
});

test("signup email can be resent without a new user record and without posting email publicly",async({page})=>{
 let resent=null;
 await page.route("**/forum-test-api/auth/v1/settings",route=>route.fulfill({json:{external:{}}}));
 await page.route("**/forum-test-api/auth/v1/signup?**",route=>
  route.fulfill({json:{user:{id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"},session:null}}));
 await page.route("**/forum-test-api/auth/v1/resend?**",route=>{
  resent={url:route.request().url(),data:route.request().postDataJSON()};
  return route.fulfill({json:{}});
 });
 await page.goto("/tr/forum/");
 const form=page.locator("[data-forum-register]");
 await form.locator('[name="email"]').fill("sample@example.test");
 await form.locator('[name="password"]').fill("valid-new-password-12345");
 await form.locator('[name="confirm_password"]').fill("valid-new-password-12345");
 await form.locator("button[type=submit]").click();
 await expect(page.locator("[data-signup-confirm]")).toBeVisible();
 await page.locator("[data-resend-signup]").click();
 await expect(page.locator("[data-forum-status]")).toContainText("yeni bir e-posta");
 expect(resent?.data).toEqual({type:"signup",email:"sample@example.test"});
 expect(new URL(resent.url).searchParams.get("redirect_to")).toBe("http://127.0.0.1:4173/tr/forum/");
});

test("OTP login stays available as a secondary choice and has correct redirect",async({page})=>{
 let observed="";
 await page.route("**/forum-test-api/auth/v1/settings",route=>route.fulfill({json:{external:{}}}));
 await page.route("**/forum-test-api/auth/v1/otp?**",route=>{
  observed=new URL(route.request().url()).searchParams.get("redirect_to")||"";
  return route.fulfill({json:{}});
 });
 await page.goto("/tr/forum/");
 await page.locator("[data-email-choice] summary").click();
 await page.locator("[data-forum-email] input[name=email]").fill("example@example.test");
 await page.locator("[data-forum-email] button[type=submit]").click();
 await expect(page.locator("[data-mail-step]")).toBeVisible();
 expect(observed).toBe("http://127.0.0.1:4173/tr/forum/");
});

test("a Supabase expired link landing on the root sends the user to a safe forum recovery",async({page})=>{
 await page.goto("/tr/#error=access_denied&error_code=otp_expired&error_description=Expired");
 await expect(page).toHaveURL(/\/tr\/forum\/$/);
 await expect(page.locator("[data-forum-expired-help]")).toBeVisible();
 await expect(page.locator("[data-forum-status]")).toContainText("geçersiz");
 await expect(page.locator("[data-forum-register]")).toBeVisible();
 await expect(page).not.toHaveURL(/otp_expired/);
});

test("an implicit login token sent to the homepage reaches the forum without leaving tokens in URL",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/user",route=>route.fulfill({json:{
  id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"}}));
 await page.goto("/#access_token=fixture-token&refresh_token=fixture-refresh");
 await expect(page.locator("[data-forum-post]")).toBeVisible();
 await expect(page).not.toHaveURL(/access_token|refresh_token/);
});

test("disabled OAuth providers show a human-readable notice but password registration remains visible",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>
  route.fulfill({status:401,json:{message:"Unavailable"}}));
 await page.goto("/tr/forum/");
 await expect(page.locator("[data-oauth-unavailable]")).toBeVisible();
 await expect(page.locator('[data-forum-oauth="google"]')).toBeDisabled();
 await expect(page.locator('[data-forum-oauth="github"]')).toBeDisabled();
 await expect(page.locator("[data-forum-register]")).toBeVisible();
});
