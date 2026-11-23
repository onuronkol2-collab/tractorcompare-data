import {test,expect} from "@playwright/test";

const id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
test("login survives closing the tab; explicit logout removes durable credentials",async({context,page})=>{
 await context.route("**/forum-test-api/**",route=>{
  const pathname=new URL(route.request().url()).pathname;
  if(pathname.endsWith("/auth/v1/user"))
   return route.fulfill({json:{id}});
  if(pathname.endsWith("/auth/v1/logout"))return route.fulfill({status:204});
  if(pathname.endsWith("/auth/v1/settings"))
   return route.fulfill({json:{external:{google:false,github:false}}});
  if(pathname.includes("/tc_member_profiles"))
   return route.fulfill({json:[]});
  if(pathname.includes("/tc_member_scores"))
   return route.fulfill({json:[]});
  return route.fulfill({status:200,json:[]});
 });
 await page.goto("/tr/forum/#access_token=remembered-access&refresh_token=remembered-refresh");
 await expect(page.locator("#forum-compose [data-forum-post]")).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem("tractorvs.forum.session.v2"))).toContain("remembered-refresh");
 await page.close();
 const reopened=await context.newPage();
 await reopened.goto("/tr/forum/");
 await expect(reopened.locator("#forum-compose [data-forum-post]")).toBeVisible();
 await reopened.locator("#forum-compose [data-forum-logout]").click();
 await expect(reopened.locator("#forum-compose [data-forum-auth-gate] > summary")).toBeVisible();
 await expect.poll(async()=>reopened.evaluate(()=>localStorage.getItem("tractorvs.forum.session.v2"))).toBeNull();
 await reopened.close();
 const afterLogout=await context.newPage();
 await afterLogout.goto("/tr/forum/");
 await expect(afterLogout.locator("#forum-compose [data-forum-post]")).toBeHidden();
 await expect(afterLogout.locator("#forum-compose [data-forum-auth-gate] > summary")).toBeVisible();
});

test("newest members appear at forum bottom only if they chose public ranking",async({page})=>{
 await page.route("**/forum-test-api/rest/v1/tc_member_scores?**",route=>
  route.fulfill({json:[
   {id:"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",handle:"older",display_name:"Older",
    created_at:"2026-11-19T12:00:00Z",show_leaderboard:true,avatar_path:null},
   {id:"cccccccc-cccc-4ccc-cccc-cccccccccccc",handle:"hidden",display_name:"Hidden",
    created_at:"2026-11-22T12:00:00Z",show_leaderboard:false,avatar_path:null},
   {id:"dddddddd-dddd-4ddd-dddd-dddddddddddd",handle:"newer",display_name:"Newer",
    created_at:"2026-11-21T12:00:00Z",show_leaderboard:true,avatar_path:null}
  ]})
 );
 await page.goto("/tr/forum/");
 const members=page.locator("[data-recent-members] li");
 await expect(members).toHaveCount(2);
 await expect(members.first()).toContainText("Newer");
 await expect(members.last()).toContainText("Older");
 await expect(page.locator("[data-recent-members]")).not.toContainText("Hidden");
 const order=await page.evaluate(()=>{
  const newMembers=document.querySelector(".member-recent");
  const composer=document.querySelector("#forum-compose");
  return newMembers&&composer?Boolean(composer.compareDocumentPosition(newMembers)&Node.DOCUMENT_POSITION_FOLLOWING):false;
 });
 expect(order).toBeTruthy();
});
