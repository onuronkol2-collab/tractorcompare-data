import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const blockedAnalytics = /(?:google-analytics\.com|googletagmanager\.com|clarity\.ms|cloudflareinsights\.com)/i;

// Restrict browser networking to the local build. In particular no analytics
// events must be sent to GA4 / Clarity when testing consent acceptance.
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname)) {
      return route.continue();
    }
    return route.abort();
  });
});

test("Turkish and English home pages render and offer language navigation", async ({ page }) => {
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("header .brand-lockup")).toBeVisible();
  await expect(page.locator(".locale-menu")).toHaveCount(1);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", /^(en|en-US)$/);
  await expect(page.locator("main#main")).toHaveCount(1);
});

test("catalogue, comparison and forum routes expose a main landmark", async ({ page }) => {
  for (const path of ["/tr/tractors/", "/tr/compare/", "/tr/forum/"]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "HTTP route " + path).toBe(200);
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.locator("title")).not.toBeEmpty();
  }
});

test("ten localized home pages share the TractorVS search identity and favicon", async ({ page }) => {
  const locales = [
    ["/", "en"], ["/tr/", "tr"], ["/de/", "de"], ["/fr/", "fr"],
    ["/es/", "es"], ["/ru/", "ru"], ["/hi/", "hi"], ["/ja/", "ja"],
    ["/zh/", "zh-Hans"], ["/pt-br/", "pt-BR"],
  ];
  const siteRoot = new URL("/", process.env.SITE_URL || "https://tractorvs.com/").href;
  const icon = page.locator('head link[rel~="icon"][type="image/png"]');
  for (const [path, lang] of locales) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "Locale HTTP status: " + path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(icon).toHaveAttribute("href", "/favicon.png");
    await expect(page.locator('head meta[property="og:site_name"]')).toHaveAttribute("content", "TractorVS");
    const blocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
    const entities = blocks.flatMap(text => {
      const json = JSON.parse(text);
      return json["@graph"] ?? json;
    });
    const websites = entities.filter(entity => entity["@type"] === "WebSite");
    expect(websites, path).toHaveLength(1);
    expect(websites[0], path).toMatchObject({ name: "TractorVS", url: siteRoot });
  }

  const response = await page.request.get("/favicon.png");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/png\b/i);
  const dimensions = await icon.evaluate(async link => {
    const image = new Image();
    image.src = link.href;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight, sizes: Array.from(link.sizes) };
  });
  expect(dimensions.width).toBe(dimensions.height);
  expect(dimensions.width).toBeGreaterThan(48);
  expect(dimensions.sizes).toContain(`${dimensions.width}x${dimensions.height}`);
});

test("mobile navigation reaches tractor comparison from the menu", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only navigation interaction");
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  const menu = page.locator("details.mobile-nav");
  await menu.locator("summary").click();
  const compareLink = menu.locator('a[href="/tr/compare/"]');
  await expect(compareLink).toBeVisible();
  await compareLink.click();
  await expect(page).toHaveURL(/\/tr\/compare\/$/);
});


test("catalogue remains crawlable while price hydration covers only source-priced models", async ({ page }) => {
  await page.goto("/tr/tractors/", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".tractor-card");
  const count = await cards.count();
  test.skip(count === 0, "Only run this regression against a configured published catalogue.");
  const data = JSON.parse(await page.locator("#catalog-price-payload").textContent() || "{}");
  expect(data.models.length).toBeLessThan(count);
  const links = await page.locator(".tractor-card-main[href^='/tr/tractors/']").count();
  expect(links).toBe(count);
  await page.locator("#tractor-search").fill("tractor-model-that-does-not-exist-99999");
  await expect(page.locator("#catalog-no-results")).toBeVisible();
  await page.locator("#tractor-search").fill("");
  await expect(page.locator("#catalog-no-results")).toBeHidden();
});

test("published ISEKI TXGS24 power summary links its exact approved source in Turkish and Chinese", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Source/translation UX is checked on Chromium desktop and mobile.");
  for(const [path,lang] of [
    ["/tr/tractors/iseki-txgs24-1d67a7d0/","tr"],
    ["/zh/tractors/iseki-txgs24-1d67a7d0/","zh-Hans"],
  ]){
    const response=await page.goto(path,{waitUntil:"domcontentloaded"});
    // The offline PR preview intentionally builds without Supabase credentials,
    // so published model pages can be absent. Keep the exact-source test active
    // on production-equivalent builds instead of misreporting a 404 as a bug.
    test.skip(response?.status()===404,"Offline CI build has no published tractor fixtures.");
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",lang);
    const power=page.locator('.model-summary-grid [data-claim="power"]');
    await expect(power.locator("strong")).toContainText("23 HP");
    const link=power.locator("a.model-summary-power-source");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href","https://www.iseki.co.uk/wp-content/uploads/2021/02/Iseki-TXGS24-Range-WEB-2.pdf");
    await expect(link).toHaveAttribute("rel",/noopener noreferrer/);
    await expect(page.locator(".model-summary-provenance-note")).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content",/23 HP/);
  }
});

