import {test,expect} from "@playwright/test";
test("forum model filters, activity ordering and progressive browsing combine without losing public cards",async({page})=>{
 await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
 const grid=page.locator("[data-forum-live-grid]");
 await expect(grid).toHaveCount(1);
 await page.evaluate(()=>{
  const root=document.querySelector("[data-forum-live-root]");
  const grid=root.querySelector("[data-forum-live-grid]");
  const modelA="11111111-1111-4111-8111-111111111111";
  const modelB="22222222-2222-4222-8222-222222222222";
  for(let i=0;i<30;i++){
   const card=document.createElement("article");card.className="community-topic";
   card.dataset.forumTopic="";card.dataset.forumTopicId="fixture-"+i;
   card.dataset.forumTopicCategory="questions";card.dataset.forumReplyCount="0";
   card.dataset.forumPublishedAt=new Date(Date.UTC(2026,0,i+1)).toISOString();
   card.dataset.forumActivityAt=new Date(Date.UTC(2026,1,30-i)).toISOString();
   card.dataset.forumModelId=i<26?modelA:modelB;card.dataset.forumModelLabel=i<26?"Fixture 1":"Fixture 2";
   card.dataset.forumSearch=i<26?"fixture one":"fixture two";card.textContent="Fixture "+i;grid.append(card);
  }
  root.hidden=false;grid.hidden=false;
  document.dispatchEvent(new Event("tractorvs-forum-live-updated"));
 });
 const filter=page.locator("[data-forum-model-filter]");
 await expect(filter.locator("option")).toHaveCount(3);
 await filter.selectOption("11111111-1111-4111-8111-111111111111");
 await expect(grid.locator("[data-forum-topic]:not([hidden])")).toHaveCount(24);
 await expect(page.locator("[data-forum-page-count]")).toContainText("24/26");
 await page.locator("[data-forum-show-more]").click();
 await expect(grid.locator("[data-forum-topic]:not([hidden])")).toHaveCount(26);
 await page.locator("[data-forum-sort]").selectOption("activity");
 await expect(grid.locator("[data-forum-topic]:not([hidden])").first()).toHaveText("Fixture 0");
 await filter.selectOption("22222222-2222-4222-8222-222222222222");
 await expect(grid.locator("[data-forum-topic]:not([hidden])")).toHaveCount(4);
 await page.locator("[data-forum-clear]").click();
 await expect(grid.locator("[data-forum-topic]:not([hidden])")).toHaveCount(24);
 await expect(grid.locator("[data-forum-topic]")).toHaveCount(30);
});
