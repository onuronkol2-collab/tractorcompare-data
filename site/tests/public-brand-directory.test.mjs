import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {publicBrandDirectory} from "../src/lib/public-brand-directory.mjs";
import {matchesDirectoryEvidence} from "../src/lib/brand-directory-filter.mjs";
import {catalogBrandIndex} from "../src/lib/catalog-brand-index.mjs";
import {BRAND_DIRECTORY_COPY} from "../src/lib/brand-directory-i18n.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const row=(id,brand,market,specs=[],status="published")=>({tractor_id:id,slug:"model-"+id,brand_name:brand,market,specifications:specs,status});
test("directory totals and anchors match published catalogue without invented values",()=>{
 const evidence={verified_at:"2026-11-27",source_url:"https://example.org/spec"};
 const models=[row("a","TAFE","India",[evidence]),row("b","TAFE",null),row("c","Sonalika","Global",[evidence,evidence]),row("d","Draft","India",[],"draft")];
 const data=publicBrandDirectory(models);
 assert.equal(data.length,2);
 assert.equal(data.reduce((sum,x)=>sum+x.count,0),3);
 assert.equal(data.reduce((sum,x)=>sum+x.withSources,0),2);
 const tafe=data.find(x=>x.name==="TAFE");
 assert.deepEqual(tafe.markets,["India"]);assert.equal(tafe.unknownMarket,1);
 assert.equal(tafe.anchorId,catalogBrandIndex(models.slice(0,3)).find(x=>x.name==="TAFE").anchorId);
 assert.throws(()=>publicBrandDirectory([models[0],models[0]]),/Duplicate/);
 assert.deepEqual(publicBrandDirectory([]),[]);
});
test("ten real localized directory routes and SSR catalogue anchor links",()=>{
 for(const lang of LOCALES){assert.equal(BRAND_DIRECTORY_COPY[lang].length,13);assert.ok(BRAND_DIRECTORY_COPY[lang].every(x=>x.trim()));}
 for(const path of ["src/pages/brands/index.astro","src/pages/tr/brands/index.astro","src/pages/[locale]/brands/index.astro"])assert.match(read(path),/<BrandDirectory/);
 assert.match(read("src/pages/[locale]/brands/index.astro"),/NEW_LOCALES.map/);
 const view=read("src/components/BrandDirectory.astro");
 assert.match(view,/href=\{catalogPath\+"#"\+row.anchorId\}/);
 assert.match(view,/indexable=\{indexable\}/);
 assert.match(view,/data-directory-controls hidden/);
 assert.match(view,/lang==="en"\|\|lang==="tr"/);
 assert.match(read("src/components/HomeExperience.astro"),/localizedPath\(lang,"\/brands\/"\)/);
 assert.match(read("src/components/BrandDiscovery.astro"),/localizedPath\(lang,"\/brands\/"\)/);
});

test("source and market filters intersect on the same published model, never different records",()=>{
 const evidence={verified_at:"2026-11-27",source_url:"https://example.org/spec"};
 const models=[row("a","TAFE","India",[evidence]),row("b","TAFE","Europe"),
  row("c","TAFE","Europe",[evidence],"draft"),row("d","TAFE",null,[evidence])];
 const [brand]=publicBrandDirectory(models);
 assert.deepEqual(brand.sourceMarkets,["India"]);
 assert.equal(brand.withSources,2);
 assert.equal(matchesDirectoryEvidence(brand,"Europe",false),true);
 assert.equal(matchesDirectoryEvidence(brand,"Europe",true),false);
 assert.equal(matchesDirectoryEvidence(brand,"India",true),true);
 assert.equal(matchesDirectoryEvidence(brand,"",true),true);
 assert.equal(matchesDirectoryEvidence(brand,"Global",false),false);
});
