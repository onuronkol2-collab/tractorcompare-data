import {test,expect} from "@playwright/test";

test("a new Google/email member gets a private-safe pseudonymous starter profile without onboarding",async({page})=>{
 const id="11111111-2222-4333-8444-555555555555";
 const profiles=[];
 let created=0;
 await page.route("**/forum-test-api/**",async route=>{
  const u=new URL(route.request().url());
  if(u.pathname.endsWith("/auth/v1/settings"))
   return route.fulfill({json:{external:{google:true,github:false}}});
  if(u.pathname.endsWith("/auth/v1/token")&&u.searchParams.get("grant_type")==="password")
   return route.fulfill({json:{access_token:"test-session",refresh_token:"test-refresh"}});
  if(u.pathname.endsWith("/auth/v1/user"))
   return route.fulfill({json:{id,email:"never-publish@example.test",user_metadata:{full_name:"Sensitive OAuth Name",avatar_url:"https://example.test/personal.jpg"}}});
  if(u.pathname.endsWith("/rest/v1/tc_member_profiles")){
   if(route.request().method()==="POST"){
    const body=route.request().postDataJSON();
    expect(body.id).toBe(id);
    expect(body.handle).toMatch(/^member_[0-9a-f]{16}$/);
    expect(body.display_name).toBe("TractorVS Member");
    expect(body.avatar_path).toBeNull();
    expect(JSON.stringify(body)).not.toContain("never-publish@example.test");
    expect(JSON.stringify(body)).not.toContain("Sensitive OAuth Name");
    expect(JSON.stringify(body)).not.toContain("personal.jpg");
    created++;
    profiles.splice(0,profiles.length,body);
    return route.fulfill({status:201,json:[body]});
   }
   return route.fulfill({json:profiles});
  }
  if(u.pathname.endsWith("/rest/v1/tc_member_scores"))
   return route.fulfill({json:[]});
  if(u.pathname.endsWith("/rest/v1/tc_member_bookmarks")||
     u.pathname.endsWith("/rest/v1/tc_member_topic_follows"))
   return route.fulfill({json:[]});
  return route.fulfill({status:404,json:{}});
 });
 await page.goto("/tr/forum/");
 await page.locator("[data-password-choice] summary").click();
 await page.locator("[data-forum-password] input[name=email]").fill("never-publish@example.test");
 await page.locator("[data-forum-password] input[name=password]").fill("strong-password-for-fixture");
 await page.locator('[data-forum-password] button[value="signin"]').click();
 await expect(page.locator("[data-forum-post]")).toBeVisible();
 await expect(page.locator("[data-member-form]")).toBeHidden();
 await expect(page.locator("[data-member-toolbar-avatar]")).toHaveAttribute("src","/images/forum-member-default.svg");
 await expect(page.locator("[data-member-toolbar-name]")).toHaveText("Topluluk üyesi");
 await expect.poll(()=>created).toBe(1);
 await page.reload();
 await expect(page.locator("[data-member-toolbar-name]")).toHaveText("Topluluk üyesi");
 expect(created).toBe(1);
 await page.locator("[data-member-edit]").click();
 await expect(page.locator("[data-member-form]")).toBeVisible();
 await expect(page.locator('[data-member-form] input[name="handle"]')).toHaveValue(profiles[0].handle);
 await expect(page.locator('[data-member-form] input[name="display_name"]')).toHaveValue("");
});

test("a guest sees the forum before optional profile tools and default public avatar",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/settings",route=>
  route.fulfill({json:{external:{google:false,github:false}}}));
 await page.goto("/tr/forum/");
 await expect(page.locator("[data-member-toolbar-avatar]")).toHaveAttribute("src","/images/forum-member-default.svg");
 await expect(page.locator("[data-member-edit]")).toBeHidden();
 await expect(page.locator("[data-member-grid]")).toBeHidden();
 await expect(page.locator("[data-forum-email]")).toBeVisible();
 await page.locator("[data-member-leaders-toggle]").click();
 await expect(page.locator("[data-member-leaders]")).toBeVisible();
 await expect(page.locator("[data-member-form]")).toBeHidden();
});
