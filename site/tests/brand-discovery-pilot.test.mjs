import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BRAND_DISCOVERY_PILOTS,getBrandDiscoveryPilot,listedBrandCollections,
  MIN_PUBLISHED_BRAND_MODELS,verifiedModelSources} from "../src/lib/brand-discovery-pilot.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const make=(brand,n,status)=>Array.from({length:n},(_,i)=>({
 tractor_id:brand+"-"+i,slug:brand.toLowerCase()+"-"+i,
 brand_name:brand,model_name:"M"+(n-i),status,
 specifications:[{spec_name:"Rated engine power",spec_value:"80",unit:"hp",
  verified_at:"2026-11-01",source_url:"https://example.org/manufacturer-model",
  source_publisher:"Verified original"}]
}));
test("only five intentional demand-led brand pilots, no mass programmatic brand spam",()=>{
 assert.deepEqual(BRAND_DISCOVERY_PILOTS.map(x=>x.slug),["mccormick","valtra","tafe","sonalika","swaraj"]);
 assert.equal(getBrandDiscoveryPilot("unknown"),null);
 assert.ok(MIN_PUBLISHED_BRAND_MODELS>=10);
});
test("only valid published models from the public catalog form pilot pages",()=>{
 const data=[
  ...make("McCormick",20,"published"),
  ...make("Valtra",11,"published"),
  ...make("Zetor",30,"published"),
  ...make("McCormick",5,"draft"),
  ...make("Valtra",2,"archived")
 ];
 const result=listedBrandCollections(data);
 assert.deepEqual(result.map(x=>({name:x.name,count:x.models.length})),
  [{name:"McCormick",count:20},{name:"Valtra",count:11}]);
 assert.equal(listedBrandCollections(make("Valtra",9,"published")).length,0);
 assert.equal(listedBrandCollections([]).length,0);
});
test("brand collections are deterministic and fail closed on duplicate identities",()=>{
 const result=listedBrandCollections(make("Valtra",12,"published"));
 assert.equal(result[0].models[0].model_name,"M1");
 const dupe=[...make("McCormick",10,"published")];
 dupe[9].tractor_id=dupe[8].tractor_id;
 assert.throws(()=>listedBrandCollections(dupe),/Duplicate published brand identity/);
});
test("source links are only actual verified HTTP(S) evidence, not guessed",()=>{
 const models=make("Valtra",1,"published");
 const specs=models[0].specifications;
 specs.push({verified_at:null,source_url:"https://not-a-source.test"});
 specs.push({verified_at:"2026-11-01",source_url:"javascript:alert(1)"});
 specs.push({...specs[0]});
 const sources=verifiedModelSources(models[0]);
 assert.equal(sources.length,1);
 assert.equal(sources[0].publisher,"Verified original");
});
test("both published EN/TR pages are crawlable and 8 unreviewed locale URLs are not asserted",()=>{
 for(const path of ["src/pages/brands/[slug].astro","src/pages/tr/brands/[slug].astro"]){
  const file=source(path);
  assert.match(file,/listedBrandCollections\(catalog\.tractors\)/);
  assert.match(file,/getStaticPaths/);
 }
 const view=source("src/components/BrandDiscovery.astro");
 assert.match(view,/availableLocales=\{\["en","tr"\]\}/);
 assert.match(view,/indexableLocales=\{\["en","tr"\]\}/);
 assert.match(view,/<h1 id="brand-heading">/);
 assert.match(view,/structuredData=\{schema\}/);
 assert.match(view,/modelPrefix\+model\.slug\+"\/"/);
 assert.match(view,/sourceById\.get\(model\.tractor_id\)/);
 assert.doesNotMatch(view,/noindex,nofollow/);
});
test("original catalogue keeps SSR model links and direct full-brand filter navigation",()=>{
 const view=source("src/components/TractorCatalog.astro");
 assert.match(view,/catalog\.tractors\.map\(\(tractor\)=>/);
 assert.match(view,/href=\{detailPrefix\+tractor\.slug\+"\/"\}/);
 assert.match(view,/href=\{"#"\+brand\.anchorId\}/);
 assert.match(view,/data-catalog-brand-jump/);
 assert.match(view,/brandGuides\.get\(brand\.name\)/);
});


test("new demand-led brand pilots require at least ten published source-linked records",()=>{
 for(const brand of ["TAFE","Sonalika","Swaraj"]){
  const rows=make(brand,12,"published");
  assert.equal(listedBrandCollections(rows)[0].models.length,12);
  for(const row of rows.slice(0,3))row.specifications=[];
  assert.equal(listedBrandCollections(rows).length,0);
  rows[0].specifications=make(brand,1,"published")[0].specifications;
  assert.equal(listedBrandCollections(rows).length,1);
 }
 assert.equal(listedBrandCollections(make("LS Tractor",7,"published")).length,0);
});
test("brand discovery retains all server rendered links and adds optional local filters and exact model comparison",()=>{
 const view=source("src/components/BrandDiscovery.astro");
 assert.match(view,/data-brand-filter hidden/);
 assert.match(view,/data-brand-record data-search=/);
 assert.match(view,/data-brand-market/);
 assert.match(view,/matchesTractorTerms\(/);
 assert.match(view,/record.hidden=!match/);
 assert.match(view,/panel.hidden=false/);
 assert.match(view,/encodeURIComponent\(model.tractor_id\)/);
 assert.match(view,/rel="nofollow"/);
 assert.match(view,/role="status" aria-live="polite"/);
 assert.match(view,/availableLocales=\{\["en","tr"\]\}/);
});


test("market coverage counts records once and preserves unknown and distinct market identities",async()=>{
 const {brandMarketCoverage}=await import("../src/lib/brand-discovery-pilot.mjs");
 const a=make("TAFE",4,"published");
 a[0].market="Turkey";a[1].market="Turkey";a[1].specifications=[];a[2].market="India";a[3].market=null;
 assert.deepEqual(brandMarketCoverage(a),[{market:"Turkey",records:2,withSources:1},{market:"India",records:1,withSources:1},{market:null,records:1,withSources:1}]);
 assert.deepEqual(brandMarketCoverage([]),[]);
});
test("same-brand exact pair selection preserves SSR links and rejects duplicate choices",()=>{
 const view=source("src/components/BrandDiscovery.astro");
 assert.match(view,/brandMarketCoverage\(models\)/);
 assert.match(view,/data-brand-pair action=\{localizedPath\(lang,"\/compare\/"\)\} method="get" hidden/);
 assert.match(view,/select name="left" required/);
 assert.match(view,/select name="right" required/);
 assert.match(view,/left.value===right.value/);
 assert.match(view,/if\(submit.disabled\)event.preventDefault\(\)/);
 assert.match(view,/data-brand-source-only/);
 assert.match(view,/record.dataset.sourced==="yes"/);
 assert.match(view,/modelPrefix\+model.slug\+"\/"/);
});