test("model search is reachable from the global header without leaving a discussion first", async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({width:1440,height:900});
  await page.goto("/tr/forum/", { waitUntil: "domcontentloaded" });
  if (isMobile) {
    const menu = page.locator("details.mobile-nav");
    await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await page.locator("#mobile-model-search").fill("Belarus");
    await menu.locator('button[type="submit"]').click();
  } else {
    const menu = page.locator("details.header-search-menu");
    await menu.locator("summary").click();
    await expect(page.locator("#header-model-search")).toBeFocused();
    await page.locator("#header-model-search").fill("Belarus");
    await menu.locator('button[type="submit"]').click();
  }
  await expect(page).toHaveURL(/\/tr\/tractors\/\?q=Belarus$/);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("forum and tractor selection assistant have accurate menu names without changing routes", async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({width:1440,height:900});
  const examples=[
    {lang:"tr",path:"/tr/",forum:"Topluluk Forumu",finder:"Traktör Seçim Asistanı",search:"Ara"},
    {lang:"en",path:"/",forum:"Tractor forum",finder:"Tractor selection assistant",search:"Search"},
    {lang:"de",path:"/de/",forum:"Traktorforum",finder:"Traktor-Auswahlassistent",search:"Suchen"},
    {lang:"es",path:"/es/",forum:"Foro de tractores",finder:"Asistente para elegir tractor",search:"Buscar"},
    {lang:"ja",path:"/ja/",forum:"トラクターフォーラム",finder:"トラクター選びアシスタント",search:"検索"},
  ];
  for(const item of examples){
    await page.goto(item.path,{waitUntil:"domcontentloaded"});
    const prefix=item.lang==="en"?"/":"/"+item.lang+"/";
    const nav=isMobile?page.locator(".mobile-nav-links"):page.locator(".desktop-nav");
    if(isMobile)await page.locator("details.mobile-nav > summary").click();
    await expect(nav.locator('a[href="'+prefix+'forum/"]')).toHaveText(item.forum);
    await expect(nav.locator('a[href="'+prefix+'farm-advisor/"]')).toHaveText(item.finder);
    if(isMobile){
      await expect(page.locator(".mobile-menu-search button")).toHaveText(item.search);
    }else{
      const menu=page.locator("details.header-search-menu");
      await menu.locator("summary").click();
      await expect(menu.locator('button[type="submit"]')).toHaveText(item.search);
    }
  }
});

test("header resources lead to source methods and choice guides, with English fallback clearly marked", async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({width:1440,height:900});
  await page.goto("/de/", { waitUntil: "domcontentloaded" });
  const menu = isMobile ? page.locator("details.mobile-nav") : page.locator("details.resource-nav-menu");
  await menu.locator("summary").click();
  await expect(menu.locator('a[href="/de/guides/choosing-a-tractor/"]')).toBeVisible();
  await expect(menu.locator('a[href="/guides/tractor-technical-terms/"]')).toContainText("(EN)");
  await expect(menu.locator('a[href="/methodology/"]')).toContainText("(EN)");
  await menu.locator('a[href="/de/guides/choosing-a-tractor/"]').click();
  await expect(page).toHaveURL(/\/de\/guides\/choosing-a-tractor\/$/);
});

test("native header menus close with Escape and preserve keyboard orientation", async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({width:1440,height:900});
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  const menu = isMobile ? page.locator("details.mobile-nav") : page.locator("details.resource-nav-menu");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(menu.locator("summary")).toBeFocused();
});

