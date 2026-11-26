import {test,expect} from "@playwright/test";
const owner="11111111-1111-4111-8111-111111111111";
const topic="22222222-2222-4222-8222-222222222222";
const report="33333333-3333-4333-8333-333333333333";
test("moderation queue is hidden from guests and unenrolled users",async({page})=>{
 await page.goto("/tr/forum/?live-forum-test=1");
 await expect(page.locator("[data-forum-reporting]")).toBeHidden();
 await page.route("**/forum-test-api/auth/v1/user",r=>r.fulfill({json:{id:owner,is_anonymous:false}}));
 await page.route("**/forum-test-api/rest/v1/tc_forum_reporting_settings?**",r=>r.fulfill({json:[{enabled:true}]}));
 await page.route("**/forum-test-api/rest/v1/tc_forum_moderation_members?**",r=>r.fulfill({json:[]}));
 await page.evaluate(()=>{sessionStorage.setItem("tractorvs_forum_access","fixture-token");window.dispatchEvent(new Event("tractorvs-forum-session"))});
 await expect(page.locator("[data-forum-reporting]")).toBeHidden();
});
test("enrolled moderator can review queue without reporter identity or arbitrary links",async({page})=>{
 await page.route("**/forum-test-api/auth/v1/user",r=>r.fulfill({json:{id:owner,is_anonymous:false}}));
 await page.route("**/forum-test-api/rest/v1/tc_forum_reporting_settings?**",r=>r.fulfill({json:[{enabled:true}]}));
 await page.route("**/forum-test-api/rest/v1/tc_forum_moderation_members?**",r=>r.fulfill({json:[{member_id:owner,active:true}]}));
 let reviewed=false;
 await page.route("**/forum-test-api/rest/v1/tc_forum_content_reports?**",async r=>{
  const request=r.request();expect(new URL(request.url()).searchParams.get("select")).not.toContain("reporter_id");
  if(request.method()==="PATCH"){expect(request.postDataJSON()).toEqual({status:"reviewed"});reviewed=true;await r.fulfill({json:[{id:report,status:"reviewed"}]});}
  else await r.fulfill({json:reviewed?[]:[{id:report,topic_id:topic,reply_id:null,reason:"spam",status:"pending",created_at:"2026-11-26T00:00:00Z"}]});
 });
 await page.route("**/forum-test-api/rest/v1/tc_forum_localized_topics?**",r=>r.fulfill({json:[{topic_id:topic,slug:"fixture-topic",title:"Deneme konusu",locale:"tr",status:"published"}]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 await page.evaluate(()=>{sessionStorage.setItem("tractorvs_forum_access","fixture-token");window.dispatchEvent(new Event("tractorvs-forum-session"))});
 const queue=page.locator("[data-report-queue]");
 await expect(queue).toBeVisible();
 await expect(queue.getByRole("link",{name:"Deneme konusu"})).toHaveAttribute("href","/tr/forum/fixture-topic/");
 await queue.getByRole("button",{name:"İncelendi olarak işaretle"}).click();
 await expect(queue.locator("[data-report-status]")).toContainText("İnceleme kaydedildi");
 await expect(queue.locator("li")).toHaveCount(0);
 await page.evaluate(()=>{sessionStorage.removeItem("tractorvs_forum_access");window.dispatchEvent(new Event("tractorvs-forum-session"))});
 await expect(queue).toBeHidden();
});
