import {test,expect} from "@playwright/test";

test("Turkish forum offers password, email OTP and enabled social sign-in without removing the old flow",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>
  route.fulfill({json:{external:{google:true,github:true}}}));
 await page.goto("/tr/forum/");
 await expect(page.locator("[data-forum-register]")).toBeHidden();
 await page.locator("[data-forum-auth-gate] > summary").click();
 await expect(page.locator("[data-forum-register]")).toBeVisible();
 await expect(page.locator("[data-forum-password]")).toBeHidden();
 await page.locator("[data-forum-auth-gate] > summary").click();
 await page.locator("[data-password-choice] summary").click();
 await expect(page.locator("[data-forum-password] input[name=password]")).toBeVisible();
 await expect(page.locator('[data-forum-oauth="google"]')).toBeVisible();
 await expect(page.locator('[data-forum-oauth="github"]')).toBeVisible();
 await expect(page.locator("[data-community-members]")).toBeVisible();
 await expect(page.locator("[data-member-toolbar-avatar]")).toBeVisible();
 await expect(page.locator("[data-member-guest]")).toBeHidden();
 await expect(page.locator("[data-member-grid]")).toBeHidden();
 await expect(page.locator("[data-member-form]")).toBeHidden();
});

test("social buttons stay safely hidden when providers are disabled or configuration is unavailable",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>
  route.fulfill({json:{external:{google:false,github:false}}}));
 await page.goto("/tr/forum/");
 await page.locator("[data-forum-auth-gate] > summary").click();
 await expect(page.locator('[data-forum-oauth="google"]')).toBeHidden();
 await expect(page.locator('[data-forum-oauth="github"]')).toBeHidden();
 await expect(page.locator("[data-oauth-unavailable]")).toBeVisible();
 await expect(page.locator("[data-forum-register]")).toBeHidden();
 await page.locator("[data-forum-auth-gate] > summary").click();
 await expect(page.locator("[data-forum-register]")).toBeVisible();
 await page.reload();
 await page.locator("[data-forum-auth-gate] > summary").click();
 await expect(page.locator("[data-oauth-unavailable]")).toBeVisible();
});
test("providers are shown independently when only Google is enabled",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>
  route.fulfill({json:{external:{google:true,github:false}}}));
 await page.goto("/tr/forum/");
 await page.locator("[data-forum-auth-gate] > summary").click();
 await expect(page.locator('[data-forum-oauth="google"]')).toBeVisible();
 await expect(page.locator('[data-forum-oauth="github"]')).toBeHidden();
});
test("forum topics and posting precede collapsed profile and leaderboard on a fresh visit",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>
  route.fulfill({json:{external:{google:false,github:false}}}));
 await page.goto("/tr/forum/");
 await expect(page.locator("[data-member-form]")).toBeHidden();
 await expect(page.locator("[data-member-grid]")).toBeHidden();
 await expect(page.locator("[data-member-toolbar-avatar]")).toHaveAttribute("src","/images/forum-member-default.svg");
 const ordered=await page.evaluate(()=>{
  const compose=document.querySelector("#forum-compose");
  const members=document.querySelector("#forum-members");
  if(!compose||!members)return false;
  return Boolean(compose.compareDocumentPosition(members)&Node.DOCUMENT_POSITION_FOLLOWING);
 });
 expect(ordered).toBe(true);
 await page.locator("[data-member-leaders-toggle]").click();
 await expect(page.locator("[data-member-leaders]")).toBeVisible();
 await expect(page.locator("[data-member-grid]")).toBeVisible();
 await page.locator("[data-member-leaders-toggle]").click();
 await expect(page.locator("[data-member-grid]")).toBeHidden();
});

test("leaderboard is meaningful, opt-in and changes monthly/lifetime sort",async({page})=>{
 await page.route("**/forum-test-api/rest/v1/tc_member_scores?**",async route=>{
  await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify([
   {id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",handle:"ayse",display_name:"Ayşe",avatar_path:null,
    show_leaderboard:true,score_total:45,score_30d:8,topic_count:10,reply_count:7,helpful_votes:1},
   {id:"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",handle:"mehmet",display_name:"Mehmet",avatar_path:null,
    show_leaderboard:true,score_total:30,score_30d:19,topic_count:3,reply_count:9,helpful_votes:2}
  ])});
 });
 await page.goto("/tr/forum/");
 await page.locator("[data-member-leaders-toggle]").click();
 await expect(page.locator("[data-member-leaders]")).toBeVisible();
 const rank=page.locator("[data-leaders] li");
 await expect(rank).toHaveCount(2);
 await expect(rank.first()).toContainText("Mehmet");
 await page.locator('[data-rank-mode="all"]').click();
 await expect(rank.first()).toContainText("Ayşe");
 await expect(page.locator('[data-rank-mode="all"]')).toHaveAttribute("aria-pressed","true");
});

test("password sign-in opens forum with default avatar and only optional profile editing",async({page})=>{
 const memberId="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
 await page.route("**/forum-test-api/**",async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith("/auth/v1/token")&&url.searchParams.get("grant_type")==="password"){
   return route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({access_token:"fixture-session",refresh_token:"fixture-refresh"})});
  }
  if(url.pathname.endsWith("/auth/v1/user")){
   return route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({id:memberId,email:"not-public@example.test"})});
  }
  if(url.pathname.endsWith("/rest/v1/tc_member_profiles")){
   return route.fulfill({status:200,contentType:"application/json",body:"[]"});
  }
  if(url.pathname.endsWith("/rest/v1/tc_member_scores") ||
     url.pathname.endsWith("/rest/v1/tc_member_bookmarks")){
   return route.fulfill({status:200,contentType:"application/json",body:"[]"});
  }
  return route.fulfill({status:404,contentType:"application/json",body:"{}"});
 });
 await page.goto("/tr/forum/");
 await page.locator("[data-forum-auth-gate] > summary").click();
 await page.locator("[data-password-choice] summary").click();
 await page.locator("[data-forum-password] input[name=email]").fill("not-public@example.test");
 await page.locator("[data-forum-password] input[name=password]").fill("long-example-password-for-test");
 await page.locator('[data-forum-password] button[value="signin"]').click();
 await expect(page.locator("[data-member-toolbar-name]")).toHaveText("Topluluk üyesi");
 await expect(page.locator("[data-member-toolbar-avatar]")).toHaveAttribute("src","/images/forum-member-default.svg");
 await expect(page.locator("[data-member-form]")).toBeHidden();
 await expect(page.locator("[data-member-edit]")).toBeVisible();
 await expect(page.locator("[data-member-guest]")).toBeHidden();
 await expect(page.locator("[data-forum-post]")).toBeVisible();
 await page.locator("[data-member-edit]").click();
 await expect(page.locator("[data-member-form]")).toBeVisible();
 await expect(page.locator("[data-member-form] input[name=handle]")).toBeVisible();
 await expect(page.locator("[data-leaders]")).not.toContainText("not-public@example.test");
 await expect(page.locator("[data-forum-password]")).toBeHidden();
});
