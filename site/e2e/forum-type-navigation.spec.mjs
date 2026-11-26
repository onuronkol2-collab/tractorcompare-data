import {test,expect} from "@playwright/test";
import {FORUM_VIEWS} from "../src/lib/forum-community.mjs";
const font=async(locator)=>locator.evaluate(el=>Number.parseFloat(getComputedStyle(el).fontSize));

test("forum dashboard typography is readable on desktop, preserving key actions",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/tr/forum/");
 await expect(page.locator(".community-shell h1")).toHaveCount(1);
 await expect(page.locator(".forum-dashboard-rail")).toBeVisible();
 await expect(page.locator(".forum-dashboard-panels")).toBeVisible();
 expect(await font(page.locator(".forum-category-link").first())).toBeGreaterThanOrEqual(14);
 expect(await font(page.locator(".forum-view-button").first())).toBeGreaterThanOrEqual(14);
 expect(await font(page.locator(".forum-side-panel>p").first())).toBeGreaterThanOrEqual(14);
 expect(await font(page.locator(".member-toolbar-identity small").first())).toBeGreaterThanOrEqual(13.5);
 await expect(page.locator(".community-primary-column #forum-compose")).toBeVisible();
 await expect(page.locator(".member-community")).toBeVisible();
 const dom=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 expect(dom.scroll).toBeLessThanOrEqual(dom.viewport+2);
});
test("compact mobile dashboard has legible navigation, no horizontal overflow and touch-friendly categories",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 // Preview builds intentionally have no public forum posts: inject an approved
 // test-only live feed item to exercise visible category filters.
 await page.route("**/forum-test-api/rest/v1/tc_forum_localized_topics?**",route=>
  route.fulfill({json:[{
   id:"49c767e4-c0ce-42a8-a423-6985f770e1b7",
   topic_id:"3c45305b-5eea-49eb-9d6e-2f3bbb809b66",
   locale:"tr",original_locale:"tr",status:"published",machine_translated:false,
   seo_ready:false,category:"maintenance",tractor_id:null,
   title:"Traktör hidrolik bakımı ve yağ seviyesi kontrol sorusu",
   body:"Bakım esnasında hidrolik yağ seviyesi ve filtre kontrolü hakkında deneyimlerimizi paylaşıyoruz.",
   slug:"2026-test-traktor-bakim-3c45305b5eea49eb9d6e2f3bbb809b66",
   created_at:"2026-11-22T12:00:00Z",updated_at:"2026-11-22T12:00:00Z"
  }]}));
 await page.goto("/tr/forum/?live-forum-test=1");
 await expect(page.locator("[data-forum-live-grid] [data-forum-topic]")).toHaveCount(1);
 await expect(page.locator(".forum-dashboard-rail")).toBeHidden();
 await expect(page.locator(".forum-view-tabs")).toBeVisible();
 expect(await font(page.locator(".forum-view-button").first())).toBeGreaterThanOrEqual(14);
 expect(await font(page.locator(".forum-side-panel>p").first())).toBeGreaterThanOrEqual(14);
 await expect(page.locator('[data-forum-category="maintenance"]')).toBeVisible();
 expect(await page.locator('[data-forum-category="maintenance"]').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 const r=await page.evaluate(()=>({pageWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
 expect(r.pageWidth).toBeLessThanOrEqual(r.viewport+2);
});
test("same visible navigation hierarchy survives language expansion",async({page})=>{
 await page.setViewportSize({width:1200,height:900});
 for(const locale of ["en","de","fr","es","pt-br","ru","ja","zh","hi"]){
  await page.goto(locale==="en"?"/forum/":"/"+locale+"/forum/");
  await expect(page.locator(".forum-view-tabs [data-forum-view]")).toHaveCount(FORUM_VIEWS.length);
  const nav=page.locator(".forum-view-button").first();
  expect(await font(nav)).toBeGreaterThanOrEqual(14);
  const width=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(width).toBeLessThanOrEqual(2);
 }
});
