import {test,expect} from "@playwright/test";

const textPx=async(node)=>node.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
const noDocumentOverflow=async(page)=>page.evaluate(()=>
  document.documentElement.scrollWidth <= window.innerWidth+2);

test("shared research surfaces have readable typography and consistent card geometry",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  const response=await page.goto("/tr/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const tokens=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement);
    return {radius:root.getPropertyValue("--ui-radius").trim(),
      accent:root.getPropertyValue("--ui-accent").trim()};
  });
  expect(tokens).toEqual({radius:"18px",accent:"#285b40"});
  const card=page.locator(".home-action-card").first();
  await expect(card).toBeVisible();
  expect(await card.evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThanOrEqual(14);
  expect(await textPx(card.locator("p").first())).toBeGreaterThanOrEqual(15);
  const nav=page.locator(".desktop-nav > a:visible").first();
  if(await nav.count())expect(await textPx(nav)).toBeGreaterThanOrEqual(14);
  expect(await noDocumentOverflow(page)).toBe(true);
});

test("translated laptop navigation keeps the language switch visible",async({page})=>{
  await page.setViewportSize({width:1281,height:780});
  for(const locale of ["de","pt-br"]){
    await page.goto("/"+locale+"/",{waitUntil:"domcontentloaded"});
    expect(await noDocumentOverflow(page),locale).toBe(true);
    const desktop=page.locator(".desktop-nav");
    const actions=page.locator(".header-actions");
    const nav=await desktop.boundingBox();
    const controls=await actions.boundingBox();
    if(nav && controls)expect(nav.x+nav.width,locale).toBeLessThanOrEqual(controls.x+2);
    await expect(page.locator(".locale-menu > summary")).toBeVisible();
  }
});

test("catalogue and editorial evidence links stay legible without changing navigation",async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  for(const route of ["/tr/tractors/","/tr/articles/"]){
    const response=await page.goto(route,{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toHaveCount(1);
    expect(await noDocumentOverflow(page),route).toBe(true);
  }
  const card=page.locator(".editorial-card").first();
  await expect(card).toBeVisible();
  const color=await card.evaluate(el=>getComputedStyle(el).borderTopColor);
  expect(color).toBe("rgb(206, 219, 206)");
  const footer=page.locator(".site-footer .footer-group a").first();
  expect(await textPx(footer)).toBeGreaterThanOrEqual(15);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("narrow multilingual homepage reflows without clipping research links",async({page})=>{
  await page.setViewportSize({width:320,height:720});
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
    const response=await page.goto(locale==="en"?"/":"/"+locale+"/",{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await noDocumentOverflow(page),locale).toBe(true);
    const action=page.locator(".home-action-card").first();
    await expect(action).toBeVisible();
    expect(await textPx(action.locator("p").first()),locale).toBeGreaterThanOrEqual(15);
    const footer=page.locator(".site-footer .footer-group a").first();
    expect(await textPx(footer),locale).toBeGreaterThanOrEqual(15);
  }
});

test("advisor remains one coherent research panel, not nested floating cards",async({page})=>{
  await page.goto("/tr/farm-advisor/",{waitUntil:"domcontentloaded"});
  const form=page.locator(".advisor-form");
  await expect(form).toBeVisible();
  expect(await form.evaluate(el=>parseFloat(getComputedStyle(el).borderRadius))).toBeGreaterThanOrEqual(16);
  const first=page.locator(".advisor-form .advisor-step").first();
  await expect(first).toBeVisible();
  expect(await first.evaluate(el=>getComputedStyle(el).boxShadow)).toBe("none");
});

test("reduced-motion visitors never get an animated card lift",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/tr/",{waitUntil:"domcontentloaded"});
  const card=page.locator(".home-action-card").first();
  await expect(card).toBeVisible();
  await card.hover();
  const transform=await card.evaluate(el=>getComputedStyle(el).transform);
  expect(transform).toBe("none");
});
