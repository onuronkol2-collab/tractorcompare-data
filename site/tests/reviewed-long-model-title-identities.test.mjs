import test from "node:test";
import assert from "node:assert/strict";
import {REVIEWED_LONG_TITLE_ROWS,reviewedLongTitleRow} from "../src/lib/reviewed-long-model-title-identities.ts";
import {modelSeoMetadata,modelStructuredData} from "../src/lib/model-seo.ts";
const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
function model(row){return {tractor_id:"reviewed-fixture",brand_name:row.brand,model_name:row.model,
  variant:row.rawVariant,market:row.rawMarket,model_year:row.year,horsepower:null,
  specifications:[],slug:"reviewed-fixture"};}
test("53 exact reviewed long identities remain in every locale and original source metadata is unchanged",()=>{
 assert.equal(REVIEWED_LONG_TITLE_ROWS.length,53);
 const titles=new Map();
 for(const row of REVIEWED_LONG_TITLE_ROWS){
  const m=model(row);
  assert.equal(reviewedLongTitleRow(row.brand,row.model,row.rawVariant,row.rawMarket,row.year),row);
  assert.equal(reviewedLongTitleRow(row.brand,row.model,row.rawVariant+" revised",row.rawMarket,row.year),undefined);
  assert.equal(reviewedLongTitleRow(row.brand,row.model,row.rawVariant,row.rawMarket+" revised",row.year),undefined);
  assert.equal(reviewedLongTitleRow(row.brand,row.model,row.rawVariant,row.rawMarket,1901),undefined);
  const localizedTitles=new Set();
  for(const lang of locales){
   const meta=modelSeoMetadata(m,lang);
   assert.ok(meta.title.includes(row.brand+" "+row.model),lang+" identity");
   assert.ok(meta.title.includes(row.variant),lang+" equipment: "+meta.title);
   if(row.year!==null)assert.ok(meta.title.includes(String(row.year)),lang+" year");
   assert.ok(!meta.title.includes("…"));
   assert.ok(meta.description.includes(row.rawVariant),lang+" original variant context");
   const json=modelStructuredData(m,lang,"https://tractorvs.example")["@graph"][2];
   assert.equal(json.disambiguatingDescription,[row.rawVariant,row.rawMarket,row.year].filter(x=>x!==null).join(" · "));
   const key=lang+"::"+meta.title;
   assert.ok(!titles.has(key),"Duplicate reviewed title: "+key);
   titles.set(key,row.model);
   assert.ok(!localizedTitles.has(meta.title),lang+" same cross-locale title: "+meta.title);
   localizedTitles.add(meta.title);
  }
 }
 assert.equal(titles.size,530);
});
test("source-conflict records never gain a new asserted power or unscoped drive type",()=>{
 for(const row of REVIEWED_LONG_TITLE_ROWS.filter(x=>x.brand==="Mahindra"&&/^ARJUN/.test(x.model))){
  const t=modelSeoMetadata(model(row),"en").title;
  assert.doesNotMatch(t,/\b(?:2WD|4WD)\b/);
 }
 const tony=REVIEWED_LONG_TITLE_ROWS.find(r=>r.model==="TONY 8700 V");
 assert.match(modelSeoMetadata(model(tony),"en").title,/mechanical-hydrostatic hybrid/);
});
