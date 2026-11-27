import {test} from "node:test";
import assert from "node:assert/strict";
import {farmCost,farmAreaInHectares} from "../src/lib/farm-cost.mjs";
import {farmCostText} from "../src/lib/farm-cost-i18n.ts";
import {LOCALES} from "../src/lib/locales.ts";
const base={area:10,width:3,speed:6,efficiency:75,fuel:8,price:2,annualHours:200,other:4,fixed:100};
test("field capacity, time, hourly/decare/hectare fuel and annual costs use consistent units",()=>{
 const r=farmCost(base);
 assert.equal(r.capacity,1.35);
 assert.ok(Math.abs(r.time-10/1.35)<1e-9);
 assert.equal(r.hourly,16);
 assert.equal(r.perDekar,r.perHa/10);
 assert.ok(Math.abs(r.fieldCost-r.perHa*10)<1e-9);
 assert.equal(r.annualFuel,3200);
 assert.equal(r.annualTotal,4100);
});
test("zero price, fuel, hours and nonzero fixed costs remain legitimate",()=>{
 const r=farmCost({...base,fuel:0,price:0,annualHours:0});
 assert.equal(r.fieldCost,0);assert.equal(r.annualTotal,100);
});
test("invalid input fails closed rather than yielding infinity or NaN",()=>{
 for(const patch of [{area:0},{width:0},{speed:0},{efficiency:101},{efficiency:0},{fuel:-1},{price:Infinity},{annualHours:8761},{other:NaN},{fixed:"12"},{area:undefined}])assert.throws(()=>farmCost({...base,...patch}),RangeError);
});
test("all ten locales have complete distinct human-readable calculator strings",()=>{
 for(const lang of LOCALES){
  const copy=farmCostText(lang);
  assert.equal(Object.keys(copy).length,28);
  assert.ok(Object.values(copy).every(value=>typeof value==="string"&&value.trim().length>0));
 }
 assert.equal(new Set(LOCALES.map(lang=>farmCostText(lang).title)).size,10);
});

test("international area units and operating cost exclude annual fixed costs",()=>{assert.equal(farmAreaInHectares(100,"decare"),10);assert.ok(Math.abs(farmAreaInHectares(1,"acre")-0.40468564224)<1e-12);assert.equal(farmAreaInHectares(15,"mu"),1);assert.throws(()=>farmAreaInHectares(1,"constructor"));assert.throws(()=>farmAreaInHectares(0,"ha"));const x=farmCost(base);assert.ok(Math.abs(x.operatingField-(16+4)*x.time)<1e-9);assert.ok(Math.abs(x.operatingPerHa*10-x.operatingField)<1e-9);});


test("farm planning metadata describes real locale pages without unsupported rich result claims",async()=>{
 const {farmToolPageData}=await import("../src/lib/farm-tool-page-data.ts");
 const {localizedPath,LOCALE_TAGS}=await import("../src/lib/locales.ts");
 const {readFileSync}=await import("node:fs");
 const root=new URL("https://tractorvs.com/");
 for(const lang of LOCALES){
  const c=farmCostText(lang);
  for(const [path,component] of [["/guides/farm-cost-calculator/","FarmCost"],["/farm-advisor/","FarmAdvisor"]]){
   const data=farmToolPageData(lang,path,root,c.title,c.description);
   const [page,crumb]=data["@graph"];
   const url=new URL(localizedPath(lang,path),root).toString();
   assert.equal(page.url,url);assert.equal(page.inLanguage,LOCALE_TAGS[lang]);
   assert.equal(page.name,c.title);assert.equal(page.description,c.description);
   assert.equal(page.breadcrumb["@id"],crumb["@id"]);
   assert.deepEqual(crumb.itemListElement.map(x=>x.item),[new URL(localizedPath(lang,"/"),root).toString(),url]);
   assert.equal(crumb.itemListElement[1].name,page.name);
   assert.doesNotMatch(JSON.stringify(data),/AggregateRating|SoftwareApplication|WebApplication|"offers"|"review"/);
   const source=readFileSync(new URL("../src/components/"+component+".astro",import.meta.url),"utf8");
   assert.match(source,/PUBLIC_INDEXING_ENABLED==="true"&&Astro.site/);
   assert.match(source,/structuredData=\{schema\}/);
   assert.match(source,/class="tool-breadcrumb" aria-label=\{BREADCRUMB_LABELS\[lang\]\}/);
  }
 }
});
