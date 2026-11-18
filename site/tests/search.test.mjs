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
