import {test,expect} from "@playwright/test";

test.beforeEach(async ({page})=>{
  await page.route("**/*",route=>{
    const url=new URL(route.request().url());
    return ["localhost","127.0.0.1"].includes(url.hostname)?
      route.continue():route.abort();
  });
});

test("offscreen model cards retain discoverable links, scroll targets, and keyboard focus",async({page})=>{
  await page.goto("/tr/tractors/",{waitUntil:"domcontentloaded"});
  const existing=await page.locator("#tractor-card-grid .tractor-card").count();
  if(existing<100){
    await page.evaluate(()=>{
      const main=document.querySelector("main#main");
      if(!main)throw Error("No main landmark");
      const grid=document.createElement("div");
      grid.id="catalog-performance-fixture";
      grid.className="tractor-card-grid tractor-card-grid--large";
      for(let i=0;i<110;i++){
        const card=document.createElement("article");
        card.className="tractor-card";
        card.id="benchmark-model-"+i;
        const a=document.createElement("a");
        a.className="tractor-card-main";
        a.href="/tr/tractors/benchmark-model-"+i+"/";
        a.textContent="Benchmark tractor "+i;
        card.append(a);
        grid.append(card);
      }
      main.append(grid);
    });
  }
  const selector=existing>=100?"#tractor-card-grid": "#catalog-performance-fixture";
  const cards=page.locator(selector+" .tractor-card");
  const links=page.locator(selector+" .tractor-card-main[href^='/tr/tractors/']");
  expect(await cards.count()).toBe(await links.count());
  expect(await cards.count()).toBeGreaterThanOrEqual(100);

  const state=await cards.nth(80).evaluate(card=>{
    const styles=getComputedStyle(card);
    return {supported:CSS.supports("content-visibility","auto"),
      visibility:styles.contentVisibility,placeholder:styles.containIntrinsicBlockSize};
  });
  if(state.supported){
    expect(state.visibility).toBe("auto");
    expect(state.placeholder).toMatch(/^auto /);
  }

  const last=cards.last();
  await last.scrollIntoViewIfNeeded();
  await expect(last.locator(".tractor-card-main")).toBeVisible();
  await last.locator(".tractor-card-main").focus();
  await expect(last.locator(".tractor-card-main")).toBeFocused();
});
