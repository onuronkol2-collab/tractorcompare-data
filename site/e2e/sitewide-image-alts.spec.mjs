import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Never send forum data or analytics requests to third parties in local smoke.
test.beforeEach(async ({page})=>{
  await page.route("**/*",route=>{
    const host=new URL(route.request().url()).hostname;
    return host==="127.0.0.1"||host==="localhost"
      ?route.continue():route.abort();
  });
});

async function verifyRenderedImageAlts(page,route){
  const response=await page.goto(route,{waitUntil:"domcontentloaded"});
  expect(response?.status(),"Page route "+route).toBe(200);
  const images=await page.locator("img").evaluateAll(nodes=>nodes.map((img,i)=>({
    index:i+1,src:img.getAttribute("src")||"",
    hasAlt:img.hasAttribute("alt")
  })));
  expect(images.filter(img=>!img.hasAlt),
    "Missing alt after browser rendering on "+route).toEqual([]);
  return images;
}

test("ten localized forum pages include valid alt attributes in toolbar and dialogs",async({page})=>{
  for(const lang of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"]){
    const path=lang==="en"?"/forum/":"/"+lang+"/forum/";
    const images=await verifyRenderedImageAlts(page,path);
    expect(images.length,"Expected forum avatar and dialog images on "+path)
      .toBeGreaterThanOrEqual(3);
    // These avatars repeat the immediately adjacent accessible member name.
    // Keep their decorative alt=""; do not stuff SEO keywords into them.
    await expect(page.locator("[data-member-toolbar-avatar]")).toHaveAttribute("alt","");
    await expect(page.locator("[data-member-avatar]")).toHaveAttribute("alt","");
  }
});

test("public home/catalogue/comparison/guides/article pages have no absent alt",async({page})=>{
  for(const path of [
    "/","/tr/","/tr/tractors/","/tr/compare/","/tr/articles/",
    "/guides/tractor-technical-terms/","/pt-br/guides/choosing-a-tractor/"
  ])await verifyRenderedImageAlts(page,path);
});

test("axe image-alt accessibility rule accepts decorative forum avatars",async({page})=>{
  await page.goto("/tr/forum/",{waitUntil:"domcontentloaded"});
  const report=await new AxeBuilder({page}).withRules(["image-alt"]).analyze();
  expect(report.violations.map(v=>({rule:v.id,
    targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});
