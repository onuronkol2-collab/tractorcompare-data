import assert from "node:assert/strict";
import test from "node:test";
import {morePublishedTractors} from "../src/lib/related-tractors.ts";
import {localizedPath, LOCALES} from "../src/lib/locales.ts";

const make = (slug, brand_name, market, horsepower) => ({
  slug, tractor_id:slug, brand_name, model_name:slug,
  market, horsepower, variant:null, model_year:null,
  brand_country:null, brand_website_url:null, engine:null,
  transmission:null, drivetrain:null, weight_kg:null, specifications:[]
});

test("only the public input catalogue contributes crawlable related model URLs", () => {
  const current=make("landini-5-085","Landini","Europe",75);
  const available=[
    make("belarus-82-1","Belarus","Europe",82),
    make("landini-5-100","Landini","Europe",95),
    make("landini-5-110","Landini","Europe",105),
    make("case-puma-150","Case IH","US",150),
    current,
  ];
  assert.deepEqual(morePublishedTractors(current,available).map(t=>t.slug),[
    "landini-5-100","landini-5-110","belarus-82-1"
  ]);
  for(const locale of LOCALES){
    const links=morePublishedTractors(current,available).map(t=>
      localizedPath(locale,"/tractors/"+t.slug+"/"));
    assert.equal(links.length,3);
    assert.ok(links.every(url=>url.startsWith(locale==="en"?"/tractors/":"/"+locale+"/tractors/")));
  }
});

test("same brand and market prioritized; missing power is not fabricated", () => {
  const current=make("x5","McCormick","Europe",100);
  const published=[
    make("z-far","McCormick","Europe",null),
    make("x-near","New Holland","Europe",101),
    make("b-closest","McCormick","Europe",110),
    make("same-brand-us","McCormick","US",100),
    make("x5","McCormick","Europe",100),
  ];
  assert.deepEqual(morePublishedTractors(current,published,4).map(x=>x.slug),
    ["b-closest","z-far","same-brand-us","x-near"]);
  assert.equal(morePublishedTractors(current,[current]).length,0);
  assert.equal(morePublishedTractors(current,published,0).length,0);
});

test("evidence-backed HST and GEAR entries of the exact same LS J27 model cross-link before unrelated models",()=>{
  const current={...make("ls-j27-hst","LS Tractor","global",27),model_name:"J27",variant:"HST"};
  const gear={...make("ls-j27-gear","LS Tractor","global",null),model_name:"J27",variant:"GEAR"};
  const other=make("ls-j24","LS Tractor","global",27);
  const different=make("brand-j27","Different Brand","global",27);
  const results=morePublishedTractors(current,[different,other,gear,current],3);
  assert.deepEqual(results.map(row=>row.slug),["ls-j27-gear","ls-j24","brand-j27"]);
  assert.equal(results[0].variant,"GEAR");
  assert.ok(results.every(row=>row.tractor_id!==current.tractor_id));
});

test("all same-brand models receive a second discovery path even with sparse power data", async () => {
  const {modelDiscoveryLinks} = await import("../src/lib/related-tractors.ts");
  const family = [2,3,4,8,10,12,14].map(n=>make("model-"+n,"Example","Europe",null));
  const singleton = make("other","Other brand","US",null);
  const published = [...family,singleton];
  const inbound = new Set();
  for (const model of family) {
    const links = modelDiscoveryLinks(model,published);
    assert.deepEqual(links.slice(0,3),morePublishedTractors(model,published));
    assert.ok(links.length<=4 && links.every(row=>row!==model && row!==singleton));
    assert.equal(new Set(links.map(row=>row.slug)).size,links.length);
    links.forEach(row=>inbound.add(row.slug));
  }
  assert.equal(inbound.size,family.length);
  assert.deepEqual(modelDiscoveryLinks(singleton,published),morePublishedTractors(singleton,published));
});


test("same-market source-matched cross-brand discovery adds one link without replacing catalogue links",async()=>{
 const {modelDiscoveryLinks,sourceMatchedMarketPeer}=await import("../src/lib/related-tractors.ts");
 const backed=(slug,brand,market,hp,url,extra={})=>({...make(slug,brand,market,hp),specifications:[{spec_id:slug,canonical_key:"engine_rated_power",spec_name:"Engine power",spec_value:String(hp),unit:"hp",comparison_class:"engine",measurement_standard:"manufacturer specification",rated_rpm:null,evidence_text:"Exact model manufacturer table",verified_at:"2026-11-20T10:00:00Z",source_url:url,source_type:"manufacturer_specification",source_publisher:brand,...extra}]});
 const current=backed("x5","McCormick","Europe",100,"https://www.mccormick-tractors.com/catalog.pdf");
 const good=backed("landini","Landini","Europe",103,"https://www.landini.it/catalog.pdf");
 const unknown=backed("unknown","Landini",null,100,"https://www.landini.it/catalog.pdf");
 const otherMarket=backed("us","Landini","US",100,"https://www.landini.it/catalog.pdf");
 const unsupported=backed("unsupported","Landini","Europe",100,"https://www.landini.it/catalog.pdf",{evidence_text:null});
 const wrongUnit=backed("wrong-unit","Landini","Europe",100,"https://www.landini.it/catalog.pdf",{unit:"kW"});
 const far=backed("far","Landini","Europe",125,"https://www.landini.it/catalog.pdf");
 const siblings=[1,2,3,4].map(n=>make("x"+n,"McCormick","Europe",100+n));
 const catalogue=[current,good,unknown,otherMarket,unsupported,wrongUnit,far,...siblings];
 assert.equal(sourceMatchedMarketPeer(current,catalogue)?.slug,"landini");
 const links=modelDiscoveryLinks(current,catalogue);
 assert.deepEqual(links.slice(0,3),morePublishedTractors(current,catalogue));
 assert.equal(links.filter(x=>x.slug==="landini").length,1);
 assert.ok(links.length<=5);
 assert.equal(sourceMatchedMarketPeer({...current,market:"International"},catalogue),null);
 assert.equal(sourceMatchedMarketPeer({...current,specifications:[]},catalogue),null);
 assert.equal(sourceMatchedMarketPeer(current,catalogue.filter(x=>x!==good)),null);
 for(const lang of LOCALES)assert.equal(localizedPath(lang,"/tractors/"+good.slug+"/"),(lang==="en"?"":"/"+lang)+"/tractors/landini/");
});
