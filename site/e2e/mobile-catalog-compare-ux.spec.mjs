import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const source = relative => readFileSync(fileURLToPath(new URL(relative, import.meta.url)),"utf8");
const catalogCss = source("../src/components/TractorCatalog.astro").match(/<style is:global>([\s\S]*?)<\/style>/)?.[1];
const comparisonCss = source("../src/styles/compare-experience.css");
const comparisonInlineCss = source("../src/components/TractorComparison.astro").match(/<style is:global>([\s\S]*?)<\/style>/)?.[1];
const sharedCss = source("../src/styles/global.css") + "\n" + source("../src/styles/research-layout.css");
if(!catalogCss || !comparisonInlineCss) throw Error("Missing mobile source CSS fixture");


const noDocumentOverflow = async page => page.evaluate(() =>
  document.documentElement.scrollWidth <= innerWidth + 2);

for(const width of [320,359,360,390,490,690,768]){
  test(`catalogue filter controls retain a usable grid at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:800});
    const response=await page.goto("/tr/tractors/",{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    const panel=page.locator("#catalog-facet-panel");
    test.skip(!(await panel.isVisible()),"No published catalogue fixture in the inert local build.");
    const grid=page.locator(".catalog-facet-fields");
    const cols=await grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
    expect(cols).toBe(width<360?1:2);
    for(const control of ["#catalog-facet-brand","#catalog-facet-power","#catalog-facet-year","#catalog-facet-sort"]){
      const node=page.locator(control);
      await expect(node).toBeVisible();
      const metrics=await node.evaluate(el=>{const s=getComputedStyle(el);return {font:parseFloat(s.fontSize),height:el.getBoundingClientRect().height};});
      expect(metrics.font).toBeGreaterThanOrEqual(16);
      expect(metrics.height).toBeGreaterThanOrEqual(44);
    }
    const country=page.locator("#catalog-price-country");
    await expect(country).toBeVisible();
    expect(await country.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await noDocumentOverflow(page)).toBe(true);
  });
}
test("catalogue filter selection preserves canonical and visible published model links",async({page})=>{
  await page.setViewportSize({width:390,height:800});
  await page.goto("/tr/tractors/",{waitUntil:"domcontentloaded"});
  const panel=page.locator("#catalog-facet-panel");
  test.skip(!(await panel.isVisible()),"No published catalogue fixture in the inert local build.");
  const options=page.locator("#catalog-facet-brand option");
  test.skip((await options.count())<2,"No selectable published brands in the inert local build.");
  const before=await page.locator(".tractor-card-main[href]").count();
  const brand=await options.nth(1).getAttribute("value");
  await page.locator("#catalog-facet-brand").selectOption(brand);
  await expect(page.locator("#catalog-reset-facets")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("brand")).toBe(brand);
  await page.locator("#catalog-reset-facets").click();
  expect(new URL(page.url()).searchParams.get("brand")).toBe(null);
  expect(await page.locator(".tractor-card-main[href]").count()).toBe(before);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://tractorvs.com/tr/tractors/");
});
test("mobile comparison retains row/column semantics and legible source targets",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const response=await page.goto("/tr/compare/",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const table=page.locator(".tc-table");
  test.skip(!(await table.count()),"No two published comparison fixtures in the inert local build.");
  await expect(table.locator("caption")).toHaveCount(1);
  await expect(table.locator('th[scope="col"]')).toHaveCount(3);
  const row=table.locator("tbody tr").first();
  await expect(row.locator('th[scope="row"]')).toHaveCount(1);
  await expect(row.locator("td")).toHaveCount(2);
  expect(await row.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(/\s+/).length)).toBe(2);
  expect(await noDocumentOverflow(page)).toBe(true);
  const sourceLink=table.locator(".tc-entry a").first();
  if(await sourceLink.count()){
    const dimensions=await sourceLink.evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),height:el.getBoundingClientRect().height}));
    expect(dimensions.font).toBeGreaterThanOrEqual(14);
    expect(dimensions.height).toBeGreaterThanOrEqual(36);
  }
});


// Synthetic source CSS layout tests: these run even when production catalogue
// records are deliberately absent from the inert CI HTML build. They use the
// exact checked-in CSS, not a hand-copied imitation of the mobile rules.
test("synthetic source CSS preserves responsive catalogue controls at 320/359/360/390/490/690/768",async({page})=>{
  for(const width of [320,359,360,390,490,690,768]){
    await page.setViewportSize({width,height:800});
    await page.setContent(`<meta name="viewport" content="width=device-width, initial-scale=1"><style>${sharedCss}\n${catalogCss}</style>
      <main id="main"><div class="catalog-discovery-layout">
        <aside class="catalog-facet-panel"><div class="catalog-facet-heading"><h2>Filters</h2></div>
          <div class="catalog-facet-fields">
            <label>Brand<select><option>All</option></select></label>
            <label>Power<select><option>All</option></select></label>
            <label>Year<select><option>All</option></select></label>
            <label>Sort<select><option>All</option></select></label>
          </div>
        </aside></div>
        <div class="catalog-price-filter"><label>Country</label><select><option>Country</option></select></div>
      </main>`);
    const fields=page.locator(".catalog-facet-fields");
    const tracks=await fields.evaluate(node=>getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).length);
    expect(tracks).toBe(width<360?1:2);
    if(width===390){
      const [brand,power,sort]=await page.locator(".catalog-facet-fields label").evaluateAll(els=>
        [els[0],els[1],els[3]].map(el=>el.getBoundingClientRect().width));
      expect(brand).toBeGreaterThan(power*1.5);
      expect(sort).toBeGreaterThan(power*1.5);
    }
    for(const sel of [".catalog-facet-fields select",".catalog-price-filter select"]){
      const metrics=await page.locator(sel).first().evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),height:el.getBoundingClientRect().height}));
      expect(metrics.font).toBeGreaterThanOrEqual(16);
      expect(metrics.height).toBeGreaterThanOrEqual(44);
    }
    expect(await noDocumentOverflow(page),String(width)).toBe(true);
  }
});

test("synthetic source CSS keeps mobile comparison model columns and readable citations",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.setContent(`<meta name="viewport" content="width=device-width, initial-scale=1"><style>${sharedCss}\n${comparisonCss}\n${comparisonInlineCss}</style>
    <main id="main"><section class="tc-section">
      <div class="tc-table-wrap"><table class="tc-table">
        <caption class="tc-sr-only">Published comparisons</caption>
        <thead><tr><th scope="col">Specification</th><th scope="col">Model A</th><th scope="col">Model B</th></tr></thead>
        <tbody><tr><th scope="row">Hydraulic lifting capacity</th>
          <td><span class="tc-cell-model">Model A</span><div class="tc-entry"><strong>3000 kg</strong><a href="https://example.org/source">Manufacturer source</a></div></td>
          <td><span class="tc-cell-model">Model B</span><div class="tc-entry"><strong>3200 kg</strong><a href="https://example.org/source2">Manufacturer source</a></div></td>
        </tr></tbody>
      </table></div></section></main>`);
  const table=page.locator(".tc-table");
  await expect(table.locator("caption")).toHaveCount(1);
  await expect(table.locator('th[scope="col"]')).toHaveCount(3);
  const row=table.locator("tbody tr").first();
  await expect(row.locator('th[scope="row"]')).toHaveCount(1);
  const layout=await row.evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(/\s+/).length,display:getComputedStyle(el).display}));
  expect(layout).toEqual({columns:2,display:"grid"});
  const link=page.locator(".tc-entry a").first();
  const metrics=await link.evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),height:el.getBoundingClientRect().height}));
  expect(metrics.font).toBeGreaterThanOrEqual(14);
  expect(metrics.height).toBeGreaterThanOrEqual(36);
  // Keyboard users must reach the actual citation and reveal the row focus state.
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await expect(link).toMatchAriaSnapshot(`- link "Manufacturer source"`);
  await expect(row).toHaveCSS("border-color","rgb(75, 144, 96)");
  expect(await noDocumentOverflow(page)).toBe(true);
});

// Only intercepted test-browser responses contain these invented records.
// The production build, catalogue, database and generated files remain untouched.
// The real Astro-bundled client scripts still execute; never skip the new behavior
// just because CI intentionally builds without a public catalogue.
const fixtureSpec=(key,label,value)=>({key,label,value,unit:null,context:null,rpm:null,source:null,independent:false,notice:null});
const fixtureModels=[
  {title:"QA Tractor A",variant:null,power:null,specsCount:3,detailsUrl:"/tr/tractors/",photo:null,specs:[
    fixtureSpec("fixture_equal","QA Equal","1"),fixtureSpec("fixture_difference","QA Difference","2"),
    fixtureSpec("fixture_missing","QA Missing","3")]},
  {title:"QA Tractor B",variant:null,power:null,specsCount:2,detailsUrl:"/tr/tractors/",photo:null,specs:[
    fixtureSpec("fixture_equal","QA Equal","1"),fixtureSpec("fixture_difference","QA Difference","4")]}
];
function replacePayload(html,id,data){
  const pattern=new RegExp('(<script\\b[^>]*\\bid="'+id+'"[^>]*>)[\\s\\S]*?(</script>)');
  if(!pattern.test(html))throw Error("Missing compiled payload: "+id);
  return html.replace(pattern,(_,open,close)=>open+JSON.stringify(data)+close);
}
const fixturePicker=()=>{
  const controls=["left","right"].map((side,index)=>
    '<div class="tc-picker-side"><div class="tc-searchbox"><input class="tc-combo-input" id="tc-'+side+'-search" aria-label="'+side+'" role="combobox" aria-expanded="false" aria-controls="tc-'+side+'-results" aria-autocomplete="list"><div class="tc-picker-results" id="tc-'+side+'-results" role="listbox" hidden></div></div><select class="tc-native-select" id="tc-'+side+'"><option value="qa-a" '+(index===0?"selected":"")+'>QA Tractor A</option><option value="qa-b" '+(index===1?"selected":"")+'>QA Tractor B</option></select></div>'
  ).join("");
  return '<section class="tc-section"><div id="tc-picker" class="tc-picker" data-directory="/comparison-data/tr/">'+controls+'</div><div class="tc-table-bar"><div class="tc-table-bar-title"><h2>QA comparison</h2></div><div class="tc-filters" role="group" aria-label="Comparison filters"><button id="tc-all" type="button" aria-pressed="true">All</button><button id="tc-shared" type="button" aria-pressed="false">Shared</button><button id="tc-different" type="button" aria-pressed="false" hidden>Different</button></div></div><p id="tc-different-note" hidden>Different published entries only</p><p id="tc-no-shared" hidden></p><p id="tc-summary"></p><table class="tc-table"><tbody id="tc-rows"></tbody></table></section>';
};
test("comparison combobox retains input focus and differing-data view is shareable",async({page})=>{
  await page.route(url=>url.pathname==="/tr/compare/",async route=>{
    const response=await route.fetch();
    let html=await response.text();
    // On a populated build use the real controls and real records instead.
    if(!html.includes('id="tc-picker"')){
      html=replacePayload(html,"tc-payload",fixtureModels);
      html=html.replace("</body>",fixturePicker()+"</body>");
    }
    await route.fulfill({response,body:html});
  });
  await page.goto("/tr/compare/",{waitUntil:"load"});
  // Exercise the actual consent controls rather than forcing a click through
  // the fixed mobile banner. The user's rejection must persist across reload.
  const consentBanner=page.locator("#tractorvs-analytics-banner");
  await expect(consentBanner).toBeVisible();
  await page.locator("#tractorvs-analytics-reject").click();
  await expect(consentBanner).toBeHidden();
  await expect(page.locator("#tc-picker")).toHaveClass(/tc-js-ready/);
  const input=page.locator("#tc-left-search");
  await input.focus();
  const options=page.locator("#tc-left-results .tc-result");
  await expect(options.first()).toBeVisible();
  await input.press("ArrowUp");
  await expect(input).toHaveAttribute("aria-activedescendant",await options.last().getAttribute("id"));
  await expect(input).toBeFocused();
  await expect(options.first()).toHaveAttribute("tabindex","-1");
  await input.press("Tab");
  await expect(input).toHaveAttribute("aria-expanded","false");
  // Tab can move to the next model combobox and legitimately open its list.
  // Dismiss it by keyboard, then leave the picker before clicking filters.
  const nextInput=page.locator("#tc-right-search");
  if(await nextInput.evaluate(el=>el===document.activeElement)){
    await expect(nextInput).toHaveAttribute("aria-expanded","true");
    await nextInput.press("Escape");
    await expect(nextInput).toHaveAttribute("aria-expanded","false");
  }
  await expect(page.locator("#tc-left-results")).toBeHidden();
  await expect(page.locator("#tc-right-results")).toBeHidden();
  const fixture=await page.locator("#tc-rows th").filter({hasText:"QA Equal"}).count()>0;
  const diff=page.locator("#tc-different");
  await diff.click();
  await expect(diff).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#tc-different-note")).toBeVisible();
  if(fixture){
    await expect(page.locator("#tc-rows th")).toHaveText(["QA Difference"]);
  }
  await expect.poll(()=>new URL(page.url()).searchParams.get("view")).toBe("different");
  await page.reload({waitUntil:"load"});
  await expect(consentBanner).toBeHidden();
  await expect(diff).toHaveAttribute("aria-pressed","true");
  if(fixture)await expect(page.locator("#tc-rows th")).toHaveText(["QA Difference"]);
  await page.locator("#tc-shared").click();
  if(fixture)await expect(page.locator("#tc-rows th")).toHaveText(["QA Difference","QA Equal"]);
  await page.locator("#tc-all").click();
  if(fixture)await expect(page.locator("#tc-rows th")).toHaveText(["QA Difference","QA Equal","QA Missing"]);
  await expect.poll(()=>new URL(page.url()).searchParams.get("view")).toBe(null);
});

test("home search suggestions keep DOM focus and leave the Tab sequence",async({page})=>{
  await page.route(url=>url.pathname==="/tr/",async route=>{
    const response=await route.fetch();
    const html=replacePayload(await response.text(),"home-suggestions-data",[
      {brand:"QA Tractor",model:"A",variant:null,year:null,horsepower:null,specs:3,url:"/tr/tractors/"},
      {brand:"QA Tractor",model:"B",variant:null,year:null,horsepower:null,specs:2,url:"/tr/tractors/"}
    ]);
    await route.fulfill({response,body:html});
  });
  await page.goto("/tr/",{waitUntil:"load"});
  const input=page.locator("#home-model-query");
  await input.fill("QA Tractor");
  const options=page.locator("#home-search-results .home-search-option");
  await expect(options).toHaveCount(2);
  await expect(options.first()).toBeVisible();
  await input.press("ArrowUp");
  await expect(input).toHaveAttribute("aria-activedescendant",await options.last().getAttribute("id"));
  await expect(input).toBeFocused();
  await expect(options.first()).toHaveAttribute("tabindex","-1");
  await input.press("Tab");
  await expect(input).toHaveAttribute("aria-expanded","false");
});
