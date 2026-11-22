import {test,expect} from "@playwright/test";

// Local inert preview only. Supply a tiny pricing-select fixture when public
// Supabase credentials are intentionally absent from PR CI. No real data write.
test.beforeEach(async ({page})=>{
 await page.route("**/*",route=>{
  const host=new URL(route.request().url()).hostname;
  return ["127.0.0.1","localhost"].includes(host)?route.continue():route.abort();
 });
 await page.route("**/api/visitor-country",route=>
  route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({country:"BR"})}));
 await page.route(url=>url.pathname==="/tr/tractors/",async route=>{
  const response=await route.fetch();
  let html=await response.text();
  if(!html.includes('id="catalog-price-country"')){
   const selector='<div class="catalog-price-filter"><label for="catalog-price-country">Market</label>'+
    '<select id="catalog-price-country"><option value="TR" selected>TR</option>'+
    '<option value="US">US</option><option value="BR">BR</option>'+
    '<option value="FR">FR</option></select></div>';
   html=html.replace("</body>",selector+"</body>");
  }
  await route.fulfill({response,body:html});
 });
});

test("manually chosen country survives direct URL and locale change without geolocation override",async({page})=>{
 const response=await page.goto("/tr/tractors/?q=Belarus&country=US",{waitUntil:"domcontentloaded"});
 expect(response?.status()).toBe(200);
 const select=page.locator("#catalog-price-country");
 await expect(select).toHaveValue("US"); // URL > mocked geo BR
 const de=page.locator('[data-language-choice][data-language-code="de"]').first();
 await expect.poll(async()=>de.getAttribute("href")).toContain("country=US");
 await expect(de).toHaveAttribute("href",/q=Belarus/);
 await select.selectOption("FR");
 await expect(page).toHaveURL(/country=FR/);
 await expect(page).toHaveURL(/q=Belarus/);
 await expect.poll(async()=>de.getAttribute("href")).toContain("country=FR");
 await expect(de).toHaveAttribute("href",/q=Belarus/);
});

test("automatic geolocation can select a price market but does not write a country to the URL",async({page})=>{
 await page.goto("/tr/tractors/?q=Belarus",{waitUntil:"domcontentloaded"});
 await expect(page.locator("#catalog-price-country")).toHaveValue("BR");
 await expect(page).not.toHaveURL(/country=/);
 const de=page.locator('[data-language-choice][data-language-code="de"]').first();
 await expect(de).not.toHaveAttribute("href",/country=/);
});
