import {test,expect} from "@playwright/test";

const id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const stub=async(page)=>{
 await page.route("**/forum-test-api/**",route=>{
  const pathname=new URL(route.request().url()).pathname;
  if(pathname.endsWith("/auth/v1/user"))return route.fulfill({json:{id}});
  if(pathname.endsWith("/auth/v1/settings"))return route.fulfill({json:{external:{google:false,github:false}}});
  if(pathname.endsWith("/auth/v1/logout"))return route.fulfill({status:204});
  if(pathname.endsWith("/rest/v1/tc_member_profiles")&&route.request().method()==="POST")
   return route.fulfill({status:201,json:[{
     id,handle:"member_aaaaaaaaaaaaaaaa",display_name:"TractorVS Member",
     bio:"",favorite_brand:"",avatar_path:null,show_leaderboard:false
   }]});
  return route.fulfill({json:[]});
 });
};

test("desktop signed-in editor fills center column rather than creating giant blank next to rail",async({page})=>{
 await page.setViewportSize({width:1709,height:900});
 await stub(page);
 await page.goto("/tr/forum/#access_token=fixture-access&refresh_token=fixture-refresh");
 const compose=page.locator(".community-primary-column #forum-compose");
 await expect(compose.locator("[data-forum-post]")).toBeVisible();
 const r=await page.evaluate(()=>{
  const get=q=>document.querySelector(q).getBoundingClientRect();
  const list=get(".community-list"),composer=get("#forum-compose"),sidebar=get(".community-sidebar");
  const container=get(".community-content-grid");
  return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,
   list:{left:list.left,right:list.right,bottom:list.bottom},
   composer:{left:composer.left,right:composer.right,top:composer.top,width:composer.width},
   sidebar:{left:sidebar.left,right:sidebar.right,width:sidebar.width},
   content:{width:container.width}};
 });
 expect(r.pageWidth).toBeLessThanOrEqual(r.viewport+2);
 expect(r.composer.width).toBeGreaterThan(540);
 expect(r.composer.width).toBeGreaterThan(r.sidebar.width*1.5);
 expect(Math.abs(r.composer.left-r.list.left)).toBeLessThanOrEqual(3);
 expect(r.composer.right).toBeLessThanOrEqual(r.list.right+3);
 expect(r.composer.top-r.list.bottom).toBeGreaterThanOrEqual(5);
 expect(r.composer.top-r.list.bottom).toBeLessThan(60);
 expect(r.sidebar.left).toBeGreaterThanOrEqual(r.list.right-3);
});

test("mobile and tablet: posting form is full-width, precedes short sidebar, no overflow",async({page})=>{
 await stub(page);
 for(const width of [390,820]){
  await page.setViewportSize({width,height:844});
  await page.goto("/tr/forum/#access_token=fixture-access&refresh_token=fixture-refresh");
  const editor=page.locator(".forum-primary-composer #forum-compose");
  await expect(editor.locator("[data-forum-post]")).toBeVisible();
  const a=await page.evaluate(()=>{
   const c=document.querySelector("#forum-compose").getBoundingClientRect();
   const side=document.querySelector(".community-sidebar").getBoundingClientRect();
   return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,
    composer:{left:c.left,right:c.right,bottom:c.bottom,width:c.width},sidebarTop:side.top};
  });
  expect(a.pageWidth).toBeLessThanOrEqual(a.viewport+2);
  expect(a.composer.left).toBeGreaterThanOrEqual(0);
  expect(a.composer.right).toBeLessThanOrEqual(a.viewport+2);
  expect(a.sidebarTop).toBeGreaterThanOrEqual(a.composer.bottom-3);
  expect(a.composer.width).toBeGreaterThan(width*.7);
 }
});

test("all locales preserve one reachable new-topic destination",async({page})=>{
 for(const locale of ["en","tr","de","fr","es","pt-br","ru","ja","zh","hi"]){
  const path=locale==="en"?"/forum/":"/"+locale+"/forum/";
  await page.goto(path);
  await expect(page.locator(".community-primary-column #forum-compose")).toHaveCount(1);
  await expect(page.locator(".community-sidebar #forum-compose")).toHaveCount(0);
  await expect(page.locator('.community-hero-links a[href="#forum-compose"]')).toBeVisible();
  await expect(page.locator(".forum-primary-composer #forum-compose h2")).not.toBeEmpty();
 }
});
