import test from "node:test";
import assert from "node:assert/strict";
import {LOCALES} from "../src/lib/locales.ts";
import {researchText} from "../src/lib/research-i18n.ts";
import {RESEARCH_KEY,RESEARCH_LIMITS,normalizeResearch,toggleFavorite,rememberModel,saveComparison,removeComparison,availableResearch,readResearch,writeResearch} from "../src/lib/research-state.mjs";
test("favorites and viewing history are unique, recent-first and bounded",()=>{
 let s=normalizeResearch(null);
 for(let i=0;i<100;i++){s=toggleFavorite(s,"m"+i);s=rememberModel(s,"m"+i);}
 assert.equal(s.favorites.length,RESEARCH_LIMITS.favorites);
 assert.equal(s.recent.length,RESEARCH_LIMITS.recent);
 assert.equal(s.recent[0],"m99");
 s=rememberModel(s,"m98");assert.deepEqual(s.recent.slice(0,2),["m98","m99"]);
 s=toggleFavorite(s,"m99");assert.ok(!s.favorites.includes("m99"));
});
test("stored comparisons preserve order and view without duplicates",()=>{
 let s=saveComparison(null,{left:"a",right:"b",view:"shared"});
 s=saveComparison(s,{left:"a",right:"b",view:"shared"});
 s=saveComparison(s,{left:"b",right:"a",view:"different"});
 s=saveComparison(s,{left:"a",right:"a",view:"all"});
 assert.equal(s.comparisons.length,2);
 assert.deepEqual(removeComparison(s,s.comparisons[0]).comparisons,[{left:"a",right:"b",view:"shared"}]);
});
test("malformed and unpublished entries are never exposed or made into links",()=>{
 const s=normalizeResearch({favorites:["a","a","javascript:alert(1)",{},null,"missing"],recent:["a"],comparisons:[
 {left:"a",right:"missing",view:"all"},{left:"a",right:"b",view:"all"},{left:"a",right:"b",view:"bad"}]});
 assert.deepEqual(availableResearch(s,new Set(["a","b"])),{favorites:["a"],recent:["a"],comparisons:[{left:"a",right:"b",view:"all"}]});
});
test("storage corruption and blocked writes are handled without storing unrelated data",()=>{
 const storage=new Map();
 const adapter={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
 storage.set(RESEARCH_KEY,"not JSON");assert.deepEqual(readResearch(adapter),normalizeResearch(null));
 writeResearch(adapter,{favorites:["a"],recent:[],comparisons:[],email:"never stored"});
 assert.deepEqual(readResearch(adapter),{favorites:["a"],recent:[],comparisons:[]});
 assert.throws(()=>writeResearch({setItem(){throw Error("blocked")}},null));
});
test("all ten locales have complete research controls",()=>{
 for(const lang of LOCALES){const copy=researchText(lang);for(const key of Object.keys(researchText("en")))assert.ok(copy[key].trim(),lang+" "+key);}
});
