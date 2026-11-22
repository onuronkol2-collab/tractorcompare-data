import {test,expect} from "@playwright/test";

// Live, publicly published sources only. These stable IDs are audited in #408.
// Never log in, submit posts, accept analytics consent, or mutate any data.
const ISEKI="3e6886c4-8dc5-4d80-bafd-dc15b88454cc";
const NEW_HOLLAND="a31d36a5-694a-4157-90e4-71a13231ab06";
const TYM_F36="6f214ac1-0415-4433-98c9-5307aed48d9c";
const TYM_T475="8f3833e6-7eea-4a5c-a7eb-caa01b065cd5";
const tractorUrl=(left,right)=>"/tr/compare/?left="+left+"&right="+right;

// Use the visible searchable combobox a visitor actually operates. Native
// selects are hidden after hydration and would not prove public interaction.
async function chooseTractor(page,side,searchTerm){
  const input=page.locator("#tc-"+side+"-search");
  await expect(input).toBeVisible();
  await input.fill(searchTerm);
  const match=page.locator("#tc-"+side+"-results button.tc-result")
    .filter({hasText:searchTerm}).first();
  await expect(match).toBeVisible();
  await match.click();
}

test("live initial warning survives native selection, common-data filter and swap",async({page,request})=>{
  const isekiData=await request.get("/comparison-data/tr/"+ISEKI+".json");
  expect(isekiData.status(),"public source JSON must be published").toBe(200);
  const response=await page.goto(tractorUrl(ISEKI,NEW_HOLLAND),{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const lift=page.locator("#tc-rows tr").filter({has:page.locator("th").filter({hasText:"Arka kaldırma kapasitesi"})});
  await expect(lift.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(lift.locator("td a[href^='https://']")).not.toHaveCount(0);

  // Exercise actual visitor-facing combobox controls, not only server-generated HTML.
  await chooseTractor(page,"left","T3035");
  await chooseTractor(page,"right","T3047");
  await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_F36);
  await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_T475);
  const wheelbase=page.locator("#tc-rows tr").filter({has:page.locator("th").filter({hasText:"Dingil mesafesi"})});
  await expect(wheelbase.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(wheelbase.locator("td a[href^='https://']")).not.toHaveCount(0);
  const transmission=page.locator("#tc-rows tr").filter({
    has:page.locator("th .tc-condition-caution").filter({hasText:"Şanzıman seçenekleri"})
  });
  await expect(transmission).toHaveCount(1);
  await expect(transmission.locator("td a[href^='https://']")).not.toHaveCount(0);

  await page.locator("#tc-shared").click();
  await expect(page.locator("#tc-shared")).toHaveAttribute("aria-pressed","true");
  await expect(wheelbase.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(transmission.locator(".tc-condition-caution")).toContainText("üretici kaynağını");
  await page.locator("#tc-swap").click();
  await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_T475);
  await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_F36);
  await expect(wheelbase.locator(".tc-condition-caution")).toContainText("kaynak notlarını");
  await expect(transmission.locator(".tc-condition-caution")).toContainText("üretici kaynağını");
  await expect(wheelbase.locator("td a[href^='https://']")).not.toHaveCount(0);
  await expect(transmission.locator("td a[href^='https://']")).not.toHaveCount(0);
});

test("live MF 5S.125 and TYM option rows carry separate source-based transmission cautions",async({page})=>{
  const response=await page.goto(tractorUrl(ISEKI,NEW_HOLLAND),{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const mfOption=page.locator("#tc-left option").filter({hasText:/5S\.125/}).first();
  const mfId=await mfOption.getAttribute("value");
  expect(mfId,"published MF 5S.125 model required for evidence-backed QA").toBeTruthy();
  await chooseTractor(page,"left","5S.125");
  await chooseTractor(page,"right","T3047");
  await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(mfId);
  await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_T475);
  const warnings=page.locator("#tc-rows th .tc-condition-caution").filter({hasText:"Şanzıman seçenekleri"});
  await expect(warnings.first()).toBeVisible();
  const flaggedRow=page.locator("#tc-rows tr").filter({has:page.locator("th .tc-condition-caution").filter({hasText:"Şanzıman seçenekleri"})}).first();
  await expect(flaggedRow.locator("td a[href^='https://']")).not.toHaveCount(0);
  // A transmission caution is different from a measurement-condition caution.
  await expect(flaggedRow.locator(".tc-condition-caution")).not.toContainText("Ölçüm koşulları");
});


/**
 * Production locale regressions: the Turkish flow above passed in #415.
 * Re-run the same public visitor interaction in every other supported locale,
 * across Chromium, Firefox, WebKit and mobile Chromium. Source labels are
 * checked against human-readable expectations rather than trusting the
 * site's own translation JSON as its only oracle.
 *
 * The tests never authenticate, submit data, accept analytics, write to the
 * database or require a paid crawler.
 */
const OTHER_LOCALES = [
  {code:"en", html:"en", condition:"Measurement conditions or configurations differ",
    transmission:"Transmission options differ", shared:"Both have data", search:"Search brand or model"},
  {code:"zh", html:"zh-Hans", condition:"测量条件或配置不同",
    transmission:"变速箱配置不同", shared:"两者都有数据", search:"搜索品牌或型号"},
  {code:"hi", html:"hi", condition:"माप की स्थितियाँ या विन्यास अलग हैं",
    transmission:"ट्रांसमिशन विकल्प अलग हैं", shared:"दोनों के उपलब्ध डेटा", search:"ब्रांड या मॉडल खोजें"},
  {code:"pt-br", html:"pt-BR", condition:"As condições de medição ou as configurações diferem",
    transmission:"As opções de transmissão diferem", shared:"Com dados nos dois", search:"Buscar marca ou modelo"},
  {code:"fr", html:"fr", condition:"Les conditions de mesure ou configurations diffèrent",
    transmission:"Les options de transmission diffèrent", shared:"Données des deux", search:"Rechercher une marque ou un modèle"},
  {code:"de", html:"de", condition:"Messbedingungen oder Ausstattungen unterscheiden",
    transmission:"Die Getriebeoptionen unterscheiden", shared:"Daten für beide", search:"Marke oder Modell suchen"},
  {code:"ru", html:"ru", condition:"Условия измерения или комплектации отличаются",
    transmission:"Варианты трансмиссии различаются", shared:"Есть данные у обоих", search:"Поиск марки или модели"},
  {code:"ja", html:"ja", condition:"測定条件や仕様が異なる",
    transmission:"変速機の仕様が異なる", shared:"両方にデータあり", search:"メーカーや型式を検索"},
  {code:"es", html:"es", condition:"Las condiciones de medición o las configuraciones difieren",
    transmission:"Las opciones de transmisión difieren", shared:"Datos en ambos", search:"Buscar marca o modelo"},
];

// Keep this independent of the actual warning implementation: if the page
// silently falls back to English or shows the wrong language, the test fails.
for (const language of OTHER_LOCALES) {
  test("live "+language.code+" comparison preserves localized source cautions across real interactions", async({page,request})=>{
    test.setTimeout(90_000);
    const prefix=language.code==="en"?"/":"/"+language.code+"/";
    const path=prefix+"compare/";
    const json=await request.get("/comparison-data/"+language.code+"/"+TYM_F36+".json");
    expect(json.status(),language.code+" publicly served comparison JSON").toBe(200);
    const response=await page.goto(path+"?left="+ISEKI+"&right="+NEW_HOLLAND,{waitUntil:"domcontentloaded"});
    expect(response?.status(),language.code+" comparison page").toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",language.html);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com"+path);
    await expect(page.locator('link[rel="alternate"][hreflang="'+language.html+'"]'))
      .toHaveAttribute("href","https://tractorvs.com"+path);

    const l10n=JSON.parse(await page.locator("#tc-i18n").textContent());
    expect(l10n.conditionCaution,language.code+" measurement wording").toContain(language.condition);
    expect(l10n.transmissionCaution,language.code+" gearbox wording").toContain(language.transmission);
    expect(l10n.search,language.code+" search wording").toBe(language.search);
    await expect(page.locator("#tc-shared")).toHaveText(language.shared);
    await expect(page.locator("#tc-left-search")).toHaveAttribute("placeholder",language.search);

    // Test server-rendered source caveat BEFORE changing models.
    const firstCondition=page.locator("#tc-rows tr").filter({
      has:page.locator("th .tc-condition-caution").filter({hasText:language.condition})
    }).first();
    await expect(firstCondition).toBeVisible();
    await expect(firstCondition.locator("th [role='note']")).toBeVisible();
    await expect(firstCondition.locator("td a[href^='https://']")).not.toHaveCount(0);

    // Test the actual visitor-facing combobox; not the hidden native <select>.
    await chooseTractor(page,"left","T3035");
    await chooseTractor(page,"right","T3047");
    await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_F36);
    await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_T475);
    await expect(page.locator("#tc-left-link")).toContainText("T3035");
    await expect(page.locator("#tc-right-link")).toContainText("T3047");

    const sourceRows=()=>page.locator("#tc-rows tr").filter({
      has:page.locator("th .tc-condition-caution").filter({hasText:language.transmission})
    });
    await expect(sourceRows()).toHaveCount(1);
    const transmission=sourceRows().first();
    await expect(transmission.locator("th [role='note']")).toContainText(language.transmission);
    await expect(transmission).toContainText(/3-[Rr]ange/);
    await expect(transmission).toContainText("F12 x R12");
    const sources=async()=>transmission.locator("td a[href^='https://']")
      .evaluateAll(nodes=>nodes.map(node=>node.getAttribute("href")).sort());
    const beforeSwap=await sources();
    expect(beforeSwap.length,language.code+" original manufacturer links").toBeGreaterThan(0);
    expect(beforeSwap.some(href=>href.includes("tym.world")),language.code+" approved OEM citation").toBe(true);

    // Filtering must not hide shared gearbox options or their source notes.
    await page.locator("#tc-shared").click();
    await expect(page.locator("#tc-shared")).toHaveAttribute("aria-pressed","true");
    await expect(sourceRows()).toHaveCount(1);
    await expect(transmission.locator("th [role='note']")).toContainText(language.transmission);

    // Swapping preserves the actual data, not merely the translated sentence.
    await page.locator("#tc-swap").click();
    await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_T475);
    await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_F36);
    await expect(page.locator("#tc-left-link")).toContainText("T3047");
    await expect(page.locator("#tc-right-link")).toContainText("T3035");
    await expect(sourceRows()).toHaveCount(1);
    expect(await sources(),language.code+" source URLs after swapping").toEqual(beforeSwap);

    // A reload must restore chosen models, rather than stale first-load table.
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(page.locator("#tc-left-link")).toContainText("T3047");
    await expect(page.locator("#tc-right-link")).toContainText("T3035");
    await expect(sourceRows()).toHaveCount(1);
    expect(await sources(),language.code+" source URLs after reload").toEqual(beforeSwap);
    expect((await page.locator("#tc-load-error").textContent())?.trim()||"").toBe("");
  });
}


