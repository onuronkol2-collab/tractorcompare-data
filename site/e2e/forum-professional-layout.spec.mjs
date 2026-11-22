import {test,expect} from "@playwright/test";

const pages=["/forum/","/tr/forum/","/de/forum/","/ja/forum/"];
test("professional forum workspace is responsive and keeps all essential actions",async({page})=>{
 for(const pathname of pages){
  await page.goto(pathname);
  const shell=page.locator(".community-shell");
  await expect(shell).toBeVisible();
  await expect(shell.locator("h1")).toHaveCount(1);
  if((page.viewportSize()?.width||0)<=640)
   await expect(shell.locator(".community-hero-panel")).toBeHidden();
  else
   await expect(shell.locator(".community-hero-panel")).toBeVisible();
  await expect(shell.locator(".community-sidebar #forum-compose")).toBeVisible();
  await expect(shell.locator(".member-community")).toBeVisible();
  await expect(shell.locator(".member-recent")).toBeVisible();
  await expect(shell.locator('[data-forum-auth-gate] > summary')).toBeVisible();
  await expect(shell.locator('[data-forum-register]')).toBeHidden();
  const measured=await page.evaluate(()=>{
   const section=document.querySelector(".community-list").getBoundingClientRect();
   const sidebar=document.querySelector(".community-sidebar").getBoundingClientRect();
   const hero=document.querySelector(".community-hero-panel").getBoundingClientRect();
   return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
    section:{right:section.right,bottom:section.bottom},
    sidebar:{left:sidebar.left,top:sidebar.top,right:sidebar.right},
    heroRight:hero.right};
  });
  expect(measured.scrollWidth).toBeLessThanOrEqual(measured.viewport+2);
  expect(measured.heroRight).toBeLessThanOrEqual(measured.viewport+1);
  if(measured.viewport>=961){
   expect(measured.sidebar.left).toBeGreaterThan(measured.section.right-2);
  }else{
   expect(measured.sidebar.top).toBeGreaterThanOrEqual(measured.section.bottom-3);
  }
 }
});

test("forum navigation, sign-in and category controls remain keyboard and pointer usable",async({page})=>{
 await page.goto("/tr/forum/");
 const composer=page.locator("#forum-compose");
 await page.locator('.community-hero-links a[href="#forum-compose"]').click();
 await expect(page).toHaveURL(/#forum-compose$/);
 await expect(composer.locator('[data-forum-auth-gate]')).toHaveAttribute("open","");
 await expect(composer.locator('[data-forum-register]')).toBeVisible();
 await composer.locator('[data-password-choice] summary').click();
 await expect(composer.locator('[data-forum-password] input[name="password"]')).toBeVisible();
 const leaderboard=page.locator("[data-member-leaders-toggle]");
 await leaderboard.click();
 await expect(leaderboard).toHaveAttribute("aria-expanded","true");
 await expect(page.locator("[data-member-leaders]")).toBeVisible();
 await leaderboard.click();
 await expect(leaderboard).toHaveAttribute("aria-expanded","false");
 await expect(page.locator("[data-member-leaders]")).toBeHidden();
});
