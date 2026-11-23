import {test,expect} from "@playwright/test";

const topic={
 id:"7a6625c2-0375-4ab3-a29b-5f18a58cda31",
 topic_id:"7a6625c2-0375-4ab3-a29b-5f18a58cda31",
 locale:"tr",original_locale:"tr",status:"published",
 slug:"2026-sektor-haberleri-forum-test-7a6625c203754ab3a29b5f18a58cda31",
 title:"2026 Traktör Sektör Haberleri",
 body:"Traktör sektöründe doğrulanmış yeni modellerin teknik özelliklerini ve üretici açıklamalarını tartışıyoruz.",
 category:"news",created_at:"2026-11-22T15:00:00Z",machine_translated:false
};
test("zero-result maintenance filter shows recovery without hiding real topics permanently",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.route("**/forum-test-api/rest/v1/tc_forum_localized_topics?**",route=>
   route.fulfill({json:[topic]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 const cards=page.locator("[data-forum-live-grid] [data-forum-topic]");
 await expect(cards).toHaveCount(1);
 const maintenance=page.locator('[data-forum-rail-category="maintenance"]');
 await maintenance.click();
 await expect(maintenance).toHaveAttribute("aria-pressed","true");
 await expect(cards.first()).toBeHidden();
 await expect(page.locator("#forum-no-results")).toBeVisible();
 const help=page.locator("[data-forum-empty-help]");
 await expect(help).toBeVisible();
 await expect(help.locator("[data-forum-show-all]")).toBeVisible();
 await expect(page.locator("[data-forum-match-count]")).toContainText("0");
 await help.locator("[data-forum-show-all]").click();
 await expect(maintenance).toHaveAttribute("aria-pressed","false");
 await expect(page.locator('[data-forum-category="all"]')).toHaveAttribute("aria-pressed","true");
 await expect(page.locator("#forum-filter")).toBeFocused();
 await expect(cards.first()).toBeVisible();
 await expect(help).toBeHidden();
});
test("long search mismatch has usable mobile recovery and no horizontal overflow",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route("**/forum-test-api/rest/v1/tc_forum_localized_topics?**",route=>
   route.fulfill({json:[topic]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 await expect(page.locator("[data-forum-live-grid] [data-forum-topic]")).toHaveCount(1);
 await page.locator("#forum-filter").fill("hicbir-konuyla-eslesmeyen-ifade");
 const help=page.locator("[data-forum-empty-help]");
 await expect(help).toBeVisible();
 const btn=help.locator("[data-forum-show-all]");
 await expect(btn).toBeVisible();
 expect(await btn.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 const widths=await page.evaluate(()=>({screen:innerWidth,page:document.documentElement.scrollWidth}));
 expect(widths.page).toBeLessThanOrEqual(widths.screen+2);
 await btn.click();
 await expect(page.locator("#forum-filter")).toHaveValue("");
 await expect(page.locator("[data-forum-live-grid] [data-forum-topic]")).toBeVisible();
});