// A language menu created at first page load can contain stale model IDs after
// history.replaceState. This real-browser test covers every source locale and
// destination navigation on desktop/mobile. Only run the new assertion after
// deployment, not against older production during a pull request.
for (const language of [{code:"tr",html:"tr"},...OTHER_LOCALES]) {
  test("live "+language.code+" language switch retains dynamically selected pair",async({page})=>{
    test.skip(process.env.COMPARE_QA_PREDEPLOY==="true",
      "Predeploy browser QA must not test new code against old production.");
    test.setTimeout(90_000);
    const sourcePath=(language.code==="en"?"/":"/"+language.code+"/")+"compare/";
    const response=await page.goto(sourcePath+"?left="+ISEKI+"&right="+NEW_HOLLAND,{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",language.html);
    const links=page.locator("[data-language-choice]");
    await expect(links).toHaveCount(10);
    const checkDestinations=async(left,right)=>{
      const destinations=await links.evaluateAll(nodes=>nodes.map(a=>a.getAttribute("href")));
      for(const href of destinations){
        expect(href).toBeTruthy();
        const target=new URL(href,"https://tractorvs.com");
        expect(target.searchParams.get("left"),language.code+" left: "+target.pathname).toBe(left);
        expect(target.searchParams.get("right"),language.code+" right: "+target.pathname).toBe(right);
      }
    };

    await chooseTractor(page,"left","T3035");
    await chooseTractor(page,"right","T3047");
    await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_F36);
    await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_T475);
    await checkDestinations(TYM_F36,TYM_T475);

    await page.locator("#tc-swap").click();
    await expect.poll(()=>new URL(page.url()).searchParams.get("left")).toBe(TYM_T475);
    await expect.poll(()=>new URL(page.url()).searchParams.get("right")).toBe(TYM_F36);
    await checkDestinations(TYM_T475,TYM_F36);

    const destinationLang=language.code==="tr"?"en":"tr";
    const targetPath=(destinationLang==="en"?"/":"/"+destinationLang+"/")+"compare/";
    await page.locator(".locale-menu > summary").click();
    await page.locator('[data-language-choice][data-language-code="'+destinationLang+'"]').click();
    await expect.poll(()=>new URL(page.url()).pathname).toBe(targetPath);
    const url=new URL(page.url());
    expect(url.searchParams.get("left")).toBe(TYM_T475);
    expect(url.searchParams.get("right")).toBe(TYM_F36);
    await expect(page.locator("html")).toHaveAttribute("lang",destinationLang);
    await expect(page.locator("#tc-left-link")).toContainText("T3047");
    await expect(page.locator("#tc-right-link")).toContainText("T3035");

    // SEO metadata remains canonical/query-free despite mutable visitor URLs.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com"+targetPath);
    const alternates=await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
      nodes=>nodes.map(node=>node.getAttribute("href")));
    expect(alternates.length).toBeGreaterThanOrEqual(10);
    expect(alternates.every(href=>!href?.includes("?"))).toBe(true);
    const l10n=JSON.parse(await page.locator("#tc-i18n").textContent());
    const row=page.locator("#tc-rows tr").filter({
      has:page.locator("th .tc-condition-caution").filter({hasText:l10n.transmissionCaution})
    }).first();
    await expect(row).toBeVisible();
    await expect(row.locator("td a[href^='https://']")).not.toHaveCount(0);
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(page.locator("#tc-left-link")).toContainText("T3047");
    await expect(page.locator("#tc-right-link")).toContainText("T3035");
  });
}


