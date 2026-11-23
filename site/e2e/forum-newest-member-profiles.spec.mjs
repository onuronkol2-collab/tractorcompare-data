import {test,expect} from "@playwright/test";

test("newest opt-in members open real public profile details without revealing hidden profiles",async({page})=>{
 const visible={
  id:"aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
  handle:"tractortester",display_name:"Traktör Testçisi",
  bio:"2026 teknik bakım deneyimleri",favorite_brand:"New Holland",
  show_leaderboard:true,avatar_path:null,
  created_at:"2026-11-22T12:00:00Z",
  score_total:15,score_30d:6,topic_count:1,reply_count:3,helpful_votes:2
 };
 const privateProfile={
  ...visible,id:"bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",handle:"privateperson",
  display_name:"Gizli Üye",bio:"not public",show_leaderboard:false,
  created_at:"2026-11-23T12:00:00Z"
 };
 await page.route("**/forum-test-api/rest/v1/tc_member_scores?**",route=>
  route.fulfill({json:[privateProfile,visible]})
 );
 await page.goto("/tr/forum/");
 const newest=page.locator("[data-recent-members] li");
 await expect(newest).toHaveCount(1);
 const open=newest.locator("button.member-profile-link");
 await expect(open).toHaveText("Traktör Testçisi");
 await expect(open).toHaveAttribute("aria-label",/profili|profil|Üye/i);
 await expect(page.locator("[data-recent-members]")).not.toContainText("Gizli Üye");
 await open.focus();
 await page.keyboard.press("Enter");
 const dialog=page.locator("[data-member-dialog]");
 await expect(dialog).toBeVisible();
 await expect(dialog.locator("[data-dialog-name]")).toHaveText("Traktör Testçisi");
 await expect(dialog.locator("[data-dialog-bio]")).toContainText("2026 teknik bakım");
 await expect(dialog.locator("[data-dialog-brand]")).toContainText("New Holland");
 await expect(dialog).not.toContainText("Gizli Üye");
 await dialog.locator("[data-dialog-close]").click();
 await expect(dialog).toBeHidden();
});