test("compact and wide headers fit their viewport without clipping navigation controls", async ({ page }) => {
  for (const width of [360,390,768,1024,1280,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto("/tr/", {waitUntil:"domcontentloaded"});
    const shape = await page.locator(".header-inner").evaluate((el) => ({
      scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
      left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,
    }));
    expect(shape.scrollWidth-shape.clientWidth, "Header overflow at "+width).toBeLessThanOrEqual(2);
    expect(shape.left, "Header left edge at "+width).toBeGreaterThanOrEqual(-1);
    expect(shape.right, "Header right edge at "+width).toBeLessThanOrEqual(width+1);
    const compact=page.locator("details.mobile-nav");
    if (width<=1280) {
      await expect(compact).toBeVisible();
      await expect(page.locator("details.header-search-menu")).toBeHidden();
    } else {
      await expect(page.locator("details.header-search-menu")).toBeVisible();
    }
  }
});

test("ten-language Başak comparison preserves source evidence and fits a 390px screen", async ({ page, browserName }) => {
  await page.setViewportSize({ width:390, height:844 });
  for (const locale of ["tr","en","ja"]) {
    const path=locale==="en"?"/reviews/basak-2075-bk/":"/"+locale+"/reviews/basak-2075-bk/";
    const response=await page.goto(path,{waitUntil:"domcontentloaded"});
    expect(response?.status(),"Review route "+path).toBe(200);
    const section=page.locator(".review-variant-comparison");
    await expect(section).toBeVisible();
    await expect(section.locator("tbody tr")).toHaveCount(5);
    await expect(section.locator("tbody tr").nth(3)).toContainText("2205 mm");
    await expect(section.locator("tbody tr").nth(3)).toContainText("2120 mm");
    await expect(section.locator("tbody tr").nth(4)).toContainText("3080 kg");
    await expect(section.locator("tbody tr").nth(4)).toContainText("3515 kg");
    await expect(section.locator('a[href^="https://basaktraktor.com.tr/"][href*="2075-bt"]')).toHaveCount(1);
    // Inert preview builds omit the published catalog; production conditionally adds the local model link.
    await expect(section.locator('a[href*="2075-bk-2-wd"]')).toHaveCount(1);
    const edges=await section.evaluate(el=>{
      const rect=el.getBoundingClientRect();
      return {left:rect.left,right:rect.right,viewport:window.innerWidth,docWidth:document.documentElement.scrollWidth};
    });
    expect(edges.left,"Comparison left overflow in "+locale).toBeGreaterThanOrEqual(-1);
    expect(edges.right,"Comparison right overflow in "+locale).toBeLessThanOrEqual(edges.viewport+1);
    expect(edges.docWidth,"Page horizontal overflow in "+locale).toBeLessThanOrEqual(edges.viewport+2);
  }
  if(browserName==="chromium"){
    const violations=(await new AxeBuilder({page})
      .include(".review-variant-comparison")
      .withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"])
      .analyze()).violations.filter(v=>v.impact==="critical"||v.impact==="serious");
    expect(violations,"Serious accessibility violations in comparison evidence section").toEqual([]);
  }
});

test("analytics tags are not requested without permission and remain absent after rejection", async ({ page }) => {
  const externalAnalyticsRequests = [];
  page.on("request", (request) => {
    if (blockedAnalytics.test(request.url())) externalAnalyticsRequests.push(request.url());
  });

  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  const banner = page.locator("#tractorvs-analytics-banner");
  await expect(banner).toBeVisible();
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(0);
  await expect(page.locator("script[data-tractorvs-clarity]")).toHaveCount(0);
  expect(externalAnalyticsRequests).toEqual([]);

  await page.locator("#tractorvs-analytics-reject").click();
  await expect(banner).toBeHidden();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(banner).toBeHidden();
  expect(externalAnalyticsRequests).toEqual([]);
});

test("accepted analytics can be withdrawn from footer preferences", async ({ page }) => {
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  await page.locator("#tractorvs-analytics-accept").click();
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(1);
  // All external requests are intercepted. We only verify local consent
  // behaviour; this is not a real GA4 or Clarity provider integration test.
  await page.locator("#tractorvs-analytics-settings").click();
  await expect(page.locator("#tractorvs-analytics-banner")).toBeVisible();
  await page.locator("#tractorvs-analytics-reject").click();
  await expect(page.locator("script[data-tractorvs-ga4]")).toHaveCount(0);
});

test("axe-core first pass: no critical accessibility violations on the home page", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium", "Run axe in Chromium; functional coverage includes all browsers.");
  await page.goto("/tr/", { waitUntil: "domcontentloaded" });
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = report.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    targets: violation.nodes.map((node) => node.target),
    failingHtml: violation.nodes.map((node) => node.html.slice(0, 350)),
    help: violation.help,
  }));
  await testInfo.attach("axe-violations", {
    body: Buffer.from(JSON.stringify(summary, null, 2)),
    contentType: "application/json",
  });
  console.log("TractorVS axe findings: " + JSON.stringify(summary));
  const significant = report.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious");
  expect(significant, "Serious and critical accessibility violations block the quality check.").toEqual([]);
});

