import test from "node:test";
import assert from "node:assert/strict";
import {normalizeTractorQuery} from "../src/lib/search.ts";
test("Turkish and accented model searches find their official spellings",()=>{
  for(const [term,target] of [
    ["Basak","Başak"],["BAŞAK","Başak"],["TUMOSAN","Tümosan"],
    ["McCormick","McCormick"],["Citroen","Citroën"],
    ["TRAKTÖR","traktor"],
  ]) assert.equal(normalizeTractorQuery(term),normalizeTractorQuery(target));
});
test("Non-Latin scripts remain searchable and original names are not mutated",()=>{
  assert.equal(normalizeTractorQuery("トラクター"),"トラクター");
  assert.equal(normalizeTractorQuery("拖拉机"),"拖拉机");
  assert.equal(normalizeTractorQuery("Беларус"),"беларус");
});
test("Multiword model variants tolerate accents without changing digits",()=>{
  assert.ok(normalizeTractorQuery("Başak Traktör 2075 BK").includes(normalizeTractorQuery("Basak Traktor 2075")));
});

import {findTractorSuggestions} from "../src/lib/search.ts";
const sample = [
  {brand:"Belarus",model:"80.1",variant:"D-243",year:null,horsepower:81,specs:27,url:"/tr/tractors/belarus-80/"},
  {brand:"Belarus",model:"82.1",variant:"D-243",year:null,horsepower:81,specs:27,url:"/tr/tractors/belarus-82/"},
  {brand:"Başak Traktör",model:"2075 BK",variant:null,year:null,horsepower:75,specs:23,url:"/tr/tractors/basak/"},
  {brand:"McCormick",model:"X5.100",variant:"Stage V",year:null,horsepower:100,specs:37,url:"/tr/tractors/mccormick/"},
];
test("suggestions match published brand, model, and Turkish accent variants",()=>{
  assert.deepEqual(findTractorSuggestions(sample,"Belarus").map(x=>x.model),["80.1","82.1"]);
  assert.equal(findTractorSuggestions(sample,"Basak 2075")[0]?.model,"2075 BK");
  assert.equal(findTractorSuggestions(sample,"x5.100")[0]?.brand,"McCormick");
  assert.equal(findTractorSuggestions(sample,"Belarus 82")[0]?.model,"82.1");
});
test("suggestions prioritize exact matches and respect cap",()=>{
  assert.equal(findTractorSuggestions(sample,"80.1")[0]?.model,"80.1");
  assert.equal(findTractorSuggestions(sample,"Belarus",1).length,1);
  assert.deepEqual(findTractorSuggestions(sample,"Belarus",0),[]);
});
test("empty and absent models return no phantom suggestions",()=>{
  assert.deepEqual(findTractorSuggestions(sample,""),[]);
  assert.deepEqual(findTractorSuggestions(sample,"    "),[]);
  assert.deepEqual(findTractorSuggestions(sample,"Fendt 9999"),[]);
});
