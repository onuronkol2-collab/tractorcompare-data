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
    test.setTimeout(180_000);
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

    // Genuine local-only research journey on the production release. The
    // private UI must never pollute the initial editorial HTML checkpoint.
    const raw=await opened.text();
    const initialMain=raw.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
    expect(initialMain).toBeTruthy();
    expect(initialMain).not.toContain('id="research-workspace"');
    const favorite=page.locator("#main [data-research-favorite]");
    await expect(favorite).toBeVisible();
    await expect(favorite).toHaveAttribute("aria-pressed","false");
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed","true");
    const modelId=await page.locator("#research-workspace").getAttribute("data-model-id");
    expect(modelId).toMatch(/^[0-9a-f-]{36}$/);
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(favorite).toHaveAttribute("aria-pressed","true");
    const catalog=await page.goto(root+"tractors/#research-workspace",{waitUntil:"domcontentloaded"});
    expect(catalog?.status()).toBe(200);
    const workspace=page.locator("#main #research-workspace");
    await expect(workspace).toBeVisible();
    await expect(workspace.locator('[data-research-list="favorites"] li a')).toHaveCount(2);
    const other=await page.locator(".tractor-card").evaluateAll((cards,id)=>
      cards.find(card=>card.querySelector("[data-price-for]")?.getAttribute("data-price-for")!==id)
        ?.querySelector(".tractor-card-main")?.getAttribute("href"),modelId);
    expect(other).toBeTruthy();
    await page.goto(other,{waitUntil:"domcontentloaded"});
    await expect(favorite).toBeVisible();
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed","true");
    await page.goto(root+"tractors/#research-workspace",{waitUntil:"domcontentloaded"});
    await expect(workspace.locator('[data-research-list="favorites"] li a')).toHaveCount(4);
    await workspace.locator("[data-research-compare-two]").click();
    await expect(page.locator("#tc-share")).toBeEnabled();
    await page.locator("#tc-shared").click();
    const save=page.locator("#main [data-research-save]");
    await expect(save).toBeEnabled();
    await save.click();
    const saved=page.locator('[data-research-list="comparisons"] li a');
    await expect(saved).toHaveCount(1);
    const savedHref=await saved.getAttribute("href");
    expect(new URL(savedHref,page.url()).searchParams.get("view")).toBe("shared");
    await page.goto(root+"tractors/#research-workspace",{waitUntil:"domcontentloaded"});
    await expect(saved).toHaveCount(1);
    await workspace.locator("[data-research-clear-recent]").click();
    await expect(workspace.locator('[data-research-list="recent"] li a')).toHaveCount(0);
    page.once("dialog",dialog=>dialog.accept());
    await workspace.locator("[data-research-clear]").click();
    await expect(workspace.locator('[data-research-list="favorites"] li a')).toHaveCount(0);
    await expect(saved).toHaveCount(0);

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
