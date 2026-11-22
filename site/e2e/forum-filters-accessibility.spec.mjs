import {test,expect} from "@playwright/test";

const make=(locale,category,title,id)=>({
 id,topic_id:id,locale,original_locale:locale,status:"published",
 slug:"2026-yeni-konunun-guvenli-urlsi-"+id.replace(/-/g,""),
 title,body:"Forumdaki motor, şanzıman ve traktör deneyimlerinin ayrıntılı ve kaynaklı karşılaştırması.",
 category,created_at:"2026-11-21T15:00:00Z",machine_translated:false
});
const records=[
 make("tr","maintenance","2026 İŞ MAKİNELERİ ve ŞANZIMAN",
  "3c45305b-5eea-49eb-9d6e-2f3bbb809b66"),
 make("tr","news","2026 Traktör Haberleri ve Yenilikler",
  "7a6625c2-0375-4ab3-a29b-5f18a58cda31")
];

test("Turkish live forum search matches uppercase dotted İ and ASCII query, with reset",async({page})=>{
 await page.route("**/forum-test-api/rest/v1/tc_forum_localized_topics?**",route=>route.fulfill({json:records}));
 await page.goto("/tr/forum/?live-forum-test=1");
 const cards=page.locator("[data-forum-live-grid] [data-forum-topic]");
 await expect(cards).toHaveCount(2);
 const search=page.locator("#forum-filter");
 const clear=page.locator("[data-forum-clear]");
 const count=page.locator("[data-forum-match-count]");
 await search.fill("is makineleri");
 await expect(cards.first()).toBeVisible();
 await expect(cards.last()).toBeHidden();
 await expect(count).toContainText("1 eşleşen konu");
 await expect(clear).toBeVisible();
 await search.fill("sanziman");
 await expect(cards.first()).toBeVisible();
 await search.fill("bulunmayan-kelime-xyz");
 await expect(page.locator("#forum-no-results")).toBeVisible();
 await expect(count).toContainText("0 eşleşen konu");
 await clear.click();
 await expect(search).toHaveValue("");
 await expect(search).toBeFocused();
 await expect(cards.first()).toBeVisible();
 await expect(cards.last()).toBeVisible();
 await expect(clear).toBeHidden();
 await expect(count).toBeHidden();

 const news=page.locator('[data-forum-category="news"]');
 await news.click();
 await expect(cards.first()).toBeHidden();
 await expect(cards.last()).toBeVisible();
 await clear.click();
 await expect(news).toHaveAttribute("aria-pressed","false");
 await expect(page.locator('[data-forum-category="all"]')).toHaveAttribute("aria-pressed","true");
 await expect(cards.first()).toBeVisible();
});

test("public members REST outage is not falsely shown as an empty community; retry works",async({page})=>{
 let online=false;
 await page.route("**/forum-test-api/rest/v1/tc_member_scores?**",route=>{
  if(!online)return route.fulfill({status:503,body:"temporarily unavailable"});
  return route.fulfill({json:[{
   id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
   handle:"tarim_2026",display_name:"Tarım Üyesi",
   bio:"",favorite_brand:"",avatar_path:null,
   created_at:"2026-11-22T12:00:00Z",
   show_leaderboard:true,score_total:15,score_30d:15,
   topic_count:1,reply_count:2,helpful_votes:1
  }]});
 });
 await page.goto("/tr/forum/");
 const recentError=page.locator("[data-recent-members-status]");
 const retryRecent=page.locator("[data-retry-recent]");
 await expect(recentError).toContainText("yüklenemedi");
 await expect(retryRecent).toBeVisible();
 await expect(page.locator("[data-recent-members] li")).toHaveCount(0);
 await page.locator("[data-member-leaders-toggle]").click();
 const retryLeaders=page.locator("[data-retry-leaders]");
 await expect(page.locator("[data-leader-empty]")).toContainText("yüklenemedi");
 await expect(retryLeaders).toBeVisible();
 online=true;
 await retryRecent.click();
 await retryLeaders.click();
 await expect(page.locator("[data-recent-members] li")).toHaveCount(1);
 await expect(page.locator("[data-leaders] li")).toHaveCount(1);
 await expect(retryRecent).toBeHidden();
 await expect(retryLeaders).toBeHidden();
 await expect(recentError).not.toContainText("yüklenemedi");
});
