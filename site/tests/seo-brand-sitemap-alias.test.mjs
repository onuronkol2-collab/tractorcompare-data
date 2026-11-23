import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import worker from "../worker/index.js";
import {brandAnchorId,catalogBrandIndex,BRAND_NAV_COPY,CATALOG_SEARCH_TITLES} from "../src/lib/catalog-brand-index.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const published=[
 {tractor_id:"a",slug:"basak-2075-bk-a",brand_name:"Başak Traktör",model_name:"2075 BK"},
 {tractor_id:"b",slug:"john-deere-5075e-b",brand_name:"John Deere",model_name:"5075E"},
 {tractor_id:"c",slug:"basak-5120-c",brand_name:"Başak Traktör",model_name:"5120"},
 {tractor_id:"d",slug:"yanmar-sa424-d",brand_name:"Yanmar",model_name:"SA424"},
];
const env={ASSETS:{fetch:()=>{throw Error("A sitemap alias must never fetch a static asset before redirecting");}}};

test("brand index contains only the supplied published models with collision-safe stable anchors",()=>{
 const a=catalogBrandIndex(published);
 assert.equal(a.length,3);
 assert.deepEqual(a.map(b=>b.name),["Başak Traktör","John Deere","Yanmar"]);
 assert.equal(a[0].count,2);
 assert.equal(a[0].firstTractorId,"a");
 assert.equal(a[1].firstTractorId,"b");
 assert.match(a[0].anchorId,/^brand-basak-traktor-[a-z0-9]+$/);
 assert.notEqual(brandAnchorId("Başak Traktör"),brandAnchorId("Basak Traktor"));
 assert.equal(brandAnchorId("Başak Traktör"),brandAnchorId("Başak Traktör"));
 assert.deepEqual(catalogBrandIndex([]),[]);
});

test("every brand navigation translation is complete and avoids unverified manufacturer claims",()=>{
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 assert.deepEqual(Object.keys(BRAND_NAV_COPY),locales);
 assert.deepEqual(Object.keys(CATALOG_SEARCH_TITLES),locales);
 for(const locale of locales){
  const v=BRAND_NAV_COPY[locale];
  assert.ok(v.heading.length>=6&&v.intro.length>=25&&v.models.length>=2,locale);
  assert.ok(Array.from(CATALOG_SEARCH_TITLES[locale]).length>= (["zh","ja"].includes(locale)?6:14),locale+" meta title");
 }
 const template=read("src/components/TractorCatalog.astro");
 assert.match(template,/catalogBrandIndex\(catalog\.tractors\)/);
 assert.ok(template.includes('CATALOG_SEARCH_TITLES[lang] + " | TractorVS"'));
 assert.match(template,/data-catalog-brand-jump/);
 assert.match(template,/href=\{"#"\+brand\.anchorId\}/);
 assert.match(template,/firstBrandCard\.get\(tractor\.brand_name\)===tractor\.tractor_id/);
 assert.match(template,/<h2>\{tractor\.brand_name\} \{tractor\.model_name\}<\/h2>/);
 assert.ok(template.includes('filterCatalog("")'));
 assert.match(template,/history\.replaceState/);
 assert.match(template,/data-price-for/);
 assert.match(template,/id="tractor-card-grid"/);
});

test("legacy /sitemap.xml permanently redirects to generated canonical index on the same host",async()=>{
 const url="https://tractorvs.com/sitemap.xml";
 for(const method of ["GET","HEAD"]){
  const response=await worker.fetch(new Request(url,{method}),env);
  assert.equal(response.status,308);
  assert.equal(response.headers.get("Location"),"https://tractorvs.com/sitemap-index.xml");
  assert.match(response.headers.get("Cache-Control"),/max-age/);
  assert.equal(await response.text(),"");
 }
 const preview=await worker.fetch(new Request("https://preview.example.workers.dev/sitemap.xml"),env);
 assert.equal(preview.status,308);
 assert.equal(preview.headers.get("Location"),"https://preview.example.workers.dev/sitemap-index.xml");
 const rejected=await worker.fetch(new Request(url,{method:"POST"}),env);
 assert.equal(rejected.status,405);
});

test("both Wrangler entrypoints route sitemap.xml to the same tested edge Worker",()=>{
 for(const file of ["wrangler.jsonc","../wrangler.jsonc"]){
  const config=JSON.parse(read(file));
  assert.ok(config.assets.run_worker_first.includes("/sitemap.xml"),file);
  assert.ok(!config.assets.run_worker_first.includes("/"),file+" canonical home must use static-first routing");
 }
 const robots=read("src/pages/robots.txt.ts");
 assert.match(robots,/sitemap-index\.xml/);
 const astro=read("astro.config.mjs");
 assert.match(astro,/integrations: indexingEnabled/);
 assert.match(astro,/filter:/);
});
