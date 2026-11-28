import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES,localizedPath} from "../src/lib/locales.ts";
import {practicalGuideLinks,editorialPracticalTools} from "../src/lib/practical-guide-links.ts";
const read=path=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
test("all locale guides and editorial tools expose existing planning anchors",()=>{
 const planning=read("components/FarmInvestmentPlanning.astro");
 const cost=read("components/FarmCost.astro");
 for(const lang of LOCALES){
  const base=localizedPath(lang,"/guides/farm-cost-calculator/");
  for(const anchor of ["farm-ownership-plan","farm-field-plan"]){
   for(const group of [practicalGuideLinks(lang),editorialPracticalTools(lang)]){
    const match=group.links.filter(x=>x.href===base+"#"+anchor);
    assert.equal(match.length,1);
    assert.ok(match[0].label.trim().length>2);
   }
   assert.ok(planning.includes('id="'+anchor+'"'));
   assert.ok(cost.includes('href="#'+anchor+'"'));
  }
 }
 assert.match(planning,/target\.open=true/);
 assert.match(planning,/addEventListener\("hashchange",revealLinkedPlan\)/);
});
