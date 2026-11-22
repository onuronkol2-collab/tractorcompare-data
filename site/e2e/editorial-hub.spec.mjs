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

test("ten authentic article hubs expose only real source-backed pages with correct language tags",async ({page})=>{
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
  const activeLocale=path.split("/").filter(Boolean)[0]==="articles"?"en":path.split("/")[1];
  const reviewedPilot=["en","tr"].includes(activeLocale);
  const expectedCount=reviewedPilot?7:6;
  await expect(page.locator(".editorial-card")).toHaveCount(expectedCount);
  await expect(page.locator(".editorial-card h3 a")).toHaveCount(expectedCount);
  // JSON-LD is a script: Playwright toContainText reads rendered innerText,
  // which is empty for scripts even when the JSON is present in the HTML.
  const jsonld=await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonld).toContain("CollectionPage");
  expect(jsonld).toContain("ItemList");
  const schema=JSON.parse(jsonld||"{}");
  const list=schema["@graph"]?.find(x=>x["@type"]==="ItemList");
  expect(list?.numberOfItems,path+" structured article count").toBe(expectedCount);
  expect(list?.itemListElement).toHaveLength(expectedCount);
  const links=await page.locator(".editorial-card h3 a").evaluateAll(els=>els.map(x=>x.getAttribute("href")));
  expect(links).toHaveLength(expectedCount);
  const pilotPath=(activeLocale==="tr"?"/tr":"")+"/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/";
  expect(links.includes(pilotPath),path+" reviewed pilot only in actual-language editions").toBe(reviewedPilot);
  if(reviewedPilot)
   expect(list.itemListElement.some(item=>item.url==="https://tractorvs.com"+pilotPath)).toBe(true);
  for(const href of links){
   expect(href).toMatch(/^\/(?:tr\/|zh\/|hi\/|pt-br\/|fr\/|de\/|ru\/|ja\/|es\/)?(?:guides|reviews|compare)\//);
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
   await expect(page.locator(".editorial-card")).toHaveCount(7);
  }
 }
});


test("all ten homepages offer real native-language editorial links in visible content",async ({page,browserName,isMobile})=>{
 test.skip(browserName!=="chromium"||isMobile,"ten-language editorial discovery checked on desktop Chromium");
 for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
  const prefix=locale==="en"?"":"/"+locale;
  const response=await page.goto(prefix+"/",{waitUntil:"domcontentloaded"});
  expect(response?.status(),locale+" homepage").toBe(200);
  const hub=page.locator('.home-editorial a[href="'+prefix+'/articles/"]');
  const guide=page.locator('.home-editorial-card[href="'+prefix+'/guides/choosing-a-tractor/"]');
  const review=page.locator('.home-editorial-card[href="'+prefix+'/reviews/basak-2075-bk/"]');
  await expect(page.locator(".home-editorial")).toHaveCount(1);
  await expect(hub).toHaveCount(1);
  await expect(guide).toHaveCount(1);
  await expect(review).toHaveCount(1);
  await expect(page.locator(".home-editorial h2")).toHaveCount(1);
  await expect(guide.locator("h3")).not.toBeEmpty();
  // The inert CI preview intentionally disables public indexing, so it has
  // no canonical tag. Canonical is checked in the production bundle gate.
  await hub.click();
  await expect(page.locator(".editorial-card")).toHaveCount(["en","tr"].includes(locale)?7:6);
 }
});

test("localized tractor model pages offer a genuinely translated technical learning guide",async ({page,browserName,isMobile})=>{
 test.skip(browserName!=="chromium"||isMobile,"representative model link smoke on desktop Chromium");
 for(const locale of ["zh","de"]){
  await page.goto("/"+locale+"/",{waitUntil:"domcontentloaded"});
  // Offline PR previews deliberately have no Supabase catalogue credentials.
  // Do not misclassify an absent *test fixture* as a broken published model.
  if(await page.locator(".home-featured-card").count()===0)
   test.skip(true,"Offline CI build has no published tractor fixtures.");
  const model=await page.locator(".home-featured-card").first().getAttribute("href");
  expect(model).toMatch(new RegExp("^/"+locale+"/tractors/"));
  const response=await page.goto(model,{waitUntil:"domcontentloaded"});
  expect(response?.status(),locale+" published model").toBe(200);
  const help=page.locator('.model-spec-glossary-banner[href="/'+locale+'/guides/choosing-a-tractor/"]');
  await expect(help).toHaveCount(1);
  await expect(help.locator("strong")).not.toBeEmpty();
  await help.click();
  await expect(page.locator(".guide-steps > li")).toHaveCount(6);
  await expect(page.locator("html")).toHaveAttribute("lang",locale==="zh"?"zh-Hans":"de");
 }
});

