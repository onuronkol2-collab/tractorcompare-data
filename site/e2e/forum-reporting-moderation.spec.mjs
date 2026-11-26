import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
const read=name=>readFileSync(new URL("../src/lib/"+name,import.meta.url),"utf8");
const withoutModules=source=>source.replace(/^import .*;\s*$/gm,"").replace(/^export /gm,"");
const client=[
 withoutModules(read("forum-session-store.mjs")),
 withoutModules(stripTypeScriptTypes(read("forum-reporting-i18n.ts"))),
 withoutModules(stripTypeScriptTypes(read("forum-reporting-client.ts"))),
 'initForumReporting(document.querySelector("[data-forum-reporting]"));'
].join("\n");
async function fixture(page,topicId,queue=false){
 const config={url:"http://127.0.0.1:4173/forum-test-api",key:"inert-browser-fixture",lang:"tr",topicId};
 const content='<article data-report-target=""></article><article data-report-target="33333333-3333-4333-8333-333333333333"></article><div data-forum-reporting hidden data-reporting-config="'+JSON.stringify(config).replace(/"/g,"&quot;")+'">'+(queue?'<section data-report-queue hidden><p data-report-status></p><button data-report-refresh>Refresh</button><ul data-report-list></ul></section>':'')+'</div>';
 await page.route("**/forum-reporting-fixture/?live-forum-test=1",r=>r.fulfill({contentType:"text/html",body:content}));
 await page.goto("/forum-reporting-fixture/?live-forum-test=1");
 await page.addScriptTag({content:client});
}

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
 await fixture(page,undefined,true);
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

test("topic and reply reports require enabled backend and confirmed login; success and quota are honest",async({page})=>{
 let enabled=false,requests=[];
 await page.route("**/forum-test-api/auth/v1/user",r=>r.fulfill({json:{id:owner,is_anonymous:false}}));
 await page.route("**/forum-test-api/rest/v1/tc_forum_reporting_settings?**",r=>r.fulfill({json:[{enabled}]}));
 await page.route("**/forum-test-api/rest/v1/tc_forum_content_reports",async r=>{
  requests.push(r.request().postDataJSON());
  if(requests.length===1)await r.fulfill({status:201,body:""});
  else await r.fulfill({status:400,json:{code:"23514"}});
 });
 await fixture(page,topic);
 let checked=page.waitForResponse("**/forum-test-api/rest/v1/tc_forum_reporting_settings?**");
 await page.evaluate(()=>{sessionStorage.setItem("tractorvs_forum_access","fixture-token");window.dispatchEvent(new Event("tractorvs-forum-session"))});
 await checked;
 await expect(page.locator("[data-report-control]")).toHaveCount(0);
 enabled=true;
 await page.evaluate(()=>window.dispatchEvent(new Event("tractorvs-forum-session")));
 const controls=page.locator("[data-report-control]");
 await expect(controls).toHaveCount(2);
 await controls.first().getByRole("button",{name:"İçeriği bildir"}).click();
 await controls.first().locator("select").selectOption("spam");
 await controls.first().getByRole("button",{name:"Bildir",exact:true}).click();
 await expect(controls.first()).toContainText("Bildirim incelemeye gönderildi");
 expect(requests[0]).toEqual({topic_id:topic,reply_id:null,reason:"spam"});
 await controls.last().getByRole("button",{name:"İçeriği bildir"}).click();
 await controls.last().locator("select").selectOption("unsafe");
 await controls.last().getByRole("button",{name:"Bildir",exact:true}).click();
 await expect(controls.last()).toContainText("Günlük bildirim sınırına ulaştın");
 expect(requests[1]).toEqual({topic_id:topic,reply_id:report,reason:"unsafe"});
 await page.evaluate(()=>{sessionStorage.removeItem("tractorvs_forum_access");window.dispatchEvent(new Event("tractorvs-forum-session"))});
 await expect(controls).toHaveCount(0);
});
