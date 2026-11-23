import {test,expect} from "@playwright/test";

test("public newest-member list loads, optional ranking waits until opening",async({page})=>{
 let rankingRequests=0,recentRequests=0;
 await page.route("**/forum-test-api/rest/v1/tc_member_scores?**",route=>{
  // Recent profile cards now include public score fields; distinguish the
  // optional ranking request by ordering, not selected column names.
  const query=new URL(route.request().url()).searchParams;
  if(query.get("order")==="created_at.desc")recentRequests++;
  else if((query.get("order")||"").includes("score_30d.desc"))rankingRequests++;
  else throw Error("Unexpected member scores query shape");
  return route.fulfill({json:[]});
 });
 await page.goto("/tr/forum/");
 await expect.poll(()=>recentRequests).toBe(1);
 expect(rankingRequests).toBe(0);
 const toggle=page.locator("[data-member-leaders-toggle]");
 await toggle.click();
 await expect(page.locator("[data-member-leaders]")).toBeVisible();
 await expect.poll(()=>rankingRequests).toBe(1);
 await toggle.click();
 await toggle.click();
 expect(rankingRequests).toBe(1);
});

test("private member activity is loaded only after choosing activity",async({page})=>{
 const id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
 let privateRequests=0;
 await page.route("**/forum-test-api/**",route=>{
  const url=new URL(route.request().url());
  if(url.pathname.endsWith("/auth/v1/user"))return route.fulfill({json:{id}});
  if(url.pathname.includes("/tc_member_bookmarks")||url.pathname.includes("/tc_member_topic_follows")){
   privateRequests++;return route.fulfill({json:[]});
  }
  if(url.pathname.includes("/tc_member_profiles"))return route.fulfill({json:[{
   id,handle:"member_aaaaaaaaaaaaaaaa",display_name:"TractorVS Member",
   avatar_path:null,bio:"",favorite_brand:"",show_leaderboard:false
  }]});
  if(url.pathname.endsWith("/auth/v1/settings"))return route.fulfill({json:{external:{google:false,github:false}}});
  return route.fulfill({json:[]});
 });
 await page.goto("/tr/forum/#access_token=fixture-access&refresh_token=fixture-refresh");
 await expect(page.locator("[data-member-activity]")).toBeVisible();
 expect(privateRequests).toBe(0);
 await page.locator("[data-member-activity]").click();
 await expect.poll(()=>privateRequests).toBeGreaterThan(0);
});
