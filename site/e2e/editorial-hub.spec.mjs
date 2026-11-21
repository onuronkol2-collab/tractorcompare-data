import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The preview is a local static build. Never fire third-party analytics.
test.beforeEach(async ({page})=>{
 await page.route("**/*",route=>{
  const url=new URL(route.request().url());
  return ["127.0.0.1","localhost"].includes(url.hostname)
   ?route.continue():route.abort();
 });
});

test("ten authentic article hubs expose six real sources and correct language tags",async ({page})=>{
 for(const [path,lang] of [
  ["/articles/","en"],["/tr/articles/","tr"],["/zh/articles/","zh-Hans"],
  ["/hi/articles/","hi"],["/pt-br/articles/","pt-BR"],
  ["/fr/articles/","fr"],["/de/articles/","de"],["/ru/articles/","ru"],
  ["/ja/articles/","ja"],["/es/articles/","es"]
 ]){
  const response=await page.goto(path,{waitUntil:"domcontentloaded"});
  expect(response?.status(),path).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang",lang);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".editorial-card")).toHaveCount(6);
  await expect(page.locator(".editorial-card h3 a")).toHaveCount(6);
  // JSON-LD is a script: Playwright toContainText reads rendered innerText,
  // which is empty for scripts even when the JSON is present in the HTML.
  const jsonld=await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonld).toContain("CollectionPage");
  expect(jsonld).toContain("ItemList");
  const activeLocale=path.split("/").filter(Boolean)[0]==="articles"?"en":path.split("/")[1];
  const links=await page.locator(".editorial-card h3 a").evaluateAll(list=>list.map(x=>x.getAttribute("href")));
  expect(links).toHaveLength(6);
  for(const href of links){
   expect(href).toMatch(/^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?(?:guides|reviews)\//);
   expect(href).not.toContain("2026-2027-traktor-guvenilirlik");
  }
  if(!["en","tr"].includes(activeLocale)){
   expect(links.filter(href=>href.startsWith("/"+activeLocale+"/"))).toHaveLength(2);
   expect(links.filter(href=>!href.startsWith("/"+activeLocale+"/"))).toHaveLength(4);
   await expect(page.locator(".editorial-language-note")).toHaveCount(4);
  }else{
   await expect(page.locator(".editorial-language-note")).toHaveCount(0);
  }
 }
});

test("article hub is reachable from mobile navigation",async ({page,isMobile})=>{
 test.skip(!isMobile,"mobile navigation only");
 await page.goto("/tr/articles/",{waitUntil:"domcontentloaded"});
 const menu=page.locator("details.mobile-nav");
 await menu.locator("summary").click();
 await expect(menu.locator('a[href="/tr/articles/"]')).toBeVisible();
});

test("article hub has no serious or critical axe-core findings",async ({page,browserName},testInfo)=>{
 test.skip(browserName!=="chromium","axe checked on desktop and mobile Chromium");
 for(const path of ["/articles/","/tr/articles/","/zh/articles/","/ja/articles/"]){
  await page.goto(path,{waitUntil:"domcontentloaded"});
  const report=await new AxeBuilder({page})
   .withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"])
   .analyze();
  const findings=report.violations.map(x=>({
   id:x.id,impact:x.impact,target:x.nodes.map(n=>n.target),help:x.help
  }));
  await testInfo.attach("editorial-axe-"+(path.split("/")[1]||"en"),{
   body:Buffer.from(JSON.stringify(findings,null,2)),contentType:"application/json"
  });
  const significant=report.violations.filter(x=>["serious","critical"].includes(x.impact));
  expect(significant,path+" has serious/critical accessibility violations").toEqual([]);
 }
});


test("published full-text selection and Başak articles stay complete in all eight additional languages",async ({page,browserName,isMobile})=>{
 test.skip(browserName!=="chromium"||isMobile,"full translation parity checked once on desktop Chromium");
 for(const [lang,langTag] of [
  ["zh","zh-Hans"],["hi","hi"],["pt-br","pt-BR"],["fr","fr"],
  ["de","de"],["ru","ru"],["ja","ja"],["es","es"]
 ]){
  const guide=await page.goto("/"+lang+"/guides/choosing-a-tractor/",{waitUntil:"domcontentloaded"});
  expect(guide?.status(),lang+" selection guide").toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang",langTag);
  await expect(page.locator(".guide-steps > li")).toHaveCount(6);
  await expect(page.locator(".guide-checklist tbody tr")).toHaveCount(5);
  await expect(page.locator(".guide-crumb")).not.toHaveAttribute("aria-label","Breadcrumb");
  const review=await page.goto("/"+lang+"/reviews/basak-2075-bk/",{waitUntil:"domcontentloaded"});
  expect(review?.status(),lang+" Başak review").toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang",langTag);
  await expect(page.locator(".review-prose")).toHaveCount(4);
  await expect(page.locator(".review-facts tbody tr")).toHaveCount(8);
  await expect(page.locator(".review-crumb")).not.toHaveAttribute("aria-label","Breadcrumb");
  await expect(page.locator(".review-next")).not.toHaveAttribute("aria-label","Related pages");
  for(const value of ["53 kW","72 hp","273 Nm","540E","3000 kg","3080 kg"]){
   await expect(page.locator(".review-facts")).toContainText(value);
  }
 }
});


test("the six published articles expose matching, clickable editorial breadcrumbs and accurate schema",async ({page,browserName,isMobile})=>{
 test.skip(browserName!=="chromium"||isMobile,"all article-source breadcrumbs checked once in Chromium");
 const entries=[
  ["/guides/choosing-a-tractor/",".guide-crumb"],
  ["/guides/tractor-technical-terms/",".glossary-breadcrumbs"],
  ["/guides/tractor-engine-power-and-torque/",".learn-crumb"],
  ["/guides/tractor-hydraulic-lift-explained/",".learn-crumb"],
  ["/guides/pto-and-power-take-off/",".learn-crumb"],
  ["/reviews/basak-2075-bk/",".review-crumb"]
 ];
 for(const prefix of ["","/tr"]){
  const hub=prefix+"/articles/";
  for(const [path,crumbSelector] of entries){
   const target=prefix+path;
   const response=await page.goto(target,{waitUntil:"domcontentloaded"});
   expect(response?.status(),target).toBe(200);
   const crumb=page.locator(crumbSelector);
   const link=crumb.locator('a[href="'+hub+'"]');
   await expect(link,target+" contextual editorial link").toHaveCount(1);
   const raw=await page.locator('script[type="application/ld+json"]').first().textContent();
   const schema=JSON.parse(raw||"{}");
   const graph=schema["@graph"]??[schema];
   const trail=graph.find(node=>node["@type"]==="BreadcrumbList");
   expect(trail,target+" BreadcrumbList").toBeTruthy();
   const nodes=trail.itemListElement||[];
   expect(nodes.some(node=>node.item==="https://tractorvs.com"+hub),target+" structured trail").toBe(true);
   await link.click();
   await expect(page).toHaveURL(new RegExp(hub.replaceAll("/","\\/")+"$"));
   await expect(page.locator(".editorial-card")).toHaveCount(6);
  }
 }
});