test("Başak 2075 BK 4WD 100 mm OEM length dispute is visible with both sources and absent from comparison data",async({page,request})=>{
 const tractorId="9ef236be-0d91-4c87-af3d-8c0cf33f08a1";
 const modelSlug="basak-traktor-2075-bk-9ef236be";
 const first=await page.goto("/tr/tractors/"+modelSlug+"/",{waitUntil:"domcontentloaded"});
 test.skip(first?.status()===404,"Offline preview without published Supabase catalogue; production artifact gate checks all ten model pages.");
 expect(first?.status()).toBe(200);
 for(const locale of ["tr","en","de"]){
  const prefix=locale==="en"?"/":"/"+locale+"/";
  const response=await page.goto(prefix+"tractors/"+modelSlug+"/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const warning=page.locator(".model-source-conflict-banner");
  await expect(warning).toHaveCount(1);
  await expect(warning).toContainText(/3[., ]?830/);
  await expect(warning).toContainText(/3[., ]?930/);
  await expect(warning.locator('a[href="https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2075-bk"]')).toHaveCount(1);
  await expect(warning.locator('a[href="https://admin.basaktraktor.com.tr/upload/7c743eaf-5228-4ae7-94d7-25df6a13e778-2075%20BK%204WD.pdf"]')).toHaveCount(1);
  const lengthCard=page.locator('.model-spec-card').filter({hasText:"3930 mm"});
  await expect(lengthCard).toHaveCount(1);
  // Keep the source-backed record visible, but never show the outdated claim
  // that the two OEM pages used different weight-inclusion descriptions.
  await expect(lengthCard.locator(".model-spec-note")).toHaveCount(0);
 }
 for(const lang of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
  const data=await request.get("/comparison-data/"+lang+"/"+tractorId+".json");
  expect(data.status(),"comparison data HTTP "+lang).toBe(200);
  const rows=await data.json();
  expect(rows.some(row=>["overall_length","overall_length_with_front_ballast_mm"].includes(row.key)),"disputed dimension must not be comparable "+lang).toBe(false);
  expect(rows.some(row=>String(row.value)==="3830"||String(row.value)==="3930"),"disputed value must not leak "+lang).toBe(false);
  expect(rows.some(row=>row.notice&&/3[., ]?830/.test(row.notice)&&/3[., ]?930/.test(row.notice)),"localized warning must survive "+lang).toBe(true);
  expect(rows.some(row=>row.key==="wheelbase"),"unrelated measurements remain "+lang).toBe(true);
 }
});

test("comparison flags genuine configuration-specific lift, height and wheelbase differences",async({page,request})=>{
 const iseki="3e6886c4-8dc5-4d80-bafd-dc15b88454cc";
 const newHolland="a31d36a5-694a-4157-90e4-71a13231ab06";
 const tymF36="6f214ac1-0415-4433-98c9-5307aed48d9c";
 const tymT475="8f3833e6-7eea-4a5c-a7eb-caa01b065cd5";
 const sample=await request.get("/comparison-data/tr/"+iseki+".json");
 test.skip(sample.status()===404,"Offline build contains no published tractor fixtures; live source-linked test is required after deploy.");
 expect(sample.status()).toBe(200);
 for(const [left,right,label,firstContext,secondContext] of [
  [iseki,newHolland,"Arka kaldırma kapasitesi","T97 Cabin","610 mm behind ball ends"],
  [tymF36,tymT475,"Toplam yükseklik","Front-ROPS","To top of cabin"],
  [tymF36,tymT475,"Dingil mesafesi","1670","HST transmission"]
 ]){
  const response=await page.goto("/tr/compare/?left="+left+"&right="+right,{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const row=page.locator("#tc-rows tr").filter({has:page.locator("th").filter({hasText:label})});
  await expect(row).toHaveCount(1);
  await expect(row.locator("th .tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(row.locator("td").first()).toContainText(firstContext);
  await expect(row.locator("td").nth(1)).toContainText(secondContext);
  await expect(row.locator("td a[href^='https://']")).not.toHaveCount(0);
 }
 await page.goto("/compare/?left="+iseki+"&right="+newHolland,{waitUntil:"domcontentloaded"});
 await expect(page.locator("#tc-rows tr").filter({has:page.locator("th").filter({hasText:"Rear lift capacity"})}).locator(".tc-condition-caution")).toContainText("source notes");
});
