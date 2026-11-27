import test from "node:test";
import assert from "node:assert/strict";
import {findTractorSuggestions, matchesTractorTerms, normalizeTractorQuery} from "../src/lib/search.ts";
import {matchesCatalogueFacet, compareCatalogueRows} from "../src/lib/catalog-facets.mjs";

const row=(model)=>({brand:"Demo",model,variant:null,year:null,horsepower:null,specs:0,url:"/tractors/example/"});

test("catalogue and home search preserve non-Latin distinctions and fold only Latin accents",()=>{
 for(const [left,right] of [["Й","И"],["Ё","Е"],["ガ","カ"],["कि","क"]]){
  assert.notEqual(normalizeTractorQuery(left),normalizeTractorQuery(right));
  assert.equal(matchesTractorTerms(normalizeTractorQuery(right),[normalizeTractorQuery(left)]),false);
  assert.deepEqual(findTractorSuggestions([row(right),row(left)],left).map(x=>x.model),[left]);
 }
 assert.equal(normalizeTractorQuery("Га\u0301"),"га\u0301");
 assert.equal(normalizeTractorQuery("BAŞAK  TRAKTÖR"),"basak traktor");
 assert.equal(normalizeTractorQuery("ＴＡＦＥ  7515"),"tafe 7515");
 assert.equal(normalizeTractorQuery("カ\u3099"),"ガ");
});

test("normalized whitespace improves exact ranking without changing stored model identity",()=>{
 const models=[row("X5.110"),row("X5.110 PLUS")];
 assert.equal(findTractorSuggestions(models,"demo   x5.110")[0],models[0]);
 assert.equal(models[0].model,"X5.110");
 assert.deepEqual(findTractorSuggestions(models,"x5 110").map(x=>x.model),["X5.110","X5.110 PLUS"]);
});

test("numeric catalogue filters reject unknown and coercible pseudo-values",()=>{
 for(const power of [null,undefined,""," ",false,true,[],[50],"0x32","1e2",0,-1,Infinity,NaN]){
  assert.equal(matchesCatalogueFacet({power},{power:"up50"}),false,String(power));
  assert.equal(matchesCatalogueFacet({power},{}),true);
 }
 for(const year of [null,undefined,""," ",false,true,[],[2026],"0x7ea","2e3",0,-1,2020.5,10000,NaN]){
  assert.equal(matchesCatalogueFacet({year},{year:"older"}),false,String(year));
  assert.equal(matchesCatalogueFacet({year},{year:"recent"}),false,String(year));
 }
 assert.equal(matchesCatalogueFacet({power:"50.0",year:"2020"},{power:"up50",year:"recent"}),true);
});

test("invalid numerical rows sort behind valid rows in every numeric order",()=>{
 const rows=[{name:"invalid A",power:" ",year:" "},{name:"valid B",power:"100",year:"2024"},{name:"invalid C",power:-2,year:false},{name:"valid D",power:50,year:2019}];
 for(const [sort,expected] of [["powerAsc",["valid D","valid B"]],["powerDesc",["valid B","valid D"]],["newest",["valid B","valid D"]]]){
  const sorted=[...rows].sort((a,b)=>compareCatalogueRows(a,b,sort));
  assert.deepEqual(sorted.map(x=>x.name),[...expected,"invalid A","invalid C"]);
 }
});
