import {test,expect} from "@playwright/test";
test.describe("optional language suggestion",()=>{
 test.use({locale:"tr-TR"});
 test("native-language suggestion remains optional and dismissal returns focus",async({page})=>{
  await page.goto("/");
  const suggestion=page.locator("#locale-suggestion");
  await expect(suggestion).toBeVisible();
  await expect(suggestion).toHaveAttribute("lang","tr");
  await expect(suggestion).toContainText("Türkçe kullanmak ister misiniz?");
  await expect(suggestion.locator("a")).toHaveAttribute("href","/language/tr/?next=%2Ftr%2F");
  expect(new URL(page.url()).pathname).toBe("/");
  const dismiss=suggestion.locator("button");
  await dismiss.focus();
  await dismiss.press("Enter");
  await expect(suggestion).toBeHidden();
  await expect(page.locator("#home-model-query")).toBeFocused();
  await page.reload();
  await expect(suggestion).toBeHidden();
 });
});
for(const locale of ["tr","de","hi","ja"]){
 test("compact mobile navigation and locale panel: "+locale,async({page})=>{
  await page.setViewportSize({width:320,height:480});
  await page.goto("/"+locale+"/");
  const menu=page.locator(".mobile-nav");
  const summary=menu.locator("summary");
  await summary.click();
  await expect(menu).toHaveAttribute("open","");
  const nav=menu.locator(".mobile-nav-links");
  await expect(nav).toBeVisible();
  await expect(nav.locator('a[href="/'+locale+'/compare/"]')).toHaveCount(1);
  expect((await nav.boundingBox())?.width??999).toBeLessThanOrEqual(320);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open","");
  const languages=page.locator(".locale-menu");
  await languages.locator("summary").click();
  await expect(languages.locator(".locale-options")).toBeVisible();
  const current=languages.locator('a[aria-current="page"]');
  await expect(current).toHaveCount(1);
  expect((await current.boundingBox())?.height??0).toBeGreaterThanOrEqual(44);
  await current.focus();
  await expect(current).toBeFocused();
 });
}