// Research-first discovery QA. This is deliberately separate from commercial
// shopping journeys: never click a purchase CTA, authenticate or mutate data.
// During a PR the public site still contains the previous release, therefore
// only post-deployment production checks execute these new scenarios.
for(const language of [{code:"tr",html:"tr"},...OTHER_LOCALES]){
  test("live "+language.code+" research sidebar filters published tractors and preserves SEO",async({page})=>{
    test.skip(process.env.COMPARE_QA_PREDEPLOY==="true",
      "New research facet markup is tested only after its Cloudflare deployment.");
    test.setTimeout(90_000);
    const root=language.code==="en"?"/":"/"+language.code+"/";
    const path=root+"tractors/";
    const response=await page.goto(path,{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",language.html);
    const cards=page.locator(".tractor-card");
    const total=await cards.count();
    expect(total).toBeGreaterThan(0);
    const panel=page.locator("#catalog-facet-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-research-facets","published");
    const brandSelect=page.locator("#catalog-facet-brand");
    expect(await brandSelect.locator("option").count()).toBeGreaterThan(1);
    const brand=await brandSelect.locator("option").nth(1).getAttribute("value");
    expect(brand).toBeTruthy();
    await brandSelect.selectOption(brand);
    const visible=page.locator(".tractor-card:visible");
    expect(await visible.count()).toBeGreaterThan(0);
    expect((await visible.evaluateAll(nodes=>nodes.map(x=>x.getAttribute("data-brand"))))
      .every(value=>value===brand)).toBe(true);
    expect(new URL(page.url()).searchParams.get("brand")).toBe(brand);
    await page.locator("#catalog-facet-power").selectOption("p51");
    expect(new URL(page.url()).searchParams.get("power")).toBe("p51");
    for(const value of await visible.evaluateAll(nodes=>nodes.map(x=>x.getAttribute("data-power")))){
      const power=Number(value);
      expect(value).not.toBe("");
      expect(power).toBeGreaterThan(50);
      expect(power).toBeLessThanOrEqual(100);
    }
    await page.locator("#catalog-facet-power").selectOption("");
    await page.locator("#catalog-facet-sort").selectOption("powerAsc");
    expect(new URL(page.url()).searchParams.get("sort")).toBe("powerAsc");
    const ranked=await visible.evaluateAll(nodes=>nodes.map(x=>({
      order:Number(x.style.order), power:x.getAttribute("data-power")
    })).sort((a,b)=>a.order-b.order));
    const powers=ranked.filter(x=>x.power!==""&&Number.isFinite(Number(x.power)))
      .map(x=>Number(x.power));
    expect(powers).toEqual([...powers].sort((a,b)=>a-b));
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href","https://tractorvs.com"+path);
    const alternates=await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
      nodes=>nodes.map(node=>node.getAttribute("href")));
    expect(alternates.length).toBeGreaterThanOrEqual(10);
    expect(alternates.every(href=>!href?.includes("?"))).toBe(true);
    // All published model links remain present for crawlers after client
    // filtering; switching the display must not remove catalogue records.
    expect(await page.locator(".tractor-card-main[href]").count()).toBe(total);
    const next=language.code==="tr"?"en":"tr";
    const nextPath=(next==="en"?"/":"/tr/")+"tractors/";
    await page.locator(".locale-menu > summary").click();
    await page.locator('[data-language-choice][data-language-code="'+next+'"]').click();
    await expect.poll(()=>new URL(page.url()).pathname).toBe(nextPath);
    const params=new URL(page.url()).searchParams;
    expect(params.get("brand")).toBe(brand);
    expect(params.get("sort")).toBe("powerAsc");
    await expect(page.locator("#catalog-facet-brand")).toHaveValue(brand);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href","https://tractorvs.com"+nextPath);
  });

  test("live "+language.code+" shared technical view remains active after language change",async({page})=>{
    test.skip(process.env.COMPARE_QA_PREDEPLOY==="true",
      "Shared-view persistence is tested against the new release, not the old site.");
    test.setTimeout(90_000);
    const prefix=language.code==="en"?"/":"/"+language.code+"/";
    const path=prefix+"compare/";
    const response=await page.goto(path+"?left="+TYM_F36+"&right="+TYM_T475+"&view=shared",
      {waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",language.html);
    await expect(page.locator("#tc-shared")).toHaveAttribute("aria-pressed","true");
    await expect(page.locator("#tc-left-link")).toContainText("T3035");
    await expect(page.locator("#tc-right-link")).toContainText("T3047");
    await page.locator("#tc-all").click();
    await expect.poll(()=>new URL(page.url()).searchParams.has("view")).toBe(false);
    await page.locator("#tc-shared").click();
    await expect.poll(()=>new URL(page.url()).searchParams.get("view")).toBe("shared");
    const next=language.code==="tr"?"en":"tr";
    const nextPath=(next==="en"?"/":"/tr/")+"compare/";
    await page.locator(".locale-menu > summary").click();
    await page.locator('[data-language-choice][data-language-code="'+next+'"]').click();
    await expect.poll(()=>new URL(page.url()).pathname).toBe(nextPath);
    expect(new URL(page.url()).searchParams.get("view")).toBe("shared");
    expect(new URL(page.url()).searchParams.get("left")).toBe(TYM_F36);
    expect(new URL(page.url()).searchParams.get("right")).toBe(TYM_T475);
    await expect(page.locator("#tc-shared")).toHaveAttribute("aria-pressed","true");
    await expect(page.locator("#tc-rows tr td a[href^='https://']").first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute("href","https://tractorvs.com"+nextPath);
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(page.locator("#tc-shared")).toHaveAttribute("aria-pressed","true");
    await expect(page.locator("#tc-left-link")).toContainText("T3035");
  });
}
