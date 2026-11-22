import {test,expect} from "@playwright/test";

// Live, publicly published sources only. These stable IDs are audited in #408.
// Never log in, submit posts, accept analytics consent, or mutate any data.
const ISEKI="3e6886c4-8dc5-4d80-bafd-dc15b88454cc";
const NEW_HOLLAND="a31d36a5-694a-4157-90e4-71a13231ab06";
const TYM_F36="6f214ac1-0415-4433-98c9-5307aed48d9c";
const TYM_T475="8f3833e6-7eea-4a5c-a7eb-caa01b065cd5";
const tractorUrl=(left,right)=>"/tr/compare/?left="+left+"&right="+right;

test("live initial warning survives native selection, common-data filter and swap",async({page,request})=>{
  const isekiData=await request.get("/comparison-data/tr/"+ISEKI+".json");
  expect(isekiData.status(),"public source JSON must be published").toBe(200);
  const response=await page.goto(tractorUrl(ISEKI,NEW_HOLLAND),{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const lift=page.locator("#tc-rows tr").filter({has:page.locator("th").filter({hasText:"Arka kaldırma kapasitesi"})});
  await expect(lift.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(lift.locator("td a[href^='https://']")).not.toHaveCount(0);

  // Exercise actual browser event handlers, not only the server-generated HTML.
  await page.locator("#tc-left").selectOption(TYM_F36);
  await page.locator("#tc-right").selectOption(TYM_T475);
  await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_F36);
  await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_T475);
  const wheelbase=page.locator("#tc-rows tr").filter({has:page.locator("th").filter({hasText:"Dingil mesafesi"})});
  await expect(wheelbase.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(wheelbase.locator("td a[href^='https://']")).not.toHaveCount(0);

  await page.locator("#tc-shared").click();
  await expect(page.locator("#tc-shared")).toHaveAttribute("aria-pressed","true");
  await expect(wheelbase.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await page.locator("#tc-swap").click();
  await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_T475);
  await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_F36);
  await expect(wheelbase.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(wheelbase.locator("td a[href^='https://']")).not.toHaveCount(0);
});

test("live MF 5S.125 and TYM option rows carry separate source-based transmission cautions",async({page})=>{
  const response=await page.goto(tractorUrl(ISEKI,NEW_HOLLAND),{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const mfOption=page.locator("#tc-left option").filter({hasText:/5S\.125/}).first();
  const mfId=await mfOption.getAttribute("value");
  expect(mfId,"published MF 5S.125 model required for evidence-backed QA").toBeTruthy();
  await page.locator("#tc-left").selectOption(mfId);
  await page.locator("#tc-right").selectOption(TYM_T475);
  await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(mfId);
  await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_T475);
  const warnings=page.locator("#tc-rows th .tc-condition-caution").filter({hasText:"Şanzıman seçenekleri"});
  await expect(warnings.first()).toBeVisible();
  const flaggedRow=page.locator("#tc-rows tr").filter({has:page.locator("th .tc-condition-caution").filter({hasText:"Şanzıman seçenekleri"})}).first();
  await expect(flaggedRow.locator("td a[href^='https://']")).not.toHaveCount(0);
  // A transmission caution is different from a measurement-condition caution.
  await expect(flaggedRow.locator(".tc-condition-caution")).not.toContainText("Ölçüm koşulları");
});