test("article archive offers accessible direct links to guides and model review",async({page})=>{
 for(const path of ["/articles/","/tr/articles/","/de/articles/"]){
  const response=await page.goto(path,{waitUntil:"domcontentloaded"});
  expect(response?.status(),path).toBe(200);
  const links=page.locator(".editorial-jumps");
  await expect(links).toHaveCount(1);
  const guides=links.locator('a[href="#rehberler"]');
  const review=links.locator('a[href="#incelemeler"]');
  await expect(guides).toBeVisible();
  await expect(review).toBeVisible();
  const count=path==="/de/articles/"?6:7;
  await expect(page.locator(".editorial-card")).toHaveCount(count);
  await expect(page.locator(".editorial-card-footer a")).toHaveCount(count);
  await review.click();
  await expect(page).toHaveURL(/#incelemeler$/);
  await expect(page.locator("#incelemeler")).toBeInViewport();
  await guides.focus();
  await expect(guides).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#rehberler$/);
  await expect(page.locator("#rehberler")).toBeInViewport();
 }
});

test("editorial links have mobile touch targets without altering translation fallback",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/de/articles/",{waitUntil:"domcontentloaded"});
 await expect(page.locator('.editorial-card h3 a[href="/de/guides/choosing-a-tractor/"]')).toHaveCount(1);
 await expect(page.locator('.editorial-card h3 a[href="/guides/tractor-engine-power-and-torque/"]')).toHaveAttribute("hreflang","en");
 await expect(page.locator('.editorial-card h3 a[href="/de/reviews/basak-2075-bk/"]')).toHaveCount(1);
 await expect(page.locator(".editorial-language-note")).toHaveCount(4);
 for(const control of await page.locator(".editorial-jumps a,.editorial-card-footer a").all()){
  const box=await control.boundingBox();
  expect(box?.height??0,"Touch target height").toBeGreaterThanOrEqual(44);
 }
 const width=await page.evaluate(()=>document.documentElement.scrollWidth);
 expect(width,"Article hub horizontal overflow").toBeLessThanOrEqual(392);
 await page.locator('.editorial-jumps a[href="#incelemeler"]').click();
 await expect(page.locator("#incelemeler")).toBeInViewport();
});

test("wide guide and review tables remain keyboard-scrollable and labeled at 390px",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const locale of ["tr","ja"]){
  for(const kind of ["guide","review"]){
   const route=kind==="guide"?"/guides/choosing-a-tractor/":"/reviews/basak-2075-bk/";
   const response=await page.goto("/"+locale+route,{waitUntil:"domcontentloaded"});
   expect(response?.status(),locale+route).toBe(200);
   const region=page.locator(kind==="guide"?".guide-table-scroll":".review-table-scroll");
   const heading=page.locator(kind==="guide"?"#guide-checklist-heading":"#facts-heading");
   const label=(await heading.textContent()||"").trim();
   await expect(region).toHaveAttribute("role","region");
   await expect(region).toHaveAttribute("tabindex","0");
   await expect(region).toHaveAccessibleName(label);
   const before=await region.evaluate(el=>({
    width:el.clientWidth,contentWidth:el.scrollWidth,left:el.scrollLeft
   }));
   expect(before.contentWidth,locale+" "+kind+" table requires a scroll container").toBeGreaterThan(before.width);
   await region.focus();
   await expect(region).toBeFocused();
   await page.keyboard.press("ArrowRight");
   await expect.poll(()=>region.evaluate(el=>el.scrollLeft),{
    message:locale+" "+kind+" horizontal table must respond to keyboard ArrowRight"
   }).toBeGreaterThan(before.left);
   const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(pageWidth,locale+" "+kind+" should not overflow whole page").toBeLessThanOrEqual(392);
  }
 }
});

test("official PTO and hydraulic safety sources are scoped to the right published bilingual guides",async({page})=>{
 const examples=[
  {slug:"pto-and-power-take-off",source:"https://www.hse.gov.uk/agriculture/topics/machinery/safe-use-1.htm",other:"https://www.hse.gov.uk/agriculture/topics/machinery/fluid.htm",tr:"motor kapalıyken",en:"stop the engine, remove the key"},
  {slug:"tractor-hydraulic-lift-explained",source:"https://www.hse.gov.uk/agriculture/topics/machinery/fluid.htm",other:"https://www.hse.gov.uk/agriculture/topics/machinery/safe-use-1.htm",tr:"kaçakları elle aramayın",en:"Never feel for a pressurized hydraulic leak"}
 ];
 for(const locale of ["","tr/"]){
  for(const check of examples){
   const route="/"+locale+"guides/"+check.slug+"/";
   const response=await page.goto(route,{waitUntil:"domcontentloaded"});
   expect(response?.status(),route).toBe(200);
   await expect(page.locator('.learn-further a[href="'+check.source+'"]')).toHaveCount(1);
   await expect(page.locator('.learn-further a[href="'+check.other+'"]')).toHaveCount(0);
   await expect(page.locator(".learn-chapter").last()).toContainText(locale==="tr/"?check.tr:check.en);
   const schema=(await page.locator('script[type="application/ld+json"]').textContent())||"";
   expect(schema,route+" TechArticle citation").toContain(check.source);
   expect(schema,route+" article modified date").toContain("2026-11-22");
   expect(schema,route+" wrong cross-article citation").not.toContain(check.other);
  }
  await page.goto("/"+locale+"guides/tractor-engine-power-and-torque/",{waitUntil:"domcontentloaded"});
  await expect(page.locator('.learn-further a[href*="hse.gov.uk"]')).toHaveCount(0);
  await expect(page.locator('.learn-further a[href*="nist.gov"]')).toHaveCount(1);
 }
});

test("published Başak maximum engine-power label matches manufacturer across responsive locales",async({page})=>{
 for(const [path,label] of [
  ["/reviews/basak-2075-bk/","Maximum engine power (manufacturer-stated)"],
  ["/tr/reviews/basak-2075-bk/","Azami motor gücü (üretici beyanı)"],
  ["/de/reviews/basak-2075-bk/","Maximale Motorleistung (Herstellerangabe)"]
 ]){
  const response=await page.goto(path,{waitUntil:"domcontentloaded"});
  expect(response?.status(),path).toBe(200);
  await expect(page.locator(".review-facts tbody tr").nth(1).locator('th[scope="row"]')).toHaveText(label);
  await expect(page.locator(".review-facts tbody tr").nth(1).locator("td")).toContainText("53 kW / 72 hp @ 2500 rpm");
 }
});
