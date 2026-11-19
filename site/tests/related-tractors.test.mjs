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
