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

test("comparison combobox retains input focus and differing-data view is shareable",async({page})=>{
  await page.goto("/tr/compare/",{waitUntil:"domcontentloaded"});
  const input=page.locator("#tc-left-search");
  test.skip(!(await input.isVisible()),"No published comparison fixtures in the inert local build.");
  await input.focus();
  const options=page.locator("#tc-left-results .tc-result");
  await expect(options.first()).toBeVisible();
  await input.press("ArrowUp");
  await expect(input).toHaveAttribute("aria-activedescendant",await options.last().getAttribute("id"));
  await expect(input).toBeFocused();
  await expect(options.first()).toHaveAttribute("tabindex","-1");
  await input.press("Tab");
  await expect(input).toHaveAttribute("aria-expanded","false");
  const diff=page.locator("#tc-different");
  await diff.click();
  await expect(diff).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#tc-different-note")).toBeVisible();
  await expect.poll(()=>new URL(page.url()).searchParams.get("view")).toBe("different");
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(diff).toHaveAttribute("aria-pressed","true");
  await page.locator("#tc-all").click();
  await expect.poll(()=>new URL(page.url()).searchParams.get("view")).toBe(null);
});
