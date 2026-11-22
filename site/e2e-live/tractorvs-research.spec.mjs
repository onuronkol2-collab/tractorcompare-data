import {test,expect} from "@playwright/test";

/**
 * One integrated, genuine user research journey per language and browser.
 * Public, read-only navigation only. No login, no external paid tools, no
 * forum endpoints, no analytics consent, no data creation, no invented specs.
 */
const LANGUAGES=[
  {code:"en",html:"en"},{code:"tr",html:"tr"},{code:"zh",html:"zh-Hans"},
  {code:"hi",html:"hi"},{code:"pt-br",html:"pt-BR"},{code:"fr",html:"fr"},
  {code:"de",html:"de"},{code:"ru",html:"ru"},{code:"ja",html:"ja"},
  {code:"es",html:"es"}
];
for(const lang of LANGUAGES){
  test("live "+lang.code+" licensed tractor research, technical navigation, advisor and source library",async({page})=>{
    test.skip(process.env.RESEARCH_QA_PREDEPLOY==="true",
      "This test must use the NEW Cloudflare release, never an older production snapshot.");
    test.setTimeout(110_000);
    const root=lang.code==="en"?"/":"/"+lang.code+"/";
    const home=await page.goto(root,{waitUntil:"domcontentloaded"});
    expect(home?.status(),"home HTTP").toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",lang.html);

    const cards=page.locator(".home-featured-card");
    expect(await cards.count(),"actual published featured models").toBeGreaterThan(0);
    await expect(page.locator(".home-featured-grid"))
      .toHaveAttribute("data-research-gallery","licensed");
    const first=cards.first();
    const modelLink=first.locator(".home-featured-main[href]");
    await expect(modelLink).toBeVisible();
    await expect(first.locator(".tractor-photo-gallery")).toBeVisible();
    // A photo button/photographer link may NEVER be nested in the model link.
    expect(await modelLink.locator(".tractor-photo-button").count()).toBe(0);
    const photos=first.locator(".tractor-photo-button");
    if(await photos.count()){
      await expect(first.locator(".tractor-photo-short-credit a"))
        .toHaveAttribute("href",/^https:\/\//);
    }else await expect(first.locator(".tractor-photo-placeholder")).toBeVisible();
    expect((await first.textContent())||"").not.toMatch(/Buy now|Satın al|Checkout|Teklif al/i);
    const modelHref=await modelLink.getAttribute("href");
    expect(modelHref).toContain("/tractors/");
    const opened=await page.goto(modelHref,{waitUntil:"domcontentloaded"});
    expect(opened?.status(),"published model detail").toBe(200);
    const groups=page.locator(".model-spec-group");
    const n=await groups.count();
    expect(n,"genuine technical groups").toBeGreaterThan(0);
    if(n>1){
      const toc=page.locator(".model-spec-toc");
      await expect(toc).toBeVisible();
      await expect(toc.locator("a")).toHaveCount(n);
      const firstHref=await toc.locator("a").first().getAttribute("href");
      expect(firstHref).toBe("#model-spec-group-1");
      await toc.locator("a").first().click();
      await expect(page.locator(firstHref)).toBeVisible();
    }
    // We keep every manufacturer citation; no numeric tractor spec is edited.
    await expect(page.locator(".model-spec-card").first()).toBeVisible();

    const articles=await page.goto(root+"articles/",{waitUntil:"domcontentloaded"});
    expect(articles?.status(),"published articles").toBe(200);
    const discovery=page.locator("#editorial-discovery");
    await expect(discovery).toBeVisible();
    await expect(discovery).toHaveAttribute("data-research-articles","published");
    const rows=page.locator("[data-editorial-card]");
    const total=await rows.count();
    expect(total).toBeGreaterThan(0);
    const links=await page.locator("[data-editorial-card] h3 a[href]").count();
    await page.locator("#editorial-query").fill("no-such-sourced-article-987654321");
    await expect(page.locator("#editorial-no-results")).toBeVisible();
    await expect(page.locator("[data-editorial-card]:visible")).toHaveCount(0);
    await page.locator("#editorial-clear").click();
    await expect(page.locator("[data-editorial-card]:visible")).toHaveCount(total);
    expect(await page.locator("[data-editorial-card] h3 a[href]").count()).toBe(links);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href","https://tractorvs.com"+root+"articles/");

    const advisor=await page.goto(root+"farm-advisor/",{waitUntil:"domcontentloaded"});
    expect(advisor?.status(),"research advisor").toBe(200);
    const steps=page.locator(".advisor-step-jumps");
    await expect(steps).toHaveAttribute("data-research-advisor","steps");
    await expect(steps.locator("a")).toHaveCount(3);
    for(const id of ["advisor-land-title","advisor-equipment-title","advisor-more-title"]){
      await expect(steps.locator('a[href="#'+id+'"]')).toBeVisible();
      await expect(page.locator("#"+id)).toHaveCount(1);
    }
    await steps.locator('a[href="#advisor-equipment-title"]').click();
    expect(new URL(page.url()).hash).toBe("#advisor-equipment-title");
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href","https://tractorvs.com"+root+"farm-advisor/");
    const alternates=await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
      nodes=>nodes.map(node=>node.getAttribute("href")));
    expect(alternates.length).toBeGreaterThanOrEqual(10);
    expect(alternates.every(url=>!url?.includes("?"))).toBe(true);
  });
}
