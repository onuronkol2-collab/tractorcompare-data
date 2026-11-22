import {test,expect} from "@playwright/test";
const firstId="49c767e4-c0ce-42a8-a423-6985f770e1b7";
const firstTopic="3c45305b-5eea-49eb-9d6e-2f3bbb809b66";
const secondId="8f8118b4-5773-4dc6-826d-174d7a732cbb";
const secondTopic="7a6625c2-0375-4ab3-a29b-5f18a58cda31";
const make=(id,topic_id,slug,category,title)=>({
 id,topic_id,locale:"tr",original_locale:"tr",status:"published",
 slug,title,category,body:"Bu soru gerçek traktör bakım, onarım ve karşılaştırma deneyimleri hakkındadır. Forumda ayrıntıları ve kaynakları paylaşabilirsiniz.",
 created_at:"2026-11-21T15:00:00Z",machine_translated:false,seo_ready:false
});
const rows=[
 make(firstId,firstTopic,"2026-deneyim-bakim-"+firstTopic.replace(/-/g,""),"maintenance","2026 Massey Ferguson 4708 hidrolik bakım sorusu"),
 make(secondId,secondTopic,"2026-yeni-tractor-"+secondTopic.replace(/-/g,""),"comparison","John Deere 5075E ile New Holland TD5.90 karşılaştırması")
];
const pattern="**/forum-test-api/rest/v1/tc_forum_localized_topics?**";
test("real public-only topics survive redesign, navigation and honest extra tabs",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.route(pattern,route=>route.fulfill({json:rows}));
 await page.goto("/tr/forum/?live-forum-test=1");
 const live=page.locator("[data-forum-live-grid] [data-forum-topic]");
 await expect(live).toHaveCount(2);
 const views=page.locator(".forum-view-tabs");
 await expect(views).toBeVisible();
 await expect(page.locator(".forum-dashboard-rail")).toBeVisible();
 await expect(page.locator(".forum-dashboard-panels")).toBeVisible();
 await views.locator('[data-forum-view="popular"]').click();
 await expect(views.locator('[data-forum-view="popular"]')).toHaveAttribute("aria-pressed","true");
 await expect(live).toHaveCount(2);
 await views.locator('[data-forum-view="unanswered"]').click();
 // Live-only topics do not yet have a verified reply count. Never falsely label them unanswered.
 await expect(live.first()).toBeHidden();
 await expect(live.last()).toBeHidden();
 await expect(page.locator('[data-forum-special="browse"]')).toBeVisible();
 await views.locator('[data-forum-view="events"]').click();
 await expect(page.locator('[data-forum-special="events"]')).toBeVisible();
 await expect(page.locator('[data-forum-special="events"]')).toContainText("Henüz");
 await expect(page.locator("[data-forum-live-root]")).toBeHidden();
 await views.locator('[data-forum-view="following"]').click();
 await expect(page.locator('[data-forum-special="following"]')).toBeVisible();
 await expect(page.locator('[data-forum-special="following"] a[href="#forum-compose"]')).toBeVisible();
 await views.locator('[data-forum-view="latest"]').click();
 await expect(live).toHaveCount(2);
 await expect(page.locator("#forum-compose")).toBeVisible();
 await expect(page.locator(".member-community")).toBeVisible();
});
test("filter sidebar, compact tags and old category buttons stay synchronized",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.route(pattern,route=>route.fulfill({json:rows}));
 await page.goto("/tr/forum/?live-forum-test=1");
 const live=page.locator("[data-forum-live-grid] [data-forum-topic]");
 await expect(live).toHaveCount(2);
 await page.locator('[data-forum-rail-category="maintenance"]').click();
 await expect(page.locator('[data-forum-rail-category="maintenance"]')).toHaveAttribute("aria-pressed","true");
 await expect(page.locator('[data-forum-category="maintenance"]')).toHaveAttribute("aria-pressed","true");
 await expect(live.first()).toBeVisible();
 await expect(live.last()).toBeHidden();
 await page.locator('[data-forum-category="all"]').click();
 await expect(live.last()).toBeVisible();
 await page.locator('[data-forum-tag-category="comparison"]').click();
 await expect(live.first()).toBeHidden();
 await expect(live.last()).toBeVisible();
 await page.locator('[data-forum-clear]').click();
 await expect(live.first()).toBeVisible();
});
test("all locales expose the same five navigable views with localized copy",async({page})=>{
 for(const lang of ["en","tr","de","fr","es","pt-br","ru","ja","zh","hi"]){
  const path=lang==="en"?"/forum/":"/"+lang+"/forum/";
  await page.goto(path);
  const tabs=page.locator("[data-forum-view]");
  await expect(tabs).toHaveCount(5);
  await tabs.nth(4).click();
  await expect(page.locator('[data-forum-special="events"]')).toBeVisible();
  await expect(page.locator('[data-forum-special="events"] p').first()).not.toBeEmpty();
  await tabs.nth(3).click();
  await expect(page.locator('[data-forum-special="following"] p')).not.toBeEmpty();
 }
});
test("mobile cards and tabs have no horizontal document overflow",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route(pattern,route=>route.fulfill({json:rows}));
 await page.goto("/tr/forum/?live-forum-test=1");
 await expect(page.locator("[data-forum-live-grid] [data-forum-topic]")).toHaveCount(2);
 await expect(page.locator(".forum-view-tabs")).toBeVisible();
 await expect(page.locator(".forum-dashboard-rail")).toBeHidden();
 await expect(page.locator('[data-forum-category="maintenance"]')).toBeVisible();
 const g=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
 expect(g.width).toBeLessThanOrEqual(g.viewport+2);
});
