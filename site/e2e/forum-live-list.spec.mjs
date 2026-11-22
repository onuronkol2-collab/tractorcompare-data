import {test,expect} from "@playwright/test";

const id="49c767e4-c0ce-42a8-a423-6985f770e1b7";
const uuid="3c45305b-5eea-49eb-9d6e-2f3bbb809b66";
function row(overrides={}){
 return {
  id,topic_id:uuid,locale:"tr",original_locale:"tr",status:"published",
  slug:"2026-yeni-konunun-guvenli-urlsi-3c45305b5eea49eb9d6e2f3bbb809b66",
  title:"2026 Yeni Traktör Deneyimi ve Karşılaştırma",
  body:"Gerçek bir traktör kullanım deneyimi, teknik bakım ve servis karşılaştırması. "+
    "Kaynak: https://www.climmar.com/news. ## Notlar\n\n| Marka | Puan |\n| --- | --- |\n| Same | **13,7** |",
  category:"news",created_at:"2026-11-21T15:00:00Z",machine_translated:false,
  ...overrides
 };
}
const path="**/forum-test-api/rest/v1/tc_forum_localized_topics?**";
test("guests can read newly published public topics before static Cloudflare deployment",async({page})=>{
 await page.route(path,route=>route.fulfill({json:[row()]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 const newList=page.locator("[data-forum-live-root]");
 await expect(newList).toBeVisible();
 await expect(newList.locator(".forum-live-topic")).toHaveCount(1);
 await expect(newList.locator(".forum-live-topic h3")).toContainText("Yeni Traktör Deneyimi");
 await expect(page.locator(".community-empty")).toBeHidden();
 const details=newList.locator("details");
 await details.locator("summary").click();
 await expect(details.locator(".forum-live-body")).toContainText("Gerçek bir traktör");
 await expect(details.locator("table th")).toHaveCount(2);
 await expect(details.locator("table td")).toHaveCount(2);
 await expect(details.locator('a[href="https://www.climmar.com/news"]')).toHaveAttribute("rel",/ugc nofollow noopener noreferrer/);
 // No speculative link to an unbuilt /forum/<slug> route.
 await expect(newList.locator("h3 a")).toHaveCount(0);
 await expect(newList.locator(".forum-live-body script")).toHaveCount(0);
});
test("public view enforces locale and published status, rejecting malformed and hidden records",async({page})=>{
 await page.route(path,route=>route.fulfill({json:[
  row({status:"hidden"}),row({id:"malformed",topic_id:"malformed"}),
  row({locale:"en"}),row({body:"short"}),
  row({slug:"../../../admin"}),
 ]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 await expect(page.locator("[data-forum-live-grid] article")).toHaveCount(0);
 await expect(page.locator(".community-empty")).toBeVisible();
});
test("same-tab successful publication event refreshes public reading without a reload",async({page})=>{
 let rows=[];
 let calls=0;
 await page.route(path,route=>{calls++;return route.fulfill({json:rows})});
 await page.goto("/tr/forum/?live-forum-test=1");
 await expect(page.locator(".community-empty")).toBeVisible();
 rows=[row({title:"Anında Okunabilir Gerçek Konu Başlığı"})];
 await page.evaluate(()=>document.dispatchEvent(new Event("tractorvs-forum-topic-saved")));
 await expect(page.locator("[data-forum-live-grid] article")).toHaveCount(1);
 await expect(page.locator("[data-forum-live-grid] h3")).toContainText("Anında Okunabilir");
 expect(calls).toBeGreaterThanOrEqual(2);
});
test("live public view failure retains static fallback and displays an honest notice",async({page})=>{
 await page.route(path,route=>route.fulfill({status:503,json:{message:"outage"}}));
 await page.goto("/tr/forum/?live-forum-test=1");
 await expect(page.locator("[data-forum-live-status]")).toContainText("Canlı konu güncellemesi");
 await expect(page.locator(".community-empty")).toBeVisible();
});
test("public live view never executes user-supplied HTML or unsafe link protocols",async({page})=>{
 await page.route(path,route=>route.fulfill({json:[row({
  body:"Kaynak açıklaması <img src=x onerror=alert(1)>; javascript:alert(1) "+
    "ve https://example.com/belge adresinde kaynak. Veri doğrulama tartışması sürmektedir."
 })]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 await page.locator(".forum-live-topic summary").click();
 await expect(page.locator(".forum-live-body img")).toHaveCount(0);
 await expect(page.locator(".forum-live-body script")).toHaveCount(0);
 await expect(page.locator(".forum-live-body")).toContainText("<img src=x onerror=alert(1)>");
 await expect(page.locator('.forum-live-body a[href^="javascript:"]')).toHaveCount(0);
 await expect(page.locator('.forum-live-body a[href="https://example.com/belge"]')).toHaveAttribute("rel",/ugc nofollow/);
});

test("forum categories and search respond to clicks for new public topics",async({page})=>{
 const maintenance=row({
  id:"8f8118b4-5773-4dc6-826d-174d7a732cbb",
  topic_id:"7a6625c2-0375-4ab3-a29b-5f18a58cda31",
  slug:"2026-bakim-deneyimi-7a6625c203754ab3a29b5f18a58cda31",
  category:"maintenance",
  title:"2026 Traktör Motor Bakımı ve Servis Deneyimleri",
  body:"Traktörde motor bakımı, filtre değişimi ve dönemlik servis kayıtları hakkında kendi gözlemlerim."
 });
 await page.route(path,route=>route.fulfill({json:[row(),maintenance]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 const cards=page.locator("[data-forum-live-grid] [data-forum-topic]");
 const news=page.locator('[data-forum-live-grid] [data-forum-topic][data-forum-topic-category="news"]');
 const upkeep=page.locator('[data-forum-live-grid] [data-forum-topic][data-forum-topic-category="maintenance"]');
 await expect(cards).toHaveCount(2);
 await expect(news).toBeVisible();
 await expect(upkeep).toBeVisible();

 const maintenanceTab=page.locator('[data-forum-category="maintenance"]');
 await maintenanceTab.click();
 await expect(maintenanceTab).toHaveAttribute("aria-pressed","true");
 await expect(upkeep).toBeVisible();
 await expect(news).toBeHidden();

 const search=page.locator("#forum-filter");
 await search.fill("kelime-olmayan-arama-12345");
 await expect(upkeep).toBeHidden();
 await expect(page.locator("#forum-no-results")).toBeVisible();

 await search.fill("motor");
 await expect(upkeep).toBeVisible();
 await expect(news).toBeHidden();
 await expect(page.locator("#forum-no-results")).toBeHidden();

 await search.fill("");
 const all=page.locator('[data-forum-category="all"]');
 await all.click();
 await expect(all).toHaveAttribute("aria-pressed","true");
 await expect(maintenanceTab).toHaveAttribute("aria-pressed","false");
 await expect(news).toBeVisible();
 await expect(upkeep).toBeVisible();
});
